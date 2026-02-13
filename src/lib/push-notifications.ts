const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || ''

export function isPushSupported(): boolean {
  return (
    typeof window !== 'undefined' &&
    'serviceWorker' in navigator &&
    'PushManager' in window &&
    'Notification' in window
  )
}

export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (!('serviceWorker' in navigator)) return null

  try {
    const registration = await navigator.serviceWorker.register('/sw.js')
    return registration
  } catch (error) {
    console.error('Service Worker registratie mislukt:', error)
    return null
  }
}

export async function subscribeToPush(
  registration: ServiceWorkerRegistration
): Promise<{ endpoint: string; p256dh: string; auth: string } | null> {
  try {
    const permission = await Notification.requestPermission()
    if (permission !== 'granted') {
      return null
    }

    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY) as BufferSource,
    })

    const json = subscription.toJSON()
    if (!json.endpoint || !json.keys?.p256dh || !json.keys?.auth) {
      return null
    }

    return {
      endpoint: json.endpoint,
      p256dh: json.keys.p256dh,
      auth: json.keys.auth,
    }
  } catch (error) {
    console.error('Push subscribe mislukt:', error)
    return null
  }
}

export async function getExistingSubscription(): Promise<PushSubscription | null> {
  if (!('serviceWorker' in navigator)) return null

  try {
    const registration = await navigator.serviceWorker.ready
    return await registration.pushManager.getSubscription()
  } catch {
    return null
  }
}

export async function unsubscribeFromPush(): Promise<string | null> {
  try {
    const subscription = await getExistingSubscription()
    if (subscription) {
      const endpoint = subscription.endpoint
      await subscription.unsubscribe()
      return endpoint
    }
    return null
  } catch (error) {
    console.error('Push unsubscribe mislukt:', error)
    return null
  }
}

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = window.atob(base64)
  const outputArray = new Uint8Array(rawData.length)
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i)
  }
  return outputArray
}

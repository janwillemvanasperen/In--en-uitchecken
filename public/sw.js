// Service Worker voor push notificaties - Aanwezigheidsregistratie
self.addEventListener('push', function (event) {
  const data = event.data ? event.data.json() : {}

  const options = {
    body: data.body || '',
    icon: '/favicon.ico',
    badge: '/favicon.ico',
    data: {
      url: data.url || '/student/dashboard',
    },
    vibrate: [200, 100, 200],
    tag: data.tag || 'default',
    renotify: true,
  }

  event.waitUntil(
    self.registration.showNotification(
      data.title || 'Aanwezigheidsregistratie',
      options
    )
  )
})

self.addEventListener('notificationclick', function (event) {
  event.notification.close()

  const url = event.notification.data?.url || '/student/dashboard'

  event.waitUntil(
    clients.matchAll({ type: 'window' }).then(function (clientList) {
      for (const client of clientList) {
        if (client.url.includes(url) && 'focus' in client) {
          return client.focus()
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(url)
      }
    })
  )
})

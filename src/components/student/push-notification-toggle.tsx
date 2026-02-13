'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Bell, BellOff, Loader2 } from 'lucide-react'
import {
  isPushSupported,
  registerServiceWorker,
  subscribeToPush,
  getExistingSubscription,
  unsubscribeFromPush,
} from '@/lib/push-notifications'
import { savePushSubscription, deletePushSubscription } from '@/app/student/actions'

export function PushNotificationToggle() {
  const [isSupported, setIsSupported] = useState(false)
  const [isSubscribed, setIsSubscribed] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isToggling, setIsToggling] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const checkStatus = async () => {
      const supported = isPushSupported()
      setIsSupported(supported)

      if (supported) {
        const subscription = await getExistingSubscription()
        setIsSubscribed(!!subscription)
      }
      setIsLoading(false)
    }
    checkStatus()
  }, [])

  const handleEnable = async () => {
    setIsToggling(true)
    setError(null)

    try {
      const registration = await registerServiceWorker()
      if (!registration) {
        setError('Service Worker registratie mislukt')
        setIsToggling(false)
        return
      }

      const subscription = await subscribeToPush(registration)
      if (!subscription) {
        setError('Meldingen toestemming geweigerd of niet beschikbaar')
        setIsToggling(false)
        return
      }

      const result = await savePushSubscription(subscription)
      if (result.error) {
        setError(result.error)
      } else {
        setIsSubscribed(true)
      }
    } catch {
      setError('Er is een fout opgetreden bij het inschakelen van meldingen')
    }

    setIsToggling(false)
  }

  const handleDisable = async () => {
    setIsToggling(true)
    setError(null)

    try {
      const endpoint = await unsubscribeFromPush()
      if (endpoint) {
        await deletePushSubscription(endpoint)
      }
      setIsSubscribed(false)
    } catch {
      setError('Er is een fout opgetreden bij het uitschakelen van meldingen')
    }

    setIsToggling(false)
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Bell className="h-4 w-4" />
            Meldingen
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Laden...
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!isSupported) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <BellOff className="h-4 w-4" />
            Meldingen
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Push meldingen worden niet ondersteund in deze browser.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          {isSubscribed ? <Bell className="h-4 w-4 text-green-600" /> : <BellOff className="h-4 w-4" />}
          Meldingen
        </CardTitle>
        <CardDescription>
          Ontvang herinneringen voor je rooster en check-ins
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {isSubscribed ? (
          <div className="space-y-3">
            <p className="text-sm text-green-600">Meldingen zijn ingeschakeld</p>
            <Button
              variant="outline"
              size="sm"
              onClick={handleDisable}
              disabled={isToggling}
            >
              {isToggling && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Uitschakelen
            </Button>
          </div>
        ) : (
          <Button
            onClick={handleEnable}
            disabled={isToggling}
            size="sm"
          >
            {isToggling && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Meldingen inschakelen
          </Button>
        )}
      </CardContent>
    </Card>
  )
}

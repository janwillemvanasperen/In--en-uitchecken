'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { QRScanner } from './qr-scanner'
import { getUserLocation, isWithinRadius } from '@/lib/geolocation'
import { isWithinScheduleTime } from '@/lib/schedule-validation'
import { checkIn, checkOut } from '@/app/student/actions'
import { formatDuration } from '@/lib/date-utils'
import { MapPin, QrCode, AlertTriangle, CheckCircle, XCircle, Loader2, Clock } from 'lucide-react'
import type { Location, ActiveCheckIn, Schedule } from '@/types'
import { useEffect } from 'react'

interface CheckInClientProps {
  locations: Location[]
  activeCheckIn: ActiveCheckIn | null
  todaySchedule: Schedule | null
  userId: string
}

export function CheckInClient({ locations, activeCheckIn, todaySchedule, userId }: CheckInClientProps) {
  const router = useRouter()
  const [mode, setMode] = useState<'gps' | 'qr'>('gps')
  const [selectedLocationId, setSelectedLocationId] = useState<string>('')
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [showScheduleWarning, setShowScheduleWarning] = useState(false)
  const [scheduleWarningMessage, setScheduleWarningMessage] = useState('')
  const [scannedQrCode, setScannedQrCode] = useState<string | null>(null)
  const [elapsedTime, setElapsedTime] = useState(0)

  // Timer for active check-in
  useEffect(() => {
    if (!activeCheckIn) {
      setElapsedTime(0)
      return
    }

    const checkInTime = new Date(activeCheckIn.check_in_time).getTime()
    const initialElapsed = Math.floor((Date.now() - checkInTime) / 1000)
    setElapsedTime(initialElapsed)

    const interval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - checkInTime) / 1000)
      setElapsedTime(elapsed)
    }, 1000)

    return () => clearInterval(interval)
  }, [activeCheckIn])

  const selectedLocation = locations.find((loc) => loc.id === selectedLocationId)

  async function handleGetLocation() {
    setLoading(true)
    setError(null)

    try {
      const location = await getUserLocation()
      setUserLocation(location)

      if (selectedLocation) {
        const withinRadius = isWithinRadius(
          location.lat,
          location.lng,
          Number(selectedLocation.latitude),
          Number(selectedLocation.longitude),
          500
        )

        if (!withinRadius) {
          setError('Je bent te ver van de geselecteerde locatie (maximaal 500 meter)')
        }
      }
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  function handleQrScan(qrCode: string) {
    setScannedQrCode(qrCode)

    // Find location by QR code
    const location = locations.find((loc) => loc.qr_code === qrCode)
    if (location) {
      setSelectedLocationId(location.id)
      setError(null)
    } else {
      setError('Ongeldige QR code. Deze locatie is niet bekend.')
    }
  }

  async function handleCheckIn() {
    if (!selectedLocationId) {
      setError('Selecteer eerst een locatie')
      return
    }

    setLoading(true)
    setError(null)

    try {
      // Check schedule time if schedule exists
      if (todaySchedule) {
        const validation = isWithinScheduleTime(
          new Date(),
          todaySchedule.start_time,
          todaySchedule.end_time
        )

        if (!validation.isWithin) {
          setScheduleWarningMessage(validation.message)
          setShowScheduleWarning(true)
          setLoading(false)
          return
        }
      }

      // Proceed with check-in
      await performCheckIn()
    } catch (err: any) {
      setError(err.message)
      setLoading(false)
    }
  }

  async function performCheckIn() {
    const result = await checkIn({
      locationId: selectedLocationId,
      userLat: mode === 'gps' && userLocation ? userLocation.lat : undefined,
      userLng: mode === 'gps' && userLocation ? userLocation.lng : undefined,
      qrCode: mode === 'qr' ? scannedQrCode || undefined : undefined,
      expectedStart: todaySchedule?.start_time || '00:00:00',
      expectedEnd: todaySchedule?.end_time || '23:59:59',
    })

    if (result.error) {
      setError(result.error)
    } else {
      router.push('/student/dashboard')
      router.refresh()
    }

    setLoading(false)
    setShowScheduleWarning(false)
  }

  async function handleCheckOut() {
    setLoading(true)
    setError(null)

    const result = await checkOut()

    if (result.error) {
      setError(result.error)
    } else {
      router.push('/student/dashboard')
      router.refresh()
    }

    setLoading(false)
  }

  // If user is checked in, show check-out interface
  if (activeCheckIn) {
    return (
      <Card className="max-w-2xl mx-auto border-green-200 bg-green-50/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-green-700">
            <CheckCircle className="h-6 w-6" />
            Je bent ingecheckt
          </CardTitle>
          <CardDescription>
            {activeCheckIn.locations.name}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="bg-white rounded-lg p-6 space-y-4">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Ingecheckt om</p>
              <p className="text-lg font-medium">
                {new Date(activeCheckIn.check_in_time).toLocaleTimeString('nl-NL', {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </p>
            </div>

            <div>
              <p className="text-sm text-muted-foreground mb-1">Tijd ingecheckt</p>
              <p className="text-3xl font-bold text-green-600">
                {formatDuration(elapsedTime)}
              </p>
            </div>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <Button
            onClick={handleCheckOut}
            disabled={loading}
            className="w-full"
            size="lg"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Bezig met uitchecken...
              </>
            ) : (
              <>
                <XCircle className="mr-2 h-4 w-4" />
                Uitchecken
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    )
  }

  // Check-in interface
  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Check in</CardTitle>
          <CardDescription>
            Kies een methode om in te checken bij een locatie
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={mode} onValueChange={(value) => setMode(value as 'gps' | 'qr')}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="gps">
                <MapPin className="mr-2 h-4 w-4" />
                GPS Locatie
              </TabsTrigger>
              <TabsTrigger value="qr">
                <QrCode className="mr-2 h-4 w-4" />
                QR Code
              </TabsTrigger>
            </TabsList>

            <TabsContent value="gps" className="space-y-4 mt-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Selecteer locatie</label>
                <Select value={selectedLocationId} onValueChange={setSelectedLocationId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Kies een locatie" />
                  </SelectTrigger>
                  <SelectContent>
                    {locations.map((location) => (
                      <SelectItem key={location.id} value={location.id}>
                        {location.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Button
                onClick={handleGetLocation}
                disabled={!selectedLocationId || loading}
                variant="outline"
                className="w-full"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Locatie ophalen...
                  </>
                ) : (
                  <>
                    <MapPin className="mr-2 h-4 w-4" />
                    Locatie ophalen
                  </>
                )}
              </Button>

              {userLocation && selectedLocation && (
                <Alert>
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription>
                    Locatie gevonden! Je kunt nu inchecken.
                  </AlertDescription>
                </Alert>
              )}
            </TabsContent>

            <TabsContent value="qr" className="space-y-4 mt-4">
              <QRScanner
                onScan={handleQrScan}
                onError={(err) => setError(err)}
              />

              {scannedQrCode && selectedLocation && (
                <Alert>
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription>
                    QR code gescand: {selectedLocation.name}
                  </AlertDescription>
                </Alert>
              )}
            </TabsContent>
          </Tabs>

          {todaySchedule && (
            <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-start gap-2">
                <Clock className="h-4 w-4 text-blue-600 mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium text-blue-900">Rooster vandaag</p>
                  <p className="text-blue-700">
                    {todaySchedule.start_time.slice(0, 5)} - {todaySchedule.end_time.slice(0, 5)}
                  </p>
                </div>
              </div>
            </div>
          )}

          {error && (
            <Alert variant="destructive" className="mt-4">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <Button
            onClick={handleCheckIn}
            disabled={
              !selectedLocationId ||
              loading ||
              (mode === 'gps' && !userLocation)
            }
            className="w-full mt-4"
            size="lg"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Bezig met inchecken...
              </>
            ) : (
              <>
                <CheckCircle className="mr-2 h-4 w-4" />
                Inchecken
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Schedule warning dialog */}
      <Dialog open={showScheduleWarning} onOpenChange={setShowScheduleWarning}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Let op: Buiten rooster tijd</DialogTitle>
            <DialogDescription className="pt-4">
              <AlertTriangle className="h-8 w-8 text-yellow-600 mb-2" />
              <p>{scheduleWarningMessage}</p>
              <p className="mt-2">Weet je zeker dat je wilt inchecken?</p>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowScheduleWarning(false)}
              disabled={loading}
            >
              Annuleren
            </Button>
            <Button
              onClick={performCheckIn}
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Inchecken...
                </>
              ) : (
                'Ja, toch inchecken'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

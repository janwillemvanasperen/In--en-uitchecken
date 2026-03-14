'use client'

import { useEffect, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'
import { formatDuration } from '@/lib/date-utils'
import { getUserLocation, isWithinRadius } from '@/lib/geolocation'
import { checkIn, checkOut } from '@/app/student/actions'
import { Clock, MapPin, LogIn, LogOut, Loader2 } from 'lucide-react'
import type { ActiveCheckIn, Location } from '@/types'

interface CheckInHistoryCardProps {
  initialCheckIn: ActiveCheckIn | null
  userId: string
  locations: Location[]
  todaySchedule: { start_time: string; end_time: string } | null
}

export function CheckInHistoryCard({
  initialCheckIn,
  userId,
  locations,
  todaySchedule,
}: CheckInHistoryCardProps) {
  const router = useRouter()
  const [activeCheckIn, setActiveCheckIn] = useState<ActiveCheckIn | null>(initialCheckIn)
  const [elapsedTime, setElapsedTime] = useState(0)
  const [gpsLoading, setGpsLoading] = useState(false)
  const [checkOutPending, startCheckOut] = useTransition()
  const supabase = createClient()

  // Real-time subscription
  useEffect(() => {
    const channel = supabase
      .channel('check-ins-dashboard')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'check_ins',
        filter: `user_id=eq.${userId}`,
      }, async (payload) => {
        if (payload.eventType === 'INSERT') {
          const newCheckIn = payload.new as any
          if (!newCheckIn.check_out_time) {
            const { data } = await supabase
              .from('check_ins').select('*, locations(*)')
              .eq('id', newCheckIn.id).single()
            if (data) setActiveCheckIn(data as ActiveCheckIn)
          }
        } else if (payload.eventType === 'UPDATE') {
          const updated = payload.new as any
          if (updated.check_out_time && activeCheckIn?.id === updated.id) {
            setActiveCheckIn(null)
            setElapsedTime(0)
          }
        }
      })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [userId, supabase, activeCheckIn])

  // Timer
  useEffect(() => {
    if (!activeCheckIn) { setElapsedTime(0); return }
    const checkInTime = new Date(activeCheckIn.check_in_time).getTime()
    setElapsedTime(Math.floor((Date.now() - checkInTime) / 1000))
    const interval = setInterval(() => {
      setElapsedTime(Math.floor((Date.now() - checkInTime) / 1000))
    }, 1000)
    return () => clearInterval(interval)
  }, [activeCheckIn])

  // Auto GPS check-in
  async function handleAutoCheckIn() {
    setGpsLoading(true)
    try {
      const gps = await getUserLocation()
      const match = locations.find(loc =>
        isWithinRadius(gps.lat, gps.lng, Number(loc.latitude), Number(loc.longitude), 500)
      )
      if (!match) {
        router.push('/student/check-in?mode=qr')
        return
      }
      const result = await checkIn({
        locationId: match.id,
        userLat: gps.lat,
        userLng: gps.lng,
        expectedStart: todaySchedule?.start_time ?? '00:00',
        expectedEnd: todaySchedule?.end_time ?? '23:59',
      })
      if (result?.error) {
        router.push('/student/check-in?mode=qr')
      } else if (result?.checkIn) {
        // Immediately fetch check-in with location and update state
        const client = createClient()
        const { data } = await client
          .from('check_ins')
          .select('*, locations(*)')
          .eq('id', (result.checkIn as any).id)
          .single()
        if (data) setActiveCheckIn(data as ActiveCheckIn)
      }
    } catch {
      router.push('/student/check-in?mode=qr')
    } finally {
      setGpsLoading(false)
    }
  }

  // Direct check-out
  function handleCheckOut() {
    startCheckOut(async () => {
      const result = await checkOut()
      if (!result?.error) {
        setActiveCheckIn(null)
        setElapsedTime(0)
      }
    })
  }

  return (
    <Card className={`flex flex-col ${activeCheckIn ? 'border-green-300 bg-green-50/30' : ''}`}>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Clock className="h-4 w-4 text-primary" />
          Aanwezigheid
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col flex-1 gap-4 justify-center">

        {/* Check-in / Check-out */}
        {activeCheckIn ? (
          <div className="flex flex-col items-center text-center gap-2 py-2">
            <Badge className="bg-green-600 hover:bg-green-600">Ingecheckt</Badge>
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <MapPin className="h-3.5 w-3.5" />
              {activeCheckIn.locations.name}
            </div>
            <p className="text-3xl font-bold text-green-600 tabular-nums">
              {formatDuration(elapsedTime)}
            </p>
            <Button
              variant="destructive"
              className="w-full"
              size="lg"
              onClick={handleCheckOut}
              disabled={checkOutPending}
            >
              {checkOutPending
                ? <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                : <LogOut className="h-4 w-4 mr-2" />}
              Check uit
            </Button>
          </div>
        ) : (
          <div className="flex flex-col items-center text-center gap-2 py-2">
            <Badge variant="secondary">Uitgecheckt</Badge>
            <p className="text-sm text-muted-foreground">Niet ingecheckt</p>
            <Button
              className="w-full"
              size="lg"
              onClick={handleAutoCheckIn}
              disabled={gpsLoading}
            >
              {gpsLoading
                ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Locatie zoeken…</>
                : <><LogIn className="h-4 w-4 mr-2" />Check in</>}
            </Button>
          </div>
        )}

      </CardContent>
    </Card>
  )
}

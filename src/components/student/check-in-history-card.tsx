'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'
import { formatDuration } from '@/lib/date-utils'
import { Clock, MapPin, LogIn, LogOut, History } from 'lucide-react'
import Link from 'next/link'
import type { ActiveCheckIn } from '@/types'

interface RecentCheckIn {
  id: string
  check_in_time: string
  check_out_time: string | null
  locations: { name: string } | null
}

interface CheckInHistoryCardProps {
  initialCheckIn: ActiveCheckIn | null
  userId: string
  recentCheckIns: RecentCheckIn[]
}

export function CheckInHistoryCard({ initialCheckIn, userId, recentCheckIns }: CheckInHistoryCardProps) {
  const [activeCheckIn, setActiveCheckIn] = useState<ActiveCheckIn | null>(initialCheckIn)
  const [elapsedTime, setElapsedTime] = useState(0)
  const supabase = createClient()

  // Real-time subscription for check-ins
  useEffect(() => {
    const channel = supabase
      .channel('check-ins-dashboard')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'check_ins',
          filter: `user_id=eq.${userId}`,
        },
        async (payload) => {
          if (payload.eventType === 'INSERT') {
            const newCheckIn = payload.new as any
            if (!newCheckIn.check_out_time) {
              const { data } = await supabase
                .from('check_ins')
                .select('*, locations(*)')
                .eq('id', newCheckIn.id)
                .single()
              if (data) setActiveCheckIn(data as ActiveCheckIn)
            }
          } else if (payload.eventType === 'UPDATE') {
            const updated = payload.new as any
            if (updated.check_out_time && activeCheckIn?.id === updated.id) {
              setActiveCheckIn(null)
              setElapsedTime(0)
            }
          }
        }
      )
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

  return (
    <Card className={activeCheckIn ? 'border-green-300 bg-green-50/30' : ''}>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Clock className="h-4 w-4 text-primary" />
          Aanwezigheid
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">

        {/* Check-in / Check-out action — most prominent */}
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
            <Link href="/student/check-in" className="w-full">
              <Button variant="destructive" className="w-full" size="lg">
                <LogOut className="h-4 w-4 mr-2" />
                Check uit
              </Button>
            </Link>
          </div>
        ) : (
          <div className="flex flex-col items-center text-center gap-2 py-2">
            <Badge variant="secondary">Uitgecheckt</Badge>
            <p className="text-sm text-muted-foreground">Niet ingecheckt</p>
            <Link href="/student/check-in" className="w-full">
              <Button className="w-full" size="lg">
                <LogIn className="h-4 w-4 mr-2" />
                Check in
              </Button>
            </Link>
          </div>
        )}

        {/* Recent check-ins */}
        {recentCheckIns.length > 0 && (
          <div className="border-t pt-3 space-y-2">
            {recentCheckIns.slice(0, 3).map((ci) => (
              <div key={ci.id} className="flex items-center justify-between text-sm">
                <div>
                  <p className="font-medium leading-tight">{ci.locations?.name ?? '—'}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(ci.check_in_time).toLocaleDateString('nl-NL', { weekday: 'short', day: 'numeric', month: 'short' })}
                  </p>
                </div>
                {ci.check_out_time ? (
                  <span className="text-xs text-green-600">Uit</span>
                ) : (
                  <span className="text-xs text-primary font-medium">Actief</span>
                )}
              </div>
            ))}
          </div>
        )}

        {/* History button */}
        <div className={recentCheckIns.length > 0 ? 'border-t pt-3' : ''}>
          <Link href="/student/history">
            <Button variant="outline" size="sm" className="w-full">
              <History className="h-4 w-4 mr-2" />
              Volledige geschiedenis
            </Button>
          </Link>
        </div>

      </CardContent>
    </Card>
  )
}

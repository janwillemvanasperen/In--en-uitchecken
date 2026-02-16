'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'
import { formatDuration } from '@/lib/date-utils'
import { Clock, MapPin, LogIn, LogOut } from 'lucide-react'
import Link from 'next/link'
import type { ActiveCheckIn } from '@/types'

interface CurrentStatusCardProps {
  initialCheckIn: ActiveCheckIn | null
  userId: string
}

export function CurrentStatusCard({ initialCheckIn, userId }: CurrentStatusCardProps) {
  const [activeCheckIn, setActiveCheckIn] = useState<ActiveCheckIn | null>(initialCheckIn)
  const [elapsedTime, setElapsedTime] = useState(0)
  const supabase = createClient()

  // Real-time subscription for check-ins
  useEffect(() => {
    const channel = supabase
      .channel('check-ins-changes')
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
              if (data) {
                setActiveCheckIn(data as ActiveCheckIn)
              }
            }
          } else if (payload.eventType === 'UPDATE') {
            const updatedCheckIn = payload.new as any
            if (updatedCheckIn.check_out_time && activeCheckIn?.id === updatedCheckIn.id) {
              setActiveCheckIn(null)
              setElapsedTime(0)
            }
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [userId, supabase, activeCheckIn])

  // Update timer every second
  useEffect(() => {
    if (!activeCheckIn) {
      setElapsedTime(0)
      return
    }

    const checkInTime = new Date(activeCheckIn.check_in_time).getTime()
    const initialElapsed = Math.floor((Date.now() - checkInTime) / 1000)
    setElapsedTime(initialElapsed)

    const interval = setInterval(() => {
      const now = Date.now()
      const elapsed = Math.floor((now - checkInTime) / 1000)
      setElapsedTime(elapsed)
    }, 1000)

    return () => clearInterval(interval)
  }, [activeCheckIn])

  if (!activeCheckIn) {
    return (
      <Card className="md:col-span-2 lg:col-span-3 border-2 border-dashed">
        <CardContent className="py-8">
          <div className="flex flex-col items-center text-center space-y-4">
            <div className="h-14 w-14 rounded-full bg-muted flex items-center justify-center">
              <Clock className="h-7 w-7 text-muted-foreground" />
            </div>
            <div>
              <Badge variant="secondary" className="text-sm mb-2">
                Uitgecheckt
              </Badge>
              <p className="text-sm text-muted-foreground">
                Je bent momenteel niet ingecheckt
              </p>
            </div>
            <Link href="/student/check-in">
              <Button size="lg" className="text-lg px-8 py-6">
                <LogIn className="h-5 w-5 mr-2" />
                Check in
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="md:col-span-2 lg:col-span-3 border-2 border-green-300 bg-green-50/50">
      <CardContent className="py-8">
        <div className="flex flex-col items-center text-center space-y-4">
          <Badge className="bg-green-600 text-sm">
            Ingecheckt
          </Badge>

          <div className="flex items-center gap-2 text-muted-foreground">
            <MapPin className="h-4 w-4" />
            <span>{activeCheckIn.locations.name}</span>
          </div>

          <div>
            <p className="text-xs text-muted-foreground mb-1">Tijd ingecheckt</p>
            <p className="text-4xl font-bold text-green-600">
              {formatDuration(elapsedTime)}
            </p>
          </div>

          <Link href="/student/check-in">
            <Button size="lg" variant="destructive" className="text-lg px-8 py-6">
              <LogOut className="h-5 w-5 mr-2" />
              Check uit
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  )
}

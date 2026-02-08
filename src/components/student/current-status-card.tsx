'use client'

import { useEffect, useState } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { createClient } from '@/lib/supabase/client'
import { formatDuration } from '@/lib/date-utils'
import { Clock, MapPin } from 'lucide-react'
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
            // New check-in created
            const newCheckIn = payload.new as any
            if (!newCheckIn.check_out_time) {
              // Fetch with location data
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
            // Check-in updated (likely checked out)
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

    // Calculate initial elapsed time
    const checkInTime = new Date(activeCheckIn.check_in_time).getTime()
    const initialElapsed = Math.floor((Date.now() - checkInTime) / 1000)
    setElapsedTime(initialElapsed)

    // Update every second
    const interval = setInterval(() => {
      const now = Date.now()
      const elapsed = Math.floor((now - checkInTime) / 1000)
      setElapsedTime(elapsed)
    }, 1000)

    return () => clearInterval(interval)
  }, [activeCheckIn])

  if (!activeCheckIn) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Badge variant="secondary" className="text-sm">
              Uitgecheckt
            </Badge>
            <p className="text-sm text-muted-foreground">
              Je bent momenteel niet ingecheckt
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-green-200 bg-green-50/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5 text-green-600" />
          Status
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <Badge className="bg-green-600 text-sm">
            Ingecheckt
          </Badge>

          <div className="flex items-center gap-2 text-muted-foreground">
            <MapPin className="h-4 w-4" />
            <span className="text-sm">{activeCheckIn.locations.name}</span>
          </div>

          <div className="mt-4">
            <p className="text-xs text-muted-foreground mb-1">Tijd ingecheckt</p>
            <p className="text-3xl font-bold text-green-600">
              {formatDuration(elapsedTime)}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

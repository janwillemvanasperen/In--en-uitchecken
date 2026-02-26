import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { formatDate, formatTime, formatDurationHoursMinutes } from '@/lib/date-utils'
import { MapPin, Clock, Calendar } from 'lucide-react'
import type { CheckInWithLocation } from '@/types'

interface HistoryListProps {
  checkIns: CheckInWithLocation[]
}

export function HistoryList({ checkIns }: HistoryListProps) {
  if (checkIns.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          Geen check-ins gevonden voor deze periode
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {checkIns.map((checkIn) => {
        const checkInTime = new Date(checkIn.check_in_time)
        const checkOutTime = checkIn.check_out_time ? new Date(checkIn.check_out_time) : null

        // Determine status
        let statusBadge: { variant: 'default' | 'destructive' | 'secondary'; label: string }
        let durationText: string
        let durationColor: string

        if (checkOutTime) {
          // Complete check-in
          statusBadge = { variant: 'default', label: 'Compleet' }
          const durationSeconds = Math.floor((checkOutTime.getTime() - checkInTime.getTime()) / 1000)
          durationText = formatDurationHoursMinutes(durationSeconds)
          durationColor = 'text-green-600'
        } else {
          // No check-out
          const hoursSinceCheckIn = (Date.now() - checkInTime.getTime()) / (1000 * 60 * 60)

          if (hoursSinceCheckIn > 12) {
            // More than 12 hours ago - incomplete
            statusBadge = { variant: 'destructive', label: 'Incompleet' }
            durationText = '0u 0m'
            durationColor = 'text-red-600'
          } else {
            // Active (within 12 hours)
            statusBadge = { variant: 'secondary', label: 'Actief' }
            const durationSeconds = Math.floor((Date.now() - checkInTime.getTime()) / 1000)
            durationText = formatDurationHoursMinutes(durationSeconds)
            durationColor = 'text-primary'
          }
        }

        return (
          <Card key={checkIn.id}>
            <CardContent className="py-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span className="font-semibold">{checkIn.locations?.name || 'Onbekende locatie'}</span>
                  </div>

                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    <span>{formatDate(checkInTime)}</span>
                  </div>

                  <div className="flex items-center gap-2 text-sm">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span>
                      {formatTime(checkInTime)}
                      {' - '}
                      {checkOutTime ? formatTime(checkOutTime) : 'Niet uitgecheckt'}
                    </span>
                  </div>
                </div>

                <div className="text-right space-y-2">
                  <Badge variant={statusBadge.variant}>
                    {statusBadge.label}
                  </Badge>

                  <p className={`text-lg font-bold ${durationColor}`}>
                    {durationText}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}

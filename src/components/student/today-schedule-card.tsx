import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Calendar, Clock } from 'lucide-react'
import type { Schedule } from '@/types'

interface TodayScheduleCardProps {
  schedule: Schedule | null
}

export function TodayScheduleCard({ schedule }: TodayScheduleCardProps) {
  if (!schedule) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Rooster vandaag
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Vandaag geen rooster</p>
        </CardContent>
      </Card>
    )
  }

  // Format time (remove seconds)
  const startTime = schedule.start_time.slice(0, 5)
  const endTime = schedule.end_time.slice(0, 5)

  // Calculate duration in hours
  const [startHour, startMin] = schedule.start_time.split(':').map(Number)
  const [endHour, endMin] = schedule.end_time.split(':').map(Number)
  const durationHours = endHour - startHour + (endMin - startMin) / 60

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Rooster vandaag
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-2xl font-bold">
            <Clock className="h-6 w-6" />
            <span>{startTime} - {endTime}</span>
          </div>
          <p className="text-sm text-muted-foreground">
            {durationHours.toFixed(1)} uur
          </p>
        </div>
      </CardContent>
    </Card>
  )
}

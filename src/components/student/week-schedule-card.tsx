import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Calendar } from 'lucide-react'

const DAY_NAMES = ['', 'Ma', 'Di', 'Wo', 'Do', 'Vr', 'Za', 'Zo']

interface WeekScheduleCardProps {
  schedules: { day_of_week: number; start_time: string; end_time: string }[]
}

export function WeekScheduleCard({ schedules }: WeekScheduleCardProps) {
  const today = new Date()
  const currentDay = today.getDay() || 7

  // Build schedule map
  const scheduleMap: Record<number, { start_time: string; end_time: string }> = {}
  for (const s of schedules) {
    scheduleMap[s.day_of_week] = s
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Calendar className="h-4 w-4 text-primary" />
          Weekrooster
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-1.5">
          {[1, 2, 3, 4, 5].map((day) => {
            const s = scheduleMap[day]
            const isCurrent = day === currentDay

            return (
              <div
                key={day}
                className={`flex items-center justify-between py-1.5 px-2 rounded text-sm ${
                  isCurrent ? 'bg-primary/10 font-medium' : ''
                }`}
              >
                <span className={isCurrent ? 'text-primary' : 'text-muted-foreground'}>
                  {DAY_NAMES[day]}
                </span>
                {s ? (
                  <span className="font-mono text-xs">
                    {s.start_time.slice(0, 5)} - {s.end_time.slice(0, 5)}
                  </span>
                ) : (
                  <span className="text-xs text-muted-foreground">-</span>
                )}
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Calendar } from 'lucide-react'
import Link from 'next/link'
import { toLocalDateStr } from '@/lib/date-utils'

const DAY_NAMES = ['', 'Ma', 'Di', 'Wo', 'Do', 'Vr', 'Za', 'Zo']

interface WeekScheduleCardProps {
  schedules: { day_of_week: number; start_time: string; end_time: string; valid_from: string; valid_until: string }[]
  mondayIso: string
}

export function WeekScheduleCard({ schedules, mondayIso }: WeekScheduleCardProps) {
  const monday = new Date(mondayIso)
  const today = new Date()
  const currentDay = today.getDay() || 7

  return (
    <Card className="flex flex-col">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Calendar className="h-4 w-4 text-primary" />
          Weekrooster
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col flex-1">
        <div className="space-y-1.5">
          {[1, 2, 3, 4, 5].map((dow) => {
            // Compute the date for this weekday
            const date = new Date(monday)
            date.setDate(monday.getDate() + (dow - 1))
            const dateStr = toLocalDateStr(date)

            // Find the schedule valid for this specific date
            const s = schedules.find(sch =>
              sch.day_of_week === dow && sch.valid_from <= dateStr && sch.valid_until >= dateStr
            )
            const isCurrent = dow === currentDay

            return (
              <div
                key={dow}
                className={`flex items-center justify-between py-1.5 px-2 rounded text-sm ${
                  isCurrent ? 'bg-primary/10 font-medium' : ''
                }`}
              >
                <span className={isCurrent ? 'text-primary' : 'text-muted-foreground'}>
                  {DAY_NAMES[dow]}
                </span>
                {s ? (
                  <span className="text-sm">
                    {s.start_time.slice(0, 5)} - {s.end_time.slice(0, 5)}
                  </span>
                ) : (
                  <span className="text-xs text-muted-foreground">-</span>
                )}
              </div>
            )
          })}
        </div>
        <div className="mt-auto pt-3 border-t">
          <Link href="/student/schedule">
            <Button variant="outline" size="sm" className="w-full">
              Beheer rooster
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  )
}

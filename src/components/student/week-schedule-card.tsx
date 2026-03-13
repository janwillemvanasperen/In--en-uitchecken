import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Calendar } from 'lucide-react'
import Link from 'next/link'
import { DayRow } from '@/components/student/week-history-view'
import type { DayData } from '@/components/student/week-history-view'

interface WeekScheduleCardProps {
  days: DayData[]
}

export function WeekScheduleCard({ days }: WeekScheduleCardProps) {
  return (
    <Card className="flex flex-col">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Calendar className="h-4 w-4 text-primary" />
          Deze week
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col flex-1 gap-2 pb-3">
        <div className="space-y-2">
          {days.map((day) => (
            <DayRow key={day.isoDate} day={day} compact />
          ))}
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

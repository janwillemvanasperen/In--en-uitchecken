import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { CalendarDays } from 'lucide-react'
import type { Schedule } from '@/types'

interface NextSessionCardProps {
  nextSession: Schedule | null
  isCheckedIn: boolean
}

const DAY_NAMES: { [key: number]: string } = {
  1: 'Maandag',
  2: 'Dinsdag',
  3: 'Woensdag',
  4: 'Donderdag',
  5: 'Vrijdag',
  6: 'Zaterdag',
  7: 'Zondag',
}

export function NextSessionCard({ nextSession, isCheckedIn }: NextSessionCardProps) {
  // Only show when user is checked out
  if (isCheckedIn) {
    return null
  }

  if (!nextSession) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarDays className="h-5 w-5" />
            Volgende sessie
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">
            Geen aankomende sessies gepland
          </p>
        </CardContent>
      </Card>
    )
  }

  const startTime = nextSession.start_time.slice(0, 5)
  const endTime = nextSession.end_time.slice(0, 5)
  const dayName = DAY_NAMES[nextSession.day_of_week] || 'Onbekend'

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CalendarDays className="h-5 w-5" />
          Volgende sessie
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <p className="font-semibold text-lg">{dayName}</p>
          <p className="text-muted-foreground">
            {startTime} - {endTime}
          </p>
        </div>
      </CardContent>
    </Card>
  )
}

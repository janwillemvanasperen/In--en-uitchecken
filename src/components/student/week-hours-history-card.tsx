import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Clock } from 'lucide-react'

interface WeekEntry {
  weekStart: string
  hours: number
}

interface Props {
  weeks: WeekEntry[]
  targetHours?: number
}

function formatWeekLabel(mondayIso: string) {
  const d = new Date(mondayIso + 'T00:00:00')
  return d.toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' })
}

export function WeekHoursHistoryCard({ weeks, targetHours = 16 }: Props) {
  if (weeks.length === 0) return null

  const maxHours = Math.max(targetHours, ...weeks.map((w) => w.hours))

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <Clock className="h-4 w-4 text-muted-foreground" />
          Aanwezigheid afgelopen weken
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {weeks.map((w) => {
            const pct = Math.min((w.hours / maxHours) * 100, 100)
            const onTarget = w.hours >= targetHours * 0.9
            return (
              <div key={w.weekStart} className="flex items-center gap-3">
                <span className="text-xs text-muted-foreground w-16 shrink-0">
                  {formatWeekLabel(w.weekStart)}
                </span>
                <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${onTarget ? 'bg-green-500' : 'bg-orange-400'}`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <span className="text-xs tabular-nums text-muted-foreground w-10 text-right shrink-0">
                  {w.hours.toFixed(1)}u
                </span>
              </div>
            )
          })}
        </div>
        <p className="text-xs text-muted-foreground mt-3">
          Streefwaarde: {targetHours}u/week
        </p>
      </CardContent>
    </Card>
  )
}

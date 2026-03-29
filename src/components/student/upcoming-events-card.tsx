import Link from 'next/link'
import { CalendarDays, Lock, ArrowRight } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import type { CalendarEvent } from '@/components/calendar/types'
import { ACTION_TYPE_DEFAULTS } from '@/components/calendar/types'

const DUTCH_DAY_NAMES = ['zo', 'ma', 'di', 'wo', 'do', 'vr', 'za']
const DUTCH_MONTH_NAMES = [
  'jan', 'feb', 'mrt', 'apr', 'mei', 'jun',
  'jul', 'aug', 'sep', 'okt', 'nov', 'dec',
]

function formatShortDate(dateStr: string): string {
  const [year, month, day] = dateStr.split('-').map(Number)
  const d = new Date(year, month - 1, day)
  return `${DUTCH_DAY_NAMES[d.getDay()]} ${day} ${DUTCH_MONTH_NAMES[month - 1]}`
}

function LabelDot({ color }: { color: string }) {
  return (
    <span
      className="inline-block h-2 w-2 rounded-full shrink-0 mt-1"
      style={{ background: color }}
    />
  )
}

interface UpcomingEventsCardProps {
  events: CalendarEvent[]
}

export function UpcomingEventsCard({ events }: UpcomingEventsCardProps) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <CalendarDays className="h-4 w-4 text-muted-foreground" />
          Aankomende items
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {events.length === 0 ? (
          <p className="text-sm text-muted-foreground">Geen aankomende items</p>
        ) : (
          events.map((ev) => {
            const isCoachEvent = ev.variant === 'coach'
            const labelColor = ev.calendar_event_labels?.color
            const actionInfo = ev.action_type ? ACTION_TYPE_DEFAULTS[ev.action_type] : null
            const buttonLabel = ev.action_label || actionInfo?.label

            return (
              <div key={ev.id} className="flex gap-3 py-2 border-b last:border-0">
                {/* Date column */}
                <div className="shrink-0 w-14 text-center">
                  <p className="text-[10px] text-muted-foreground uppercase leading-tight">
                    {formatShortDate(ev.event_date).split(' ').slice(0, 1).join('')}
                  </p>
                  <p className="text-lg font-bold leading-tight">
                    {ev.event_date.split('-')[2].replace(/^0/, '')}
                  </p>
                  <p className="text-[10px] text-muted-foreground">
                    {formatShortDate(ev.event_date).split(' ').slice(2).join(' ')}
                  </p>
                </div>

                {/* Content column */}
                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex items-start gap-1.5">
                    {isCoachEvent && labelColor && <LabelDot color={labelColor} />}
                    {isCoachEvent && (
                      <Lock className="h-3 w-3 text-muted-foreground shrink-0 mt-1" />
                    )}
                    <p className="font-medium text-sm leading-tight">{ev.title}</p>
                  </div>

                  {ev.description && (
                    <p className="text-xs text-muted-foreground line-clamp-2">{ev.description}</p>
                  )}

                  {ev.calendar_event_labels && (
                    <div className="flex items-center gap-1">
                      <LabelDot color={ev.calendar_event_labels.color} />
                      <span className="text-xs text-muted-foreground">
                        {ev.calendar_event_labels.name}
                      </span>
                    </div>
                  )}

                  {/* Action button */}
                  {actionInfo && buttonLabel && (
                    <Link href={actionInfo.href}>
                      <Button
                        size="sm"
                        className="mt-1.5 h-7 text-xs bg-[#ffd100] text-black hover:bg-[#ffd100]/90"
                      >
                        {buttonLabel}
                      </Button>
                    </Link>
                  )}
                </div>
              </div>
            )
          })
        )}

        {/* Link to full calendar */}
        <Link
          href="/student/calendar"
          className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors pt-1"
        >
          Bekijk volledige kalender
          <ArrowRight className="h-3 w-3" />
        </Link>
      </CardContent>
    </Card>
  )
}

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { ChevronLeft, ChevronRight } from 'lucide-react'

const DAY_SHORT = ['', 'Ma', 'Di', 'Wo', 'Do', 'Vr']

export interface CheckInEntry {
  id: string
  check_in_time: string
  check_out_time: string | null
  location_name: string
}

export interface DayData {
  isoDate: string
  dayOfWeek: number
  scheduled: { start_time: string; end_time: string } | null
  checkIns: CheckInEntry[]
}

interface WeekHistoryViewProps {
  weekOffset: number
  mondayIso: string
  days: DayData[]
}

function timeToMins(t: string): number {
  const [h, m] = t.split(':').map(Number)
  return h * 60 + m
}

function fmtHm(mins: number): string {
  const h = Math.floor(mins / 60)
  const m = mins % 60
  return m === 0 ? `${h}u` : `${h}u ${m}m`
}

function fmtTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' })
}

export function WeekHistoryView({ weekOffset, mondayIso, days }: WeekHistoryViewProps) {
  const monday = new Date(mondayIso)
  const friday = new Date(mondayIso)
  friday.setDate(monday.getDate() + 4)

  const weekLabel = `${monday.toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' })} – ${friday.toLocaleDateString('nl-NL', { day: 'numeric', month: 'short', year: 'numeric' })}`

  let totalPresentMins = 0
  let totalScheduledMins = 0

  for (const day of days) {
    if (day.scheduled) {
      totalScheduledMins += timeToMins(day.scheduled.end_time) - timeToMins(day.scheduled.start_time)
    }
    for (const ci of day.checkIns) {
      if (ci.check_out_time) {
        totalPresentMins += Math.floor(
          (new Date(ci.check_out_time).getTime() - new Date(ci.check_in_time).getTime()) / 60000
        )
      }
    }
  }

  const totalIsShort = totalScheduledMins > 0 && totalPresentMins < totalScheduledMins

  return (
    <div className="space-y-3">
      {/* Week navigation */}
      <div className="flex items-center justify-between gap-2">
        <Link href={`/student/history?week=${weekOffset - 1}`}>
          <Button variant="outline" size="sm">
            <ChevronLeft className="h-4 w-4 mr-1" />
            Vorige week
          </Button>
        </Link>
        <p className="text-sm font-medium text-center flex-1">{weekLabel}</p>
        {weekOffset < 0 ? (
          <Link href={`/student/history?week=${weekOffset + 1}`}>
            <Button variant="outline" size="sm">
              Volgende week
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </Link>
        ) : (
          <Button variant="outline" size="sm" disabled>
            Volgende week
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        )}
      </div>

      {/* Day rows */}
      <div className="space-y-2">
        {days.map(day => (
          <DayRow key={day.isoDate} day={day} />
        ))}
      </div>

      {/* Weekly totals */}
      <Card>
        <CardContent className="py-4 flex items-center justify-between">
          <span className="text-sm font-medium text-muted-foreground">Totaal deze week</span>
          <div className="flex items-baseline gap-1.5">
            <span className={`text-xl font-bold ${totalIsShort ? 'text-red-600' : ''}`}>
              {fmtHm(totalPresentMins)}
            </span>
            {totalScheduledMins > 0 && (
              <span className="text-sm text-muted-foreground">
                / {fmtHm(totalScheduledMins)} geroosterd
              </span>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function DayRow({ day }: { day: DayData }) {
  // Use noon local time to avoid DST issues
  const date = new Date(day.isoDate + 'T12:00:00')
  const dateLabel = date.toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' })
  const hasSchedule = !!day.scheduled
  const hasCheckIn = day.checkIns.length > 0

  // Aggregate check-ins: sum durations, track first/last times
  let presentMins = 0
  let firstIn: string | null = null
  let lastOut: string | null = null
  let anyActive = false

  for (const ci of day.checkIns) {
    if (!firstIn) firstIn = ci.check_in_time
    if (ci.check_out_time) {
      presentMins += Math.floor(
        (new Date(ci.check_out_time).getTime() - new Date(ci.check_in_time).getTime()) / 60000
      )
      lastOut = ci.check_out_time
    } else {
      anyActive = true
    }
  }

  const scheduledMins = hasSchedule
    ? timeToMins(day.scheduled!.end_time) - timeToMins(day.scheduled!.start_time)
    : 0

  // Bar: only when schedule exists — overlay actual presence on the scheduled window
  let barLeftPct = 0
  let barWidthPct = 0

  if (hasSchedule && hasCheckIn && firstIn) {
    const schedStart = timeToMins(day.scheduled!.start_time)
    const schedDuration = timeToMins(day.scheduled!.end_time) - schedStart

    const ciStart = new Date(firstIn)
    const ciStartMins = ciStart.getHours() * 60 + ciStart.getMinutes()

    let ciEndMins: number
    if (lastOut) {
      const co = new Date(lastOut)
      ciEndMins = co.getHours() * 60 + co.getMinutes()
    } else {
      // Active session: use current time as estimate
      const now = new Date()
      ciEndMins = now.getHours() * 60 + now.getMinutes()
    }

    barLeftPct = Math.max(0, Math.min(100, ((ciStartMins - schedStart) / schedDuration) * 100))
    const barRightPct = Math.max(0, Math.min(100, ((ciEndMins - schedStart) / schedDuration) * 100))
    barWidthPct = Math.max(2, barRightPct - barLeftPct)
  }

  // Empty day with no schedule: render minimal row
  if (!hasSchedule && !hasCheckIn) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 rounded-lg border border-dashed opacity-40">
        <span className="w-6 text-sm font-bold">{DAY_SHORT[day.dayOfWeek]}</span>
        <span className="text-xs text-muted-foreground">{dateLabel}</span>
        <span className="ml-auto text-xs text-muted-foreground">Vrij</span>
      </div>
    )
  }

  return (
    <Card>
      <CardContent className="py-3 space-y-2">
        {/* Top row: day + duration summary */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-6 text-sm font-bold">{DAY_SHORT[day.dayOfWeek]}</span>
            <span className="text-xs text-muted-foreground">{dateLabel}</span>
          </div>
          <div className="flex items-baseline gap-1 text-sm">
            {hasCheckIn ? (
              <>
                <span className="font-medium">
                  {fmtHm(presentMins)}{anyActive && !lastOut ? ' (actief)' : ''}
                </span>
                {hasSchedule && (
                  <span className="text-xs text-muted-foreground">/ {fmtHm(scheduledMins)}</span>
                )}
              </>
            ) : (
              <span className="text-xs text-muted-foreground italic">Niet ingecheckt</span>
            )}
          </div>
        </div>

        {/* Time labels: schedule left, actual right */}
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>
            {hasSchedule
              ? `${day.scheduled!.start_time.slice(0, 5)}–${day.scheduled!.end_time.slice(0, 5)}`
              : ''}
          </span>
          <span>
            {hasCheckIn && firstIn
              ? `${fmtTime(firstIn)}${lastOut ? `–${fmtTime(lastOut)}` : anyActive ? ' (actief)' : ''}`
              : ''}
          </span>
        </div>

        {/* Visual bar: gray = scheduled window, primary = actual presence */}
        {hasSchedule && (
          <div className="relative h-3 bg-muted rounded-full overflow-hidden">
            {hasCheckIn && barWidthPct > 0 && (
              <div
                className="absolute top-0 bottom-0 bg-primary rounded-full"
                style={{ left: `${barLeftPct}%`, width: `${barWidthPct}%` }}
              />
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

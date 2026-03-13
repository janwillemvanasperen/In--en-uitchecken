import React from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
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
  approvedLeave: {
    hours_counted: number
    start_time: string | null  // null = hele dag
    end_time: string | null
  } | null
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

/** Minutes covered by approved leave for a day */
function leaveMins(leave: DayData['approvedLeave'], scheduledMins: number): number {
  if (!leave) return 0
  if (leave.start_time && leave.end_time) {
    return timeToMins(leave.end_time) - timeToMins(leave.start_time)
  }
  // Full-day leave: cover the entire scheduled block
  return scheduledMins
}

export function WeekHistoryView({ weekOffset, mondayIso, days }: WeekHistoryViewProps) {
  const monday = new Date(mondayIso)
  const friday = new Date(mondayIso)
  friday.setDate(monday.getDate() + 4)

  const weekLabel = `${monday.toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' })} – ${friday.toLocaleDateString('nl-NL', { day: 'numeric', month: 'short', year: 'numeric' })}`

  let totalPresentMins = 0
  let totalScheduledMins = 0

  for (const day of days) {
    const schedMins = day.scheduled
      ? timeToMins(day.scheduled.end_time) - timeToMins(day.scheduled.start_time)
      : 0

    if (day.scheduled) totalScheduledMins += schedMins

    // Actual check-ins (all days, including non-scheduled)
    for (const ci of day.checkIns) {
      if (ci.check_out_time) {
        totalPresentMins += Math.floor(
          (new Date(ci.check_out_time).getTime() - new Date(ci.check_in_time).getTime()) / 60000
        )
      }
    }

    // Approved leave contributes to present minutes (only the leave duration, not double-counting with check-ins)
    if (day.approvedLeave) {
      const leaveMin = leaveMins(day.approvedLeave, schedMins)
      // Avoid double-counting: only add leave if no check-in covers this day
      if (day.checkIns.length === 0) {
        totalPresentMins += leaveMin
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

export function DayRow({ day, compact = false }: { day: DayData; compact?: boolean }) {
  const date = new Date(day.isoDate + 'T12:00:00')
  const dateLabel = date.toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' })
  const hasSchedule = !!day.scheduled
  const hasCheckIn = day.checkIns.length > 0
  const hasLeave = !!day.approvedLeave
  const isPartialLeave = hasLeave && !!(day.approvedLeave!.start_time && day.approvedLeave!.end_time)
  const isFullLeave = hasLeave && !isPartialLeave

  // Aggregate check-ins
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

  const leaveMin = leaveMins(day.approvedLeave, scheduledMins)

  // COMPACT: single-line row (used on dashboard)
  if (compact) {
    const scheduleLabel = hasSchedule
      ? `${day.scheduled!.start_time.slice(0, 5)}–${day.scheduled!.end_time.slice(0, 5)}`
      : '–'

    let statusEl: React.ReactNode
    if (hasLeave && !hasCheckIn) {
      statusEl = (
        <Badge className="text-xs border-0 bg-blue-100 text-blue-800 hover:bg-blue-100">
          {isPartialLeave ? 'Deels verlof' : 'Verlof'}
        </Badge>
      )
    } else if (hasCheckIn) {
      statusEl = (
        <span className="font-medium text-sm">
          {fmtHm(presentMins)}{anyActive && !lastOut ? ' (actief)' : ''}
        </span>
      )
    } else if (hasSchedule) {
      statusEl = <span className="text-xs text-muted-foreground italic">Niet ingecheckt</span>
    } else {
      statusEl = <span className="text-muted-foreground text-sm">–</span>
    }

    return (
      <div className={`flex items-center justify-between py-1 text-sm ${!hasSchedule && !hasCheckIn && !hasLeave ? 'opacity-40' : ''}`}>
        <div className="flex items-center gap-2 w-24 shrink-0">
          <span className="w-6 font-bold">{DAY_SHORT[day.dayOfWeek]}</span>
          <span className="text-xs text-muted-foreground">{dateLabel}</span>
        </div>
        <span className="text-xs text-muted-foreground">{scheduleLabel}</span>
        <div className="text-right">{statusEl}</div>
      </div>
    )
  }

  // Empty day (full view): no schedule, no check-in, no leave
  if (!hasSchedule && !hasCheckIn && !hasLeave) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 rounded-lg border border-dashed opacity-40">
        <span className="w-6 text-sm font-bold">{DAY_SHORT[day.dayOfWeek]}</span>
        <span className="text-xs text-muted-foreground">{dateLabel}</span>
        <span className="ml-auto text-xs text-muted-foreground">Vrij</span>
      </div>
    )
  }

  // Bar: check-in overlay on scheduled window
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
      const now = new Date()
      ciEndMins = now.getHours() * 60 + now.getMinutes()
    }
    barLeftPct = Math.max(0, Math.min(100, ((ciStartMins - schedStart) / schedDuration) * 100))
    const barRightPct = Math.max(0, Math.min(100, ((ciEndMins - schedStart) / schedDuration) * 100))
    barWidthPct = Math.max(2, barRightPct - barLeftPct)
  }

  // Leave bar position (partial day leave)
  let leaveBarLeftPct = 0
  let leaveBarWidthPct = isFullLeave ? 100 : 0
  if (hasSchedule && isPartialLeave) {
    const schedStart = timeToMins(day.scheduled!.start_time)
    const schedDuration = timeToMins(day.scheduled!.end_time) - schedStart
    const lvStart = timeToMins(day.approvedLeave!.start_time!)
    const lvEnd = timeToMins(day.approvedLeave!.end_time!)
    leaveBarLeftPct = Math.max(0, Math.min(100, ((lvStart - schedStart) / schedDuration) * 100))
    const leaveBarRightPct = Math.max(0, Math.min(100, ((lvEnd - schedStart) / schedDuration) * 100))
    leaveBarWidthPct = Math.max(2, leaveBarRightPct - leaveBarLeftPct)
  }

  const content = (
    <div className="py-4 px-5 space-y-2">
        {/* Top row */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-6 text-sm font-bold">{DAY_SHORT[day.dayOfWeek]}</span>
            <span className="text-xs text-muted-foreground">{dateLabel}</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            {hasCheckIn && (
              <span className="font-medium">
                {fmtHm(presentMins)}{anyActive && !lastOut ? ' (actief)' : ''}
                {hasSchedule && !hasLeave && (
                  <span className="text-xs text-muted-foreground font-normal ml-1">/ {fmtHm(scheduledMins)}</span>
                )}
              </span>
            )}
            {hasLeave && (
              <Badge className={`text-xs border-0 ${isPartialLeave ? 'bg-blue-100 text-blue-800 hover:bg-blue-100' : 'bg-blue-100 text-blue-800 hover:bg-blue-100'}`}>
                {isPartialLeave ? 'Deels verlof' : 'Verlof'}
              </Badge>
            )}
            {!hasCheckIn && !hasLeave && (
              <span className="text-xs text-muted-foreground italic">Niet ingecheckt</span>
            )}
          </div>
        </div>

        {/* Time labels: schedule left, actual right */}
        {(hasSchedule || hasCheckIn || hasLeave) && (
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>
              {hasSchedule
                ? `${day.scheduled!.start_time.slice(0, 5)}–${day.scheduled!.end_time.slice(0, 5)}`
                : ''}
            </span>
            <span className="flex items-center gap-2">
              {isPartialLeave && (
                <span className="text-blue-600">
                  {day.approvedLeave!.start_time!.slice(0, 5)}–{day.approvedLeave!.end_time!.slice(0, 5)}
                </span>
              )}
              {hasCheckIn && firstIn && (
                <span>
                  {fmtTime(firstIn)}{lastOut ? `–${fmtTime(lastOut)}` : anyActive ? ' (actief)' : ''}
                </span>
              )}
            </span>
          </div>
        )}

        {/* Visual bar (only when scheduled) */}
        {hasSchedule && (
          <div className="relative h-3 bg-muted rounded-full overflow-hidden">
            {/* Verlof-blok (blauw) */}
            {hasLeave && leaveBarWidthPct > 0 && (
              <div
                className="absolute top-0 bottom-0 bg-blue-400 opacity-70"
                style={{ left: `${leaveBarLeftPct}%`, width: `${leaveBarWidthPct}%` }}
              />
            )}
            {/* Daadwerkelijke check-in (primary kleur, bovenop verlof) */}
            {hasCheckIn && barWidthPct > 0 && (
              <div
                className="absolute top-0 bottom-0 bg-primary rounded-full"
                style={{ left: `${barLeftPct}%`, width: `${barWidthPct}%` }}
              />
            )}
          </div>
        )}

        {/* Extra: check-in op dag zonder rooster */}
        {!hasSchedule && hasCheckIn && (
          <p className="text-xs text-muted-foreground">
            {firstIn && `${fmtTime(firstIn)}${lastOut ? `–${fmtTime(lastOut)}` : anyActive ? ' (actief)' : ''}`}
            {' · geen rooster'}
          </p>
        )}
      </div>
  )

  return <Card><CardContent className="p-0">{content}</CardContent></Card>
}

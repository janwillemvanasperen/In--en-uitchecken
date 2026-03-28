'use client'

import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { CalendarEvent } from './types'

interface CalendarGridProps {
  events: CalendarEvent[]
  meetingSlotDates?: string[]
  month: number   // 0-indexed (0 = January)
  year: number
  onDayClick: (dateStr: string) => void
  onMonthChange: (delta: 1 | -1) => void
}

const DAY_NAMES = ['Ma', 'Di', 'Wo', 'Do', 'Vr', 'Za', 'Zo']

const DUTCH_MONTHS = [
  'Januari', 'Februari', 'Maart', 'April', 'Mei', 'Juni',
  'Juli', 'Augustus', 'September', 'Oktober', 'November', 'December',
]

function toYMD(year: number, month: number, day: number): string {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

function todayYMD(): string {
  const d = new Date()
  return toYMD(d.getFullYear(), d.getMonth(), d.getDate())
}

// Returns Monday-anchored day-of-week index (0=Mon … 6=Sun)
function mondayDow(jsDay: number): number {
  return (jsDay + 6) % 7
}

export function CalendarGrid({ events, meetingSlotDates, month, year, onDayClick, onMonthChange }: CalendarGridProps) {
  const today = todayYMD()

  // Build a map: dateStr → events[]
  const eventsByDate = new Map<string, CalendarEvent[]>()
  for (const ev of events) {
    const list = eventsByDate.get(ev.event_date) ?? []
    list.push(ev)
    eventsByDate.set(ev.event_date, list)
  }

  const meetingDateSet = new Set(meetingSlotDates ?? [])

  // First day of the month
  const firstDay = new Date(year, month, 1)
  const startOffset = mondayDow(firstDay.getDay()) // how many blank cells before day 1

  // Total days in month
  const daysInMonth = new Date(year, month + 1, 0).getDate()

  // Build grid cells: null = blank, number = day
  const cells: (number | null)[] = [
    ...Array(startOffset).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ]
  // Pad to full weeks
  while (cells.length % 7 !== 0) cells.push(null)

  return (
    <div className="w-full select-none">
      {/* Header: month navigation */}
      <div className="flex items-center justify-between mb-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onMonthChange(-1)}
          aria-label="Vorige maand"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <span className="font-semibold text-sm">
          {DUTCH_MONTHS[month]} {year}
        </span>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onMonthChange(1)}
          aria-label="Volgende maand"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Day-name headers */}
      <div className="grid grid-cols-7 mb-1">
        {DAY_NAMES.map((name) => (
          <div key={name} className="text-center text-xs text-muted-foreground font-medium py-1">
            {name}
          </div>
        ))}
      </div>

      {/* Day cells */}
      <div className="grid grid-cols-7 gap-px bg-border rounded-lg overflow-hidden">
        {cells.map((day, idx) => {
          if (day === null) {
            return <div key={`blank-${idx}`} className="bg-background min-h-[56px]" />
          }

          const dateStr = toYMD(year, month, day)
          const dayEvents = eventsByDate.get(dateStr) ?? []
          const hasMeetingSlots = meetingDateSet.has(dateStr)
          const isToday = dateStr === today
          const isPast = dateStr < today

          return (
            <button
              key={dateStr}
              onClick={() => onDayClick(dateStr)}
              className={[
                'bg-background min-h-[56px] p-1 flex flex-col items-start gap-0.5 text-left',
                'hover:bg-muted/50 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#ffd100]',
                isPast && !isToday ? 'opacity-60' : '',
              ].join(' ')}
            >
              {/* Date number */}
              <span
                className={[
                  'text-xs font-medium w-6 h-6 flex items-center justify-center rounded-full',
                  isToday
                    ? 'bg-[#ffd100] text-black font-bold'
                    : 'text-foreground',
                ].join(' ')}
              >
                {day}
              </span>

              {/* Event dots */}
              <div className="flex flex-wrap gap-0.5 mt-0.5">
                {hasMeetingSlots && (
                  <span
                    className="inline-block h-1.5 w-1.5 rounded-full shrink-0 bg-amber-400"
                    title="Gesprekken beschikbaar"
                  />
                )}
                {dayEvents.slice(0, hasMeetingSlots ? 2 : 3).map((ev) => {
                  const color =
                    ev.variant === 'coach'
                      ? (ev.calendar_event_labels?.color ?? '#6366f1')
                      : '#9ca3af'
                  return (
                    <span
                      key={ev.id}
                      className="inline-block h-1.5 w-1.5 rounded-full shrink-0"
                      style={{ background: color }}
                      title={ev.title}
                    />
                  )
                })}
                {dayEvents.length > (hasMeetingSlots ? 2 : 3) && (
                  <span className="text-[10px] text-muted-foreground leading-none">
                    +{dayEvents.length - (hasMeetingSlots ? 2 : 3)}
                  </span>
                )}
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}

'use client'

import { useState } from 'react'
import { CalendarGrid } from './calendar-grid'
import { StudentDaySheet } from './event-day-sheet'
import { StudentEventFormDialog } from './event-form-dialog'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import type { CalendarEvent } from './types'
import {
  createSharedCalendarEvent,
  updateSharedCalendarEvent,
  deleteSharedCalendarEvent,
} from '@/app/student/calendar/actions'

interface StudentCalendarViewProps {
  events: CalendarEvent[]
  currentUserId: string
}

export function StudentCalendarView({ events, currentUserId }: StudentCalendarViewProps) {
  const today = new Date()
  const [month, setMonth] = useState(today.getMonth())
  const [year, setYear] = useState(today.getFullYear())
  const [selectedDate, setSelectedDate] = useState<string | null>(null)

  function handleMonthChange(delta: 1 | -1) {
    setMonth((prev) => {
      let m = prev + delta
      if (m < 0) { m = 11; setYear((y) => y - 1) }
      else if (m > 11) { m = 0; setYear((y) => y + 1) }
      return m
    })
  }

  return (
    <div className="space-y-4">
      {/* Top bar */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Kalender</h2>
        <StudentEventFormDialog
          onSubmit={createSharedCalendarEvent}
          trigger={
            <Button size="sm" variant="outline">
              <Plus className="h-4 w-4 mr-1" />
              Nieuw item
            </Button>
          }
        />
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-2 w-2 rounded-full bg-indigo-500" />
          Coach-item
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-2 w-2 rounded-full bg-gray-400" />
          Eigen item
        </span>
      </div>

      {/* Calendar grid */}
      <CalendarGrid
        events={events}
        month={month}
        year={year}
        onDayClick={setSelectedDate}
        onMonthChange={handleMonthChange}
      />

      {/* Day sheet */}
      <StudentDaySheet
        dateStr={selectedDate}
        events={events}
        currentUserId={currentUserId}
        onClose={() => setSelectedDate(null)}
        onCreateEvent={createSharedCalendarEvent}
        onUpdateEvent={updateSharedCalendarEvent}
        onDeleteEvent={deleteSharedCalendarEvent}
      />
    </div>
  )
}

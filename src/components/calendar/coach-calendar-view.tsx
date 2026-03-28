'use client'

import { useState } from 'react'
import { CalendarGrid } from './calendar-grid'
import { CoachDaySheet } from './event-day-sheet'
import { CoachEventFormDialog } from './event-form-dialog'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import type { CalendarEvent, CalendarLabel, CalendarStudent } from './types'
import {
  createCalendarEvent,
  updateCalendarEvent,
  deleteCalendarEvent,
} from '@/app/coach/calendar/actions'

interface CoachCalendarViewProps {
  events: CalendarEvent[]
  students: CalendarStudent[]
  labels: CalendarLabel[]
  currentUserId: string
}

export function CoachCalendarView({
  events,
  students,
  labels,
  currentUserId,
}: CoachCalendarViewProps) {
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
        <CoachEventFormDialog
          students={students}
          labels={labels}
          onSubmit={createCalendarEvent}
          trigger={
            <Button size="sm" className="bg-[#ffd100] text-black hover:bg-[#ffd100]/90">
              <Plus className="h-4 w-4 mr-1" />
              Nieuw item
            </Button>
          }
        />
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
      <CoachDaySheet
        dateStr={selectedDate}
        events={events}
        students={students}
        labels={labels}
        currentUserId={currentUserId}
        onClose={() => setSelectedDate(null)}
        onCreateEvent={createCalendarEvent}
        onUpdateEvent={updateCalendarEvent}
        onDeleteEvent={deleteCalendarEvent}
      />
    </div>
  )
}

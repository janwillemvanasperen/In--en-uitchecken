'use client'

import { useState } from 'react'
import { CalendarGrid } from './calendar-grid'
import { StudentDaySheet } from './event-day-sheet'
import { StudentEventFormDialog } from './event-form-dialog'
import { StudentMeetingCyclePanel } from './meeting-slots-panel'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import type { CalendarEvent, MeetingCycle, MeetingSlotStudent } from './types'
import {
  createSharedCalendarEvent,
  updateSharedCalendarEvent,
  deleteSharedCalendarEvent,
  bookMeetingSlot,
  cancelMeetingBooking,
} from '@/app/student/calendar/actions'

interface StudentCalendarViewProps {
  events: CalendarEvent[]
  currentUserId: string
  meetingCycles: MeetingCycle[]
  meetingSlots: MeetingSlotStudent[]
}

export function StudentCalendarView({
  events,
  currentUserId,
  meetingCycles,
  meetingSlots,
}: StudentCalendarViewProps) {
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

  // Unique dates with meeting slots for amber dots
  const meetingSlotDates = [...new Set(meetingSlots.map((s) => s.slot_date))]

  // Group slots by cycle
  const slotsByCycle = new Map<string, MeetingSlotStudent[]>()
  for (const slot of meetingSlots) {
    if (!slotsByCycle.has(slot.cycle_id)) slotsByCycle.set(slot.cycle_id, [])
    slotsByCycle.get(slot.cycle_id)!.push(slot)
  }

  const selectedDaySlots = selectedDate
    ? meetingSlots.filter((s) => s.slot_date === selectedDate)
    : []

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
      <div className="flex items-center gap-4 text-xs text-muted-foreground flex-wrap">
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-2 w-2 rounded-full bg-indigo-500" />
          Coach-item
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-2 w-2 rounded-full bg-gray-400" />
          Eigen item
        </span>
        {meetingSlots.length > 0 && (
          <span className="flex items-center gap-1.5">
            <span className="inline-block h-2 w-2 rounded-full bg-amber-400" />
            Gesprekken
          </span>
        )}
      </div>

      {/* Calendar grid */}
      <CalendarGrid
        events={events}
        meetingSlotDates={meetingSlotDates}
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
        meetingSlots={selectedDaySlots}
        meetingCycles={meetingCycles}
        onClose={() => setSelectedDate(null)}
        onCreateEvent={createSharedCalendarEvent}
        onUpdateEvent={updateSharedCalendarEvent}
        onDeleteEvent={deleteSharedCalendarEvent}
        onBookSlot={bookMeetingSlot}
        onCancelBooking={cancelMeetingBooking}
      />

      {/* Meeting cycles overview */}
      {meetingCycles.length > 0 && (
        <div className="space-y-2 pt-2">
          <h3 className="text-sm font-semibold">Gesprekkencycli</h3>
          {meetingCycles.map((cycle) => (
            <StudentMeetingCyclePanel
              key={cycle.id}
              cycle={cycle}
              slots={slotsByCycle.get(cycle.id) ?? []}
              onBook={bookMeetingSlot}
              onCancel={cancelMeetingBooking}
            />
          ))}
        </div>
      )}
    </div>
  )
}

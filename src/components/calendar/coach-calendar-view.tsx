'use client'

import { useState } from 'react'
import { CalendarGrid } from './calendar-grid'
import { CoachDaySheet } from './event-day-sheet'
import { CoachEventFormDialog } from './event-form-dialog'
import { MeetingCycleFormDialog } from './meeting-cycle-form'
import { CoachMeetingCyclePanel } from './meeting-slots-panel'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import type { CalendarEvent, CalendarLabel, CalendarStudent, MeetingCycle, MeetingSlotCoach } from './types'
import {
  createCalendarEvent,
  updateCalendarEvent,
  deleteCalendarEvent,
  createMeetingCycle,
  closeMeetingCycle,
  deleteMeetingCycle,
  toggleSlotAvailability,
} from '@/app/coach/calendar/actions'

interface CoachCalendarViewProps {
  events: CalendarEvent[]
  students: CalendarStudent[]
  labels: CalendarLabel[]
  currentUserId: string
  meetingCycles: MeetingCycle[]
  meetingSlots: MeetingSlotCoach[]
}

export function CoachCalendarView({
  events,
  students,
  labels,
  currentUserId,
  meetingCycles,
  meetingSlots,
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

  // Unique dates that have meeting slots (for amber dot indicators)
  const meetingSlotDates = [...new Set(meetingSlots.map((s) => s.slot_date))]

  // Group slots by cycle id
  const slotsByCycle = new Map<string, MeetingSlotCoach[]>()
  for (const slot of meetingSlots) {
    if (!slotsByCycle.has(slot.cycle_id)) slotsByCycle.set(slot.cycle_id, [])
    slotsByCycle.get(slot.cycle_id)!.push(slot)
  }

  // Slots for the selected date (passed to CoachDaySheet)
  const selectedDaySlots = selectedDate
    ? meetingSlots.filter((s) => s.slot_date === selectedDate)
    : []

  return (
    <div className="space-y-4">
      {/* Top bar */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <h2 className="text-lg font-semibold">Kalender</h2>
        <div className="flex items-center gap-2">
          <MeetingCycleFormDialog students={students} onSubmit={createMeetingCycle} />
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

      {/* Legend */}
      {meetingSlots.length > 0 && (
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <span className="inline-block h-2 w-2 rounded-full bg-amber-400" />
          Gesprekken beschikbaar
        </div>
      )}

      {/* Day sheet */}
      <CoachDaySheet
        dateStr={selectedDate}
        events={events}
        students={students}
        labels={labels}
        currentUserId={currentUserId}
        meetingSlots={selectedDaySlots}
        onClose={() => setSelectedDate(null)}
        onCreateEvent={createCalendarEvent}
        onUpdateEvent={updateCalendarEvent}
        onDeleteEvent={deleteCalendarEvent}
        onToggleSlotAvailability={toggleSlotAvailability}
      />

      {/* Meeting cycles overview */}
      {meetingCycles.length > 0 && (
        <div className="space-y-2 pt-2">
          <h3 className="text-sm font-semibold">Gesprekkencycli</h3>
          {meetingCycles.map((cycle) => (
            <CoachMeetingCyclePanel
              key={cycle.id}
              cycle={cycle}
              slots={slotsByCycle.get(cycle.id) ?? []}
              onToggleAvailability={toggleSlotAvailability}
              onCloseCycle={closeMeetingCycle}
              onDeleteCycle={deleteMeetingCycle}
            />
          ))}
        </div>
      )}
    </div>
  )
}

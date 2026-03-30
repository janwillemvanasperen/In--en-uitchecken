'use client'

import { useState } from 'react'
import { CalendarGrid } from './calendar-grid'
import { StudentDaySheet } from './event-day-sheet'
import { StudentEventFormDialog } from './event-form-dialog'
import { StudentMeetingCyclePanel } from './meeting-slots-panel'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Plus, CalendarPlus, Copy, Check } from 'lucide-react'
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
  icalToken?: string | null
}

export function StudentCalendarView({
  events,
  currentUserId,
  meetingCycles,
  meetingSlots,
  icalToken,
}: StudentCalendarViewProps) {
  const today = new Date()
  const [month, setMonth] = useState(today.getMonth())
  const [year, setYear] = useState(today.getFullYear())
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  const icalUrl = icalToken
    ? `${typeof window !== 'undefined' ? window.location.origin : ''}/api/calendar/${icalToken}`
    : null

  function handleCopy() {
    if (!icalUrl) return
    navigator.clipboard.writeText(icalUrl).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

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
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-lg font-semibold">Kalender</h2>
        <div className="flex items-center gap-2">
          {icalToken && (
            <Dialog>
              <DialogTrigger asChild>
                <Button size="sm" variant="outline">
                  <CalendarPlus className="h-4 w-4 mr-1" />
                  Koppel aan privéagenda
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Koppel aan je privéagenda</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 mt-2 text-sm">
                  <p className="text-muted-foreground">
                    Kopieer de link hieronder en voeg hem toe aan je agenda-app.
                    De agenda wordt automatisch bijgehouden.
                  </p>

                  {/* URL field + copy button */}
                  <div className="flex gap-2">
                    <Input
                      readOnly
                      value={icalUrl ?? ''}
                      className="text-xs font-mono"
                      onClick={(e) => (e.target as HTMLInputElement).select()}
                    />
                    <Button size="sm" variant="outline" onClick={handleCopy} className="shrink-0">
                      {copied
                        ? <><Check className="h-4 w-4 mr-1 text-green-600" />Gekopieerd</>
                        : <><Copy className="h-4 w-4 mr-1" />Kopieer</>
                      }
                    </Button>
                  </div>

                  {/* Instructions per app */}
                  <div className="space-y-3 border-t pt-3">
                    <div>
                      <p className="font-medium">Google Agenda</p>
                      <p className="text-muted-foreground text-xs mt-0.5">
                        Klik op het <strong>+</strong> naast "Andere agenda's" → <em>Via URL</em> → plak de link → <em>Agenda toevoegen</em>.
                      </p>
                    </div>
                    <div>
                      <p className="font-medium">Apple Agenda</p>
                      <p className="text-muted-foreground text-xs mt-0.5">
                        Menu <em>Bestand</em> → <em>Abonneer op agenda...</em> → plak de link → <em>Abonneer</em>.
                      </p>
                    </div>
                    <div>
                      <p className="font-medium">Outlook</p>
                      <p className="text-muted-foreground text-xs mt-0.5">
                        Ga naar <em>Agenda toevoegen</em> → <em>Via internet abonneren</em> → plak de link.
                      </p>
                    </div>
                  </div>

                  <p className="text-xs text-muted-foreground border-t pt-3">
                    Houd deze link privé — iedereen met de link kan je agenda inzien.
                  </p>
                </div>
              </DialogContent>
            </Dialog>
          )}
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

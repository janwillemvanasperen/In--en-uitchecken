'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { Lock, Pencil, Trash2, Loader2, Users, EyeOff, Eye } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import type {
  CalendarEvent,
  CalendarLabel,
  CalendarStudent,
  CalendarVariant,
  CalendarActionType,
  MeetingCycle,
  MeetingSlotCoach,
  MeetingSlotStudent,
} from './types'
import { ACTION_TYPE_DEFAULTS } from './types'
import { CoachEventFormDialog, StudentEventFormDialog } from './event-form-dialog'

interface CoachEventData {
  title: string
  description?: string
  event_date: string
  all_day: boolean
  start_time?: string
  end_time?: string
  variant: CalendarVariant
  student_id?: string | null
  label_id?: string | null
  action_type?: CalendarActionType | null
  action_label?: string
}

interface SharedEventCreateData {
  title: string
  description?: string
  event_date: string
  all_day: boolean
  start_time?: string
  end_time?: string
}

interface SharedEventUpdateData {
  title?: string
  description?: string
  event_date?: string
  all_day?: boolean
  start_time?: string
  end_time?: string
}

const DUTCH_DAY_NAMES = ['zondag', 'maandag', 'dinsdag', 'woensdag', 'donderdag', 'vrijdag', 'zaterdag']
const DUTCH_MONTH_NAMES = [
  'januari', 'februari', 'maart', 'april', 'mei', 'juni',
  'juli', 'augustus', 'september', 'oktober', 'november', 'december',
]

function formatDutchDate(dateStr: string): string {
  const [year, month, day] = dateStr.split('-').map(Number)
  const d = new Date(year, month - 1, day)
  return `${DUTCH_DAY_NAMES[d.getDay()]} ${day} ${DUTCH_MONTH_NAMES[month - 1]} ${year}`
}

function formatTimeRange(allDay: boolean, start: string | null, end: string | null): string | null {
  if (allDay) return 'Hele dag'
  if (!start) return null
  return end ? `${start} – ${end}` : start
}

function LabelDot({ color }: { color: string }) {
  return (
    <span
      className="inline-block h-2.5 w-2.5 rounded-full shrink-0 mt-0.5"
      style={{ background: color }}
    />
  )
}

// ─── Coach variant ────────────────────────────────────────────────────────────

interface CoachDaySheetProps {
  dateStr: string | null
  events: CalendarEvent[]
  students: CalendarStudent[]
  labels: CalendarLabel[]
  currentUserId: string
  meetingSlots: MeetingSlotCoach[]
  onClose: () => void
  onCreateEvent: (data: CoachEventData) => Promise<{ error?: string }>
  onUpdateEvent: (id: string, data: CoachEventData) => Promise<{ error?: string }>
  onDeleteEvent: (id: string) => Promise<{ error?: string }>
  onToggleSlotAvailability: (slotId: string, available: boolean) => Promise<{ error?: string }>
}

export function CoachDaySheet({
  dateStr,
  events,
  students,
  labels,
  currentUserId,
  meetingSlots,
  onClose,
  onCreateEvent,
  onUpdateEvent,
  onDeleteEvent,
  onToggleSlotAvailability,
}: CoachDaySheetProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const [pendingSlotId, setPendingSlotId] = useState<string | null>(null)

  const dayEvents = dateStr
    ? events.filter((e) => e.event_date === dateStr).sort((a, b) => {
        if (!a.start_time && !b.start_time) return 0
        if (!a.start_time) return 1
        if (!b.start_time) return -1
        return a.start_time.localeCompare(b.start_time)
      })
    : []

  function handleDelete(id: string) {
    setDeletingId(id)
    startTransition(async () => {
      await onDeleteEvent(id)
      setDeletingId(null)
    })
  }

  function handleToggleSlot(slotId: string, current: boolean) {
    setPendingSlotId(slotId)
    startTransition(async () => {
      await onToggleSlotAvailability(slotId, !current)
      setPendingSlotId(null)
    })
  }

  return (
    <Dialog open={!!dateStr} onOpenChange={(o) => { if (!o) onClose() }}>
      <DialogContent className="max-h-[80vh] overflow-y-auto sm:max-w-md">
        {dateStr && (
          <>
            <DialogHeader className="pb-3 border-b">
              <DialogTitle className="capitalize">{formatDutchDate(dateStr)}</DialogTitle>
            </DialogHeader>

            <div className="py-4 space-y-3">
              {dayEvents.length === 0 && meetingSlots.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Geen items op deze dag
                </p>
              )}

              {dayEvents.map((ev) => {
                const isOwner = ev.created_by === currentUserId
                const timeRange = formatTimeRange(ev.all_day, ev.start_time, ev.end_time)
                const labelColor = ev.calendar_event_labels?.color

                return (
                  <div key={ev.id} className="rounded-lg border p-3 space-y-1.5">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-start gap-2 min-w-0">
                        {ev.variant === 'coach' && labelColor && (
                          <LabelDot color={labelColor} />
                        )}
                        {ev.variant === 'shared' && (
                          <Users className="h-3.5 w-3.5 text-muted-foreground shrink-0 mt-0.5" />
                        )}
                        <div className="min-w-0">
                          <p className="font-medium text-sm leading-tight truncate">{ev.title}</p>
                          {timeRange && (
                            <p className="text-xs text-muted-foreground">{timeRange}</p>
                          )}
                        </div>
                      </div>
                      {isOwner && (
                        <div className="flex items-center gap-1 shrink-0">
                          <CoachEventFormDialog
                            students={students}
                            labels={labels}
                            event={ev}
                            onSubmit={(data) => onUpdateEvent(ev.id, data)}
                            trigger={
                              <Button variant="ghost" size="icon" className="h-7 w-7">
                                <Pencil className="h-3.5 w-3.5" />
                              </Button>
                            }
                          />
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-destructive hover:text-destructive"
                            onClick={() => handleDelete(ev.id)}
                            disabled={deletingId === ev.id && isPending}
                          >
                            {deletingId === ev.id && isPending
                              ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              : <Trash2 className="h-3.5 w-3.5" />
                            }
                          </Button>
                        </div>
                      )}
                    </div>

                    {ev.calendar_event_labels && (
                      <div className="flex items-center gap-1.5">
                        <LabelDot color={ev.calendar_event_labels.color} />
                        <span className="text-xs text-muted-foreground">
                          {ev.calendar_event_labels.name}
                        </span>
                      </div>
                    )}

                    {ev.description && (
                      <p className="text-xs text-muted-foreground line-clamp-3">{ev.description}</p>
                    )}

                    {ev.variant === 'coach' && !ev.student_id && (
                      <Badge variant="outline" className="text-xs">Alle studenten</Badge>
                    )}
                  </div>
                )
              })}

              {/* Meeting slots for this day */}
              {meetingSlots.length > 0 && (
                <div className="space-y-1.5">
                  <p className="text-xs font-medium text-amber-600 uppercase tracking-wide">Gesprekken</p>
                  {meetingSlots.map((slot) => {
                    const isLoading = pendingSlotId === slot.id && isPending
                    return (
                      <div
                        key={slot.id}
                        className={`flex items-center justify-between rounded-lg border px-3 py-2 ${
                          !slot.available ? 'opacity-50 bg-muted/30' : ''
                        }`}
                      >
                        <div>
                          <p className="text-sm font-medium tabular-nums">
                            {slot.start_time} – {slot.end_time}
                          </p>
                          <p className="text-xs text-muted-foreground">{slot.cycle_title}</p>
                          {slot.booked_student && (
                            <p className="text-xs text-green-700 dark:text-green-400 font-medium">
                              {slot.booked_student.full_name}
                            </p>
                          )}
                        </div>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7"
                          onClick={() => handleToggleSlot(slot.id, slot.available)}
                          disabled={isLoading || !!slot.booked_student}
                          title={slot.available ? 'Blokkeren' : 'Vrijgeven'}
                        >
                          {isLoading
                            ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            : slot.available
                              ? <EyeOff className="h-3.5 w-3.5" />
                              : <Eye className="h-3.5 w-3.5" />
                          }
                        </Button>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            <div className="border-t pt-3">
              <CoachEventFormDialog
                students={students}
                labels={labels}
                defaultDate={dateStr}
                onSubmit={onCreateEvent}
                trigger={
                  <Button
                    size="sm"
                    className="w-full bg-[#ffd100] text-black hover:bg-[#ffd100]/90"
                  >
                    + Nieuw item op deze dag
                  </Button>
                }
              />
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}

// ─── Student variant ──────────────────────────────────────────────────────────

interface StudentDaySheetProps {
  dateStr: string | null
  events: CalendarEvent[]
  currentUserId: string
  meetingSlots: MeetingSlotStudent[]
  meetingCycles: MeetingCycle[]
  onClose: () => void
  onCreateEvent: (data: SharedEventCreateData) => Promise<{ error?: string }>
  onUpdateEvent: (id: string, data: SharedEventUpdateData) => Promise<{ error?: string }>
  onDeleteEvent: (id: string) => Promise<{ error?: string }>
  onBookSlot: (slotId: string) => Promise<{ error?: string }>
  onCancelBooking: (slotId: string) => Promise<{ error?: string }>
}

export function StudentDaySheet({
  dateStr,
  events,
  currentUserId,
  meetingSlots,
  meetingCycles,
  onClose,
  onCreateEvent,
  onUpdateEvent,
  onDeleteEvent,
  onBookSlot,
  onCancelBooking,
}: StudentDaySheetProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const [pendingSlotId, setPendingSlotId] = useState<string | null>(null)
  const [slotError, setSlotError] = useState<string | null>(null)

  const dayEvents = dateStr
    ? events.filter((e) => e.event_date === dateStr).sort((a, b) => {
        if (!a.start_time && !b.start_time) return 0
        if (!a.start_time) return 1
        if (!b.start_time) return -1
        return a.start_time.localeCompare(b.start_time)
      })
    : []

  function handleDelete(id: string) {
    setDeletingId(id)
    startTransition(async () => {
      await onDeleteEvent(id)
      setDeletingId(null)
    })
  }

  function handleBook(slotId: string) {
    setPendingSlotId(slotId)
    setSlotError(null)
    startTransition(async () => {
      const r = await onBookSlot(slotId)
      if (r.error) setSlotError(r.error)
      setPendingSlotId(null)
    })
  }

  function handleCancel(slotId: string) {
    setPendingSlotId(slotId)
    setSlotError(null)
    startTransition(async () => {
      const r = await onCancelBooking(slotId)
      if (r.error) setSlotError(r.error)
      setPendingSlotId(null)
    })
  }

  const cycleMap = new Map(meetingCycles.map((c) => [c.id, c]))

  return (
    <Dialog open={!!dateStr} onOpenChange={(o) => { if (!o) onClose() }}>
      <DialogContent className="max-h-[80vh] overflow-y-auto sm:max-w-md">
        {dateStr && (
          <>
            <DialogHeader className="pb-3 border-b">
              <DialogTitle className="capitalize">{formatDutchDate(dateStr)}</DialogTitle>
            </DialogHeader>

            <div className="py-4 space-y-3">
              {dayEvents.length === 0 && meetingSlots.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Geen items op deze dag
                </p>
              )}

              {dayEvents.map((ev) => {
                const isOwnShared = ev.variant === 'shared' && ev.student_id === currentUserId
                const isCoachEvent = ev.variant === 'coach'
                const timeRange = formatTimeRange(ev.all_day, ev.start_time, ev.end_time)
                const labelColor = ev.calendar_event_labels?.color
                const actionInfo = ev.action_type ? ACTION_TYPE_DEFAULTS[ev.action_type] : null
                const buttonLabel = ev.action_label || actionInfo?.label

                return (
                  <div key={ev.id} className="rounded-lg border p-3 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-start gap-2 min-w-0">
                        {isCoachEvent && labelColor && <LabelDot color={labelColor} />}
                        {isCoachEvent && <Lock className="h-3.5 w-3.5 text-muted-foreground shrink-0 mt-0.5" />}
                        <div className="min-w-0">
                          <p className="font-medium text-sm leading-tight">{ev.title}</p>
                          {timeRange && (
                            <p className="text-xs text-muted-foreground">{timeRange}</p>
                          )}
                        </div>
                      </div>

                      {isOwnShared && (
                        <div className="flex items-center gap-1 shrink-0">
                          <StudentEventFormDialog
                            event={ev}
                            onSubmit={(data) => onUpdateEvent(ev.id, data)}
                            trigger={
                              <Button variant="ghost" size="icon" className="h-7 w-7">
                                <Pencil className="h-3.5 w-3.5" />
                              </Button>
                            }
                          />
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-destructive hover:text-destructive"
                            onClick={() => handleDelete(ev.id)}
                            disabled={deletingId === ev.id && isPending}
                          >
                            {deletingId === ev.id && isPending
                              ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              : <Trash2 className="h-3.5 w-3.5" />
                            }
                          </Button>
                        </div>
                      )}
                    </div>

                    {ev.calendar_event_labels && (
                      <div className="flex items-center gap-1.5">
                        <LabelDot color={ev.calendar_event_labels.color} />
                        <span className="text-xs text-muted-foreground">
                          {ev.calendar_event_labels.name}
                        </span>
                      </div>
                    )}

                    {ev.description && (
                      <p className="text-sm text-muted-foreground">{ev.description}</p>
                    )}

                    {actionInfo && buttonLabel && (
                      <Link href={actionInfo.href}>
                        <Button
                          size="sm"
                          className="w-full bg-[#ffd100] text-black hover:bg-[#ffd100]/90 mt-1"
                        >
                          {buttonLabel}
                        </Button>
                      </Link>
                    )}
                  </div>
                )
              })}

              {/* Meeting slots */}
              {meetingSlots.length > 0 && (
                <div className="space-y-1.5">
                  <p className="text-xs font-medium text-amber-600 uppercase tracking-wide">Gesprekken</p>
                  {slotError && (
                    <p className="text-sm text-destructive">{slotError}</p>
                  )}
                  {meetingSlots.map((slot) => {
                    const cycle = cycleMap.get(slot.cycle_id)
                    const isLoading = pendingSlotId === slot.id && isPending
                    return (
                      <div
                        key={slot.id}
                        className="flex items-center justify-between rounded-lg border px-3 py-2"
                      >
                        <div>
                          <p className="text-sm font-medium tabular-nums">
                            {slot.start_time} – {slot.end_time}
                          </p>
                          <p className="text-xs text-muted-foreground">{slot.cycle_title}</p>
                        </div>
                        <div>
                          {slot.isMyBooking ? (
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="text-xs text-green-700 border-green-400">
                                Mijn afspraak
                              </Badge>
                              {cycle?.status === 'active' && (
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-6 px-2 text-xs text-destructive hover:text-destructive"
                                  onClick={() => handleCancel(slot.id)}
                                  disabled={isLoading}
                                >
                                  {isLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Annuleren'}
                                </Button>
                              )}
                            </div>
                          ) : slot.isBooked ? (
                            <Badge variant="secondary" className="text-xs">Bezet</Badge>
                          ) : cycle?.status === 'active' ? (
                            <Button
                              size="sm"
                              className="h-7 px-3 text-xs bg-[#ffd100] text-black hover:bg-[#ffd100]/90"
                              onClick={() => handleBook(slot.id)}
                              disabled={isLoading}
                            >
                              {isLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Inschrijven'}
                            </Button>
                          ) : (
                            <span className="text-xs text-muted-foreground">Vrij</span>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            <div className="border-t pt-3">
              <StudentEventFormDialog
                defaultDate={dateStr}
                onSubmit={onCreateEvent}
                trigger={
                  <Button size="sm" variant="outline" className="w-full">
                    + Eigen item toevoegen
                  </Button>
                }
              />
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}

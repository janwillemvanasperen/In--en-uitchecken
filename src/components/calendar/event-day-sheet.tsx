'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { Lock, Pencil, Trash2, Loader2, Users } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import type { CalendarEvent, CalendarLabel, CalendarStudent, CalendarVariant, CalendarActionType } from './types'
import { ACTION_TYPE_DEFAULTS } from './types'
import { CoachEventFormDialog, StudentEventFormDialog } from './event-form-dialog'

interface CoachEventData {
  title: string
  description?: string
  event_date: string
  start_time?: string
  end_time?: string
  variant: CalendarVariant
  student_id?: string | null
  label_id?: string | null
  action_type?: CalendarActionType | null
  action_label?: string
}

interface SharedEventData {
  title?: string
  description?: string
  event_date?: string
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

function formatTimeRange(start: string | null, end: string | null): string | null {
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

// ─── Coach variant of the sheet ───────────────────────────────────────────────

interface CoachDaySheetProps {
  dateStr: string | null
  events: CalendarEvent[]
  students: CalendarStudent[]
  labels: CalendarLabel[]
  currentUserId: string
  onClose: () => void
  onCreateEvent: (data: CoachEventData) => Promise<{ error?: string }>
  onUpdateEvent: (id: string, data: CoachEventData) => Promise<{ error?: string }>
  onDeleteEvent: (id: string) => Promise<{ error?: string }>
}

export function CoachDaySheet({
  dateStr,
  events,
  students,
  labels,
  currentUserId,
  onClose,
  onCreateEvent,
  onUpdateEvent,
  onDeleteEvent,
}: CoachDaySheetProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

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

  return (
    <Dialog open={!!dateStr} onOpenChange={(o) => { if (!o) onClose() }}>
      <DialogContent className="max-h-[80vh] overflow-y-auto sm:max-w-md">
        {dateStr && (
          <>
            <DialogHeader className="pb-3 border-b">
              <DialogTitle className="capitalize">{formatDutchDate(dateStr)}</DialogTitle>
            </DialogHeader>

            <div className="py-4 space-y-3">
              {dayEvents.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Geen items op deze dag
                </p>
              )}

              {dayEvents.map((ev) => {
                const isOwner = ev.created_by === currentUserId
                const timeRange = formatTimeRange(ev.start_time, ev.end_time)
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
                      {/* Edit / delete — only for owner */}
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

                    {/* Label badge */}
                    {ev.calendar_event_labels && (
                      <div className="flex items-center gap-1.5">
                        <LabelDot color={ev.calendar_event_labels.color} />
                        <span className="text-xs text-muted-foreground">
                          {ev.calendar_event_labels.name}
                        </span>
                      </div>
                    )}

                    {/* Description */}
                    {ev.description && (
                      <p className="text-xs text-muted-foreground line-clamp-3">{ev.description}</p>
                    )}

                    {/* Student targeting info */}
                    {ev.variant === 'coach' && !ev.student_id && (
                      <Badge variant="outline" className="text-xs">Alle studenten</Badge>
                    )}
                  </div>
                )
              })}
            </div>

            {/* Add button */}
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

// ─── Student variant of the sheet ─────────────────────────────────────────────

interface StudentDaySheetProps {
  dateStr: string | null
  events: CalendarEvent[]
  currentUserId: string
  onClose: () => void
  onCreateEvent: (data: Omit<SharedEventData, 'title'> & { title: string }) => Promise<{ error?: string }>
  onUpdateEvent: (id: string, data: SharedEventData) => Promise<{ error?: string }>
  onDeleteEvent: (id: string) => Promise<{ error?: string }>
}

export function StudentDaySheet({
  dateStr,
  events,
  currentUserId,
  onClose,
  onCreateEvent,
  onUpdateEvent,
  onDeleteEvent,
}: StudentDaySheetProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

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

  return (
    <Dialog open={!!dateStr} onOpenChange={(o) => { if (!o) onClose() }}>
      <DialogContent className="max-h-[80vh] overflow-y-auto sm:max-w-md">
        {dateStr && (
          <>
            <DialogHeader className="pb-3 border-b">
              <DialogTitle className="capitalize">{formatDutchDate(dateStr)}</DialogTitle>
            </DialogHeader>

            <div className="py-4 space-y-3">
              {dayEvents.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Geen items op deze dag
                </p>
              )}

              {dayEvents.map((ev) => {
                const isOwnShared = ev.variant === 'shared' && ev.student_id === currentUserId
                const isCoachEvent = ev.variant === 'coach'
                const timeRange = formatTimeRange(ev.start_time, ev.end_time)
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

                      {/* Edit/delete for own shared events */}
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

                    {/* Label */}
                    {ev.calendar_event_labels && (
                      <div className="flex items-center gap-1.5">
                        <LabelDot color={ev.calendar_event_labels.color} />
                        <span className="text-xs text-muted-foreground">
                          {ev.calendar_event_labels.name}
                        </span>
                      </div>
                    )}

                    {/* Description */}
                    {ev.description && (
                      <p className="text-sm text-muted-foreground">{ev.description}</p>
                    )}

                    {/* Action button */}
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
            </div>

            {/* Add shared event */}
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

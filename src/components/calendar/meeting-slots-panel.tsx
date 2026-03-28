'use client'

import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Loader2, ChevronDown, ChevronRight, EyeOff, Eye, Trash2, X } from 'lucide-react'
import type { MeetingCycle, MeetingSlotCoach, MeetingSlotStudent } from './types'

// ─── Shared helpers ───────────────────────────────────────────────────────────

const DUTCH_MONTH_NAMES = [
  'januari', 'februari', 'maart', 'april', 'mei', 'juni',
  'juli', 'augustus', 'september', 'oktober', 'november', 'december',
]
const DUTCH_DAY_SHORT = ['zo', 'ma', 'di', 'wo', 'do', 'vr', 'za']

function formatShortDate(dateStr: string): string {
  const [y, m, d] = dateStr.split('-').map(Number)
  const date = new Date(y, m - 1, d)
  return `${DUTCH_DAY_SHORT[date.getDay()]} ${d} ${DUTCH_MONTH_NAMES[m - 1]}`
}

function groupByDate<T extends { slot_date: string }>(slots: T[]): Map<string, T[]> {
  const map = new Map<string, T[]>()
  for (const s of slots) {
    if (!map.has(s.slot_date)) map.set(s.slot_date, [])
    map.get(s.slot_date)!.push(s)
  }
  return map
}

// ─── Coach panel ──────────────────────────────────────────────────────────────

interface CoachSlotsPanelProps {
  cycle: MeetingCycle
  slots: MeetingSlotCoach[]
  onToggleAvailability: (slotId: string, available: boolean) => Promise<{ error?: string }>
  onCloseCycle: (cycleId: string) => Promise<{ error?: string }>
  onDeleteCycle: (cycleId: string) => Promise<{ error?: string }>
}

export function CoachMeetingCyclePanel({
  cycle,
  slots,
  onToggleAvailability,
  onCloseCycle,
  onDeleteCycle,
}: CoachSlotsPanelProps) {
  const [expanded, setExpanded] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [pendingSlotId, setPendingSlotId] = useState<string | null>(null)

  const grouped = groupByDate(slots)
  const dateKeys = Array.from(grouped.keys()).sort()
  const bookedCount = slots.filter((s) => s.booked_student !== null).length

  function handleToggle(slotId: string, current: boolean) {
    setPendingSlotId(slotId)
    startTransition(async () => {
      await onToggleAvailability(slotId, !current)
      setPendingSlotId(null)
    })
  }

  return (
    <div className="rounded-lg border">
      {/* Header */}
      <div
        className="flex items-center justify-between p-3 cursor-pointer select-none"
        onClick={() => setExpanded((p) => !p)}
      >
        <div className="flex items-center gap-2 min-w-0">
          {expanded ? <ChevronDown className="h-4 w-4 shrink-0" /> : <ChevronRight className="h-4 w-4 shrink-0" />}
          <div className="min-w-0">
            <p className="font-medium text-sm truncate">{cycle.title}</p>
            <p className="text-xs text-muted-foreground">
              {formatShortDate(cycle.date_from)} – {formatShortDate(cycle.date_until)} · {slots.length} slots · {bookedCount} geboekt
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1 shrink-0 ml-2" onClick={(e) => e.stopPropagation()}>
          <Badge variant={cycle.status === 'active' ? 'default' : 'secondary'} className="text-xs">
            {cycle.status === 'active' ? 'Actief' : 'Gesloten'}
          </Badge>
          {cycle.status === 'active' && (
            <Button
              size="sm"
              variant="ghost"
              className="h-7 px-2 text-xs"
              onClick={() => startTransition(() => onCloseCycle(cycle.id))}
              disabled={isPending}
            >
              Sluiten
            </Button>
          )}
          <Button
            size="icon"
            variant="ghost"
            className="h-7 w-7 text-destructive hover:text-destructive"
            onClick={() => startTransition(() => onDeleteCycle(cycle.id))}
            disabled={isPending}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {/* Slot list */}
      {expanded && (
        <div className="border-t divide-y">
          {dateKeys.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-4">Geen slots</p>
          )}
          {dateKeys.map((date) => (
            <div key={date} className="px-3 py-2">
              <p className="text-xs font-medium text-muted-foreground mb-1.5 capitalize">
                {formatShortDate(date)}
              </p>
              <div className="space-y-1">
                {grouped.get(date)!.map((slot) => {
                  const isLoading = pendingSlotId === slot.id && isPending
                  return (
                    <div
                      key={slot.id}
                      className={`flex items-center justify-between rounded px-2 py-1 text-sm ${
                        !slot.available ? 'opacity-50 bg-muted/30' : ''
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="tabular-nums text-xs">
                          {slot.start_time} – {slot.end_time}
                        </span>
                        {slot.booked_student ? (
                          <span className="text-xs font-medium text-green-700 dark:text-green-400">
                            {slot.booked_student.full_name}
                          </span>
                        ) : slot.available ? (
                          <span className="text-xs text-muted-foreground">Vrij</span>
                        ) : (
                          <span className="text-xs text-muted-foreground">Geblokkeerd</span>
                        )}
                      </div>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-6 w-6"
                        onClick={() => handleToggle(slot.id, slot.available)}
                        disabled={isLoading || !!slot.booked_student}
                        title={slot.available ? 'Blokkeren' : 'Vrijgeven'}
                      >
                        {isLoading
                          ? <Loader2 className="h-3 w-3 animate-spin" />
                          : slot.available
                            ? <EyeOff className="h-3 w-3" />
                            : <Eye className="h-3 w-3" />
                        }
                      </Button>
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Student panel ────────────────────────────────────────────────────────────

interface StudentSlotsPanelProps {
  cycle: MeetingCycle
  slots: MeetingSlotStudent[]
  onBook: (slotId: string) => Promise<{ error?: string }>
  onCancel: (slotId: string) => Promise<{ error?: string }>
}

export function StudentMeetingCyclePanel({
  cycle,
  slots,
  onBook,
  onCancel,
}: StudentSlotsPanelProps) {
  const [expanded, setExpanded] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [pendingSlotId, setPendingSlotId] = useState<string | null>(null)
  const [slotError, setSlotError] = useState<string | null>(null)

  const grouped = groupByDate(slots)
  const dateKeys = Array.from(grouped.keys()).sort()
  const myCount = slots.filter((s) => s.isMyBooking).length

  function handleBook(slotId: string) {
    setPendingSlotId(slotId)
    setSlotError(null)
    startTransition(async () => {
      const result = await onBook(slotId)
      if (result.error) setSlotError(result.error)
      setPendingSlotId(null)
    })
  }

  function handleCancel(slotId: string) {
    setPendingSlotId(slotId)
    setSlotError(null)
    startTransition(async () => {
      const result = await onCancel(slotId)
      if (result.error) setSlotError(result.error)
      setPendingSlotId(null)
    })
  }

  return (
    <div className="rounded-lg border">
      <div
        className="flex items-center justify-between p-3 cursor-pointer select-none"
        onClick={() => setExpanded((p) => !p)}
      >
        <div className="flex items-center gap-2 min-w-0">
          {expanded ? <ChevronDown className="h-4 w-4 shrink-0" /> : <ChevronRight className="h-4 w-4 shrink-0" />}
          <div className="min-w-0">
            <p className="font-medium text-sm truncate">{cycle.title}</p>
            <p className="text-xs text-muted-foreground">
              {formatShortDate(cycle.date_from)} – {formatShortDate(cycle.date_until)}
              {myCount > 0 && ` · ${myCount} geboekt`}
            </p>
          </div>
        </div>
        <Badge variant={cycle.status === 'active' ? 'default' : 'secondary'} className="text-xs shrink-0">
          {cycle.status === 'active' ? 'Open' : 'Gesloten'}
        </Badge>
      </div>

      {expanded && (
        <div className="border-t">
          {slotError && (
            <div className="flex items-center gap-2 px-3 py-2 text-sm text-destructive bg-destructive/10">
              <span>{slotError}</span>
              <button onClick={() => setSlotError(null)}><X className="h-3.5 w-3.5" /></button>
            </div>
          )}
          <div className="divide-y">
            {dateKeys.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">Geen tijdslots beschikbaar</p>
            )}
            {dateKeys.map((date) => (
              <div key={date} className="px-3 py-2">
                <p className="text-xs font-medium text-muted-foreground mb-1.5 capitalize">
                  {formatShortDate(date)}
                </p>
                <div className="space-y-1">
                  {grouped.get(date)!.map((slot) => {
                    const isLoading = pendingSlotId === slot.id && isPending
                    return (
                      <div
                        key={slot.id}
                        className="flex items-center justify-between rounded px-2 py-1 text-sm"
                      >
                        <span className="tabular-nums text-xs">
                          {slot.start_time} – {slot.end_time}
                        </span>
                        <div className="flex items-center gap-2">
                          {slot.isMyBooking ? (
                            <>
                              <Badge variant="outline" className="text-xs text-green-700 border-green-400">Mijn afspraak</Badge>
                              {cycle.status === 'active' && (
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
                            </>
                          ) : slot.isBooked ? (
                            <Badge variant="secondary" className="text-xs">Bezet</Badge>
                          ) : cycle.status === 'active' ? (
                            <Button
                              size="sm"
                              className="h-6 px-2 text-xs bg-[#ffd100] text-black hover:bg-[#ffd100]/90"
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
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

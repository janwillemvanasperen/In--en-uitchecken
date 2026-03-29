'use client'

import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Loader2, Plus } from 'lucide-react'
import type { CreateMeetingCycleData } from '@/app/coach/calendar/actions'
import type { CalendarStudent } from './types'

const DAYS = [
  { value: 1, label: 'Ma' },
  { value: 2, label: 'Di' },
  { value: 3, label: 'Wo' },
  { value: 4, label: 'Do' },
  { value: 5, label: 'Vr' },
  { value: 6, label: 'Za' },
  { value: 7, label: 'Zo' },
]

const DURATIONS = [15, 20, 30, 45, 60, 90]

interface Props {
  students: CalendarStudent[]
  onSubmit: (data: CreateMeetingCycleData) => Promise<{ error?: string }>
}

export function MeetingCycleFormDialog({ students, onSubmit }: Props) {
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateUntil, setDateUntil] = useState('')
  const [daysOfWeek, setDaysOfWeek] = useState<number[]>([1, 2, 3, 4, 5])
  const [dayStartTime, setDayStartTime] = useState('10:30')
  const [dayEndTime, setDayEndTime] = useState('15:00')
  const [slotDuration, setSlotDuration] = useState(30)
  const [targetAll, setTargetAll] = useState(true)
  const [targetStudentIds, setTargetStudentIds] = useState<string[]>([])

  function resetForm() {
    setTitle('')
    setDescription('')
    setDateFrom('')
    setDateUntil('')
    setDaysOfWeek([1, 2, 3, 4, 5])
    setDayStartTime('10:30')
    setDayEndTime('15:00')
    setSlotDuration(30)
    setTargetAll(true)
    setTargetStudentIds([])
    setError(null)
  }

  function toggleTargetStudent(id: string) {
    setTargetStudentIds((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    )
  }

  function toggleDay(day: number) {
    setDaysOfWeek((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day].sort()
    )
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim()) { setError('Titel is verplicht'); return }
    if (!dateFrom) { setError('Startdatum is verplicht'); return }
    if (!dateUntil) { setError('Einddatum is verplicht'); return }
    if (dateUntil < dateFrom) { setError('Einddatum moet na startdatum liggen'); return }
    if (daysOfWeek.length === 0) { setError('Selecteer minimaal één dag'); return }
    if (dayEndTime <= dayStartTime) { setError('Eindtijd moet na begintijd liggen'); return }
    if (!targetAll && targetStudentIds.length === 0) {
      setError('Selecteer minimaal één student of kies "Alle studenten"'); return
    }
    setError(null)

    startTransition(async () => {
      const result = await onSubmit({
        title,
        description: description || undefined,
        date_from: dateFrom,
        date_until: dateUntil,
        days_of_week: daysOfWeek,
        day_start_time: dayStartTime,
        day_end_time: dayEndTime,
        slot_duration: slotDuration,
        target_student_ids: targetAll ? null : targetStudentIds,
      })
      if (result.error) {
        setError(result.error)
      } else {
        setOpen(false)
        resetForm()
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) resetForm() }}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline">
          <Plus className="h-4 w-4 mr-1" />
          Gesprekkencyclus starten
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nieuwe gesprekkencyclus</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div className="space-y-1.5">
            <Label htmlFor="mc-title">Titel *</Label>
            <Input
              id="mc-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Bijv. Voortgangsgesprekken periode 3"
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="mc-desc">Omschrijving</Label>
            <Textarea
              id="mc-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optionele toelichting voor studenten..."
              rows={2}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="mc-from">Startdatum *</Label>
              <Input
                id="mc-from"
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="mc-until">Einddatum *</Label>
              <Input
                id="mc-until"
                type="date"
                value={dateUntil}
                onChange={(e) => setDateUntil(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Beschikbare dagen</Label>
            <div className="flex gap-2 flex-wrap">
              {DAYS.map((d) => (
                <label
                  key={d.value}
                  className="flex items-center gap-1.5 cursor-pointer select-none"
                >
                  <Checkbox
                    checked={daysOfWeek.includes(d.value)}
                    onCheckedChange={() => toggleDay(d.value)}
                  />
                  <span className="text-sm">{d.label}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="mc-start">Dagstart</Label>
              <Input
                id="mc-start"
                type="time"
                value={dayStartTime}
                onChange={(e) => setDayStartTime(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="mc-end">Dageinde</Label>
              <Input
                id="mc-end"
                type="time"
                value={dayEndTime}
                onChange={(e) => setDayEndTime(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Slotduur</Label>
            <Select
              value={String(slotDuration)}
              onValueChange={(v) => setSlotDuration(Number(v))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {DURATIONS.map((d) => (
                  <SelectItem key={d} value={String(d)}>{d} minuten</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Student targeting */}
          <div className="space-y-2">
            <Label>Voor wie</Label>
            <label className="flex items-center gap-2 cursor-pointer">
              <Checkbox
                checked={targetAll}
                onCheckedChange={(v) => { setTargetAll(!!v); if (v) setTargetStudentIds([]) }}
              />
              <span className="text-sm font-medium">Alle studenten</span>
            </label>
            {!targetAll && (
              <div className="pl-6 space-y-1.5 max-h-36 overflow-y-auto border rounded-md p-2">
                {students.length === 0 && (
                  <p className="text-xs text-muted-foreground">Geen studenten gevonden</p>
                )}
                {students.map((s) => (
                  <label key={s.id} className="flex items-center gap-2 cursor-pointer">
                    <Checkbox
                      checked={targetStudentIds.includes(s.id)}
                      onCheckedChange={() => toggleTargetStudent(s.id)}
                    />
                    <span className="text-sm">{s.full_name}</span>
                  </label>
                ))}
              </div>
            )}
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <div className="flex justify-end gap-2 pt-1">
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
              Annuleren
            </Button>
            <Button
              type="submit"
              disabled={isPending}
              className="bg-[#ffd100] text-black hover:bg-[#ffd100]/90"
            >
              {isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Aanmaken
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

'use client'

import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
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
import { Loader2, Plus, Pencil } from 'lucide-react'
import type { CalendarEvent, CalendarLabel, CalendarStudent, CalendarActionType, CalendarVariant } from './types'

// ─── Coach form ──────────────────────────────────────────────────────────────

interface CoachEventFormProps {
  students: CalendarStudent[]
  labels: CalendarLabel[]
  defaultDate?: string
  event?: CalendarEvent
  onSubmit: (data: {
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
  }) => Promise<{ error?: string }>
  trigger?: React.ReactNode
}

function LabelDot({ color }: { color: string }) {
  return (
    <span
      className="inline-block h-2.5 w-2.5 rounded-full shrink-0"
      style={{ background: color }}
    />
  )
}

export function CoachEventFormDialog({
  students,
  labels,
  defaultDate,
  event,
  onSubmit,
  trigger,
}: CoachEventFormProps) {
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const isEditing = !!event

  const [title, setTitle] = useState(event?.title ?? '')
  const [description, setDescription] = useState(event?.description ?? '')
  const [eventDate, setEventDate] = useState(event?.event_date ?? defaultDate ?? '')
  const [startTime, setStartTime] = useState(event?.start_time ?? '')
  const [endTime, setEndTime] = useState(event?.end_time ?? '')
  const [variant, setVariant] = useState<CalendarVariant>(event?.variant ?? 'coach')
  const [studentId, setStudentId] = useState(event?.student_id ?? '__all__')
  const [labelId, setLabelId] = useState(event?.label_id ?? '__none__')
  const [actionType, setActionType] = useState<string>(event?.action_type ?? '__none__')
  const [actionLabel, setActionLabel] = useState(event?.action_label ?? '')

  function resetForm() {
    if (!isEditing) {
      setTitle('')
      setDescription('')
      setEventDate(defaultDate ?? '')
      setStartTime('')
      setEndTime('')
      setVariant('coach')
      setStudentId('__all__')
      setLabelId('__none__')
      setActionType('__none__')
      setActionLabel('')
    }
    setError(null)
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim()) { setError('Titel is verplicht'); return }
    if (!eventDate) { setError('Datum is verplicht'); return }
    setError(null)

    startTransition(async () => {
      const result = await onSubmit({
        title,
        description: description || undefined,
        event_date: eventDate,
        start_time: startTime || undefined,
        end_time: endTime || undefined,
        variant,
        student_id: studentId === '__all__' ? null : studentId,
        label_id: labelId === '__none__' ? null : labelId,
        action_type: actionType === '__none__' ? null : (actionType as CalendarActionType),
        action_label: actionLabel || undefined,
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
        {trigger ?? (
          <Button size="sm" className="bg-[#ffd100] text-black hover:bg-[#ffd100]/90">
            <Plus className="h-4 w-4 mr-1" />
            {isEditing ? 'Bewerken' : 'Nieuw item'}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Item bewerken' : 'Nieuw agenda-item'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          {/* Variant */}
          <div className="space-y-1.5">
            <Label>Type</Label>
            <Select value={variant} onValueChange={(v) => setVariant(v as CalendarVariant)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="coach">Coach-item (studenten kunnen niet bewerken)</SelectItem>
                <SelectItem value="shared">Gedeeld item (student mag ook bewerken)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Title */}
          <div className="space-y-1.5">
            <Label htmlFor="cal-title">Titel *</Label>
            <Input
              id="cal-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Bijv. Gesprek inplannen"
              required
            />
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <Label htmlFor="cal-desc">Beschrijving</Label>
            <Textarea
              id="cal-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optionele toelichting voor de student..."
              rows={3}
            />
          </div>

          {/* Date */}
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1.5 col-span-3 sm:col-span-1">
              <Label htmlFor="cal-date">Datum *</Label>
              <Input
                id="cal-date"
                type="date"
                value={eventDate}
                onChange={(e) => setEventDate(e.target.value)}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="cal-start">Begintijd</Label>
              <Input
                id="cal-start"
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="cal-end">Eindtijd</Label>
              <Input
                id="cal-end"
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
              />
            </div>
          </div>

          {/* Student targeting (only for coach events) */}
          {variant === 'coach' && (
            <div className="space-y-1.5">
              <Label>Voor student</Label>
              <Select value={studentId} onValueChange={setStudentId}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all__">Alle studenten</SelectItem>
                  {students.map((s) => (
                    <SelectItem key={s.id} value={s.id}>{s.full_name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Student targeting (required for shared events) */}
          {variant === 'shared' && (
            <div className="space-y-1.5">
              <Label>Student *</Label>
              <Select value={studentId === '__all__' ? '' : studentId} onValueChange={setStudentId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecteer een student" />
                </SelectTrigger>
                <SelectContent>
                  {students.map((s) => (
                    <SelectItem key={s.id} value={s.id}>{s.full_name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Label (coach events only) */}
          {variant === 'coach' && (
            <div className="space-y-1.5">
              <Label>Label</Label>
              <Select value={labelId} onValueChange={setLabelId}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">Geen label</SelectItem>
                  {labels.map((l) => (
                    <SelectItem key={l.id} value={l.id}>
                      <span className="flex items-center gap-2">
                        <LabelDot color={l.color} />
                        {l.name}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Action button (coach events only) */}
          {variant === 'coach' && (
            <div className="space-y-3 border rounded-lg p-3 bg-muted/30">
              <div className="space-y-1.5">
                <Label>Actieknop voor student</Label>
                <Select value={actionType} onValueChange={setActionType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">Geen actieknop</SelectItem>
                    <SelectItem value="submit_schedule">Rooster insturen</SelectItem>
                    <SelectItem value="submit_leave_request">Verlof aanvragen</SelectItem>
                    <SelectItem value="check_in">Inchecken</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {actionType !== '__none__' && (
                <div className="space-y-1.5">
                  <Label htmlFor="cal-action-label">Knoptekst (optioneel)</Label>
                  <Input
                    id="cal-action-label"
                    value={actionLabel}
                    onChange={(e) => setActionLabel(e.target.value)}
                    placeholder="Laat leeg voor standaardtekst"
                  />
                </div>
              )}
            </div>
          )}

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
              {isEditing ? 'Opslaan' : 'Toevoegen'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

// ─── Student form ─────────────────────────────────────────────────────────────

interface StudentEventFormProps {
  defaultDate?: string
  event?: CalendarEvent
  onSubmit: (data: {
    title: string
    description?: string
    event_date: string
    start_time?: string
    end_time?: string
  }) => Promise<{ error?: string }>
  trigger?: React.ReactNode
}

export function StudentEventFormDialog({
  defaultDate,
  event,
  onSubmit,
  trigger,
}: StudentEventFormProps) {
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const isEditing = !!event

  const [title, setTitle] = useState(event?.title ?? '')
  const [description, setDescription] = useState(event?.description ?? '')
  const [eventDate, setEventDate] = useState(event?.event_date ?? defaultDate ?? '')
  const [startTime, setStartTime] = useState(event?.start_time ?? '')
  const [endTime, setEndTime] = useState(event?.end_time ?? '')

  function resetForm() {
    if (!isEditing) {
      setTitle('')
      setDescription('')
      setEventDate(defaultDate ?? '')
      setStartTime('')
      setEndTime('')
    }
    setError(null)
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim()) { setError('Titel is verplicht'); return }
    if (!eventDate) { setError('Datum is verplicht'); return }
    setError(null)

    startTransition(async () => {
      const result = await onSubmit({
        title,
        description: description || undefined,
        event_date: eventDate,
        start_time: startTime || undefined,
        end_time: endTime || undefined,
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
        {trigger ?? (
          <Button size="sm" variant="outline">
            {isEditing ? <Pencil className="h-4 w-4" /> : <><Plus className="h-4 w-4 mr-1" /> Nieuw item</>}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Item bewerken' : 'Nieuw agenda-item'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div className="space-y-1.5">
            <Label htmlFor="s-cal-title">Titel *</Label>
            <Input
              id="s-cal-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Bijv. Werkbezoek"
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="s-cal-desc">Omschrijving</Label>
            <Textarea
              id="s-cal-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optionele notitie..."
              rows={2}
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1.5 col-span-3 sm:col-span-1">
              <Label htmlFor="s-cal-date">Datum *</Label>
              <Input
                id="s-cal-date"
                type="date"
                value={eventDate}
                onChange={(e) => setEventDate(e.target.value)}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="s-cal-start">Begin</Label>
              <Input
                id="s-cal-start"
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="s-cal-end">Einde</Label>
              <Input
                id="s-cal-end"
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
              />
            </div>
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
              {isEditing ? 'Opslaan' : 'Toevoegen'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

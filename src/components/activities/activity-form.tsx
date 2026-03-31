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
import { Loader2, Plus } from 'lucide-react'
import type { CreateActivityData } from '@/app/coach/activities/actions'

interface Props {
  onSubmit: (data: CreateActivityData) => Promise<{ error?: string }>
}

export function ActivityFormDialog({ onSubmit }: Props) {
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [activityDate, setActivityDate] = useState('')
  const [startTime, setStartTime] = useState('')
  const [endTime, setEndTime] = useState('')
  const [location, setLocation] = useState('')
  const [maxParticipants, setMaxParticipants] = useState('')
  const [signupDeadline, setSignupDeadline] = useState('')

  function resetForm() {
    setTitle('')
    setDescription('')
    setActivityDate('')
    setStartTime('')
    setEndTime('')
    setLocation('')
    setMaxParticipants('')
    setSignupDeadline('')
    setError(null)
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim()) { setError('Titel is verplicht'); return }
    if (!activityDate) { setError('Datum is verplicht'); return }
    if (startTime && endTime && endTime <= startTime) {
      setError('Eindtijd moet na begintijd liggen'); return
    }
    setError(null)

    startTransition(async () => {
      const result = await onSubmit({
        title: title.trim(),
        description: description.trim() || undefined,
        activity_date: activityDate,
        start_time: startTime || undefined,
        end_time: endTime || undefined,
        location: location.trim() || undefined,
        max_participants: maxParticipants ? parseInt(maxParticipants, 10) : null,
        signup_deadline: signupDeadline
          ? new Date(signupDeadline).toISOString()
          : null,
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
        <Button size="sm" className="bg-[#ffd100] text-black hover:bg-[#ffd100]/90">
          <Plus className="h-4 w-4 mr-1" />
          Activiteit toevoegen
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nieuwe activiteit</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div className="space-y-1.5">
            <Label htmlFor="act-title">Titel *</Label>
            <Input
              id="act-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="bijv. Museumbezoek Centraal Museum"
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="act-desc">Omschrijving</Label>
            <Textarea
              id="act-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optionele toelichting..."
              rows={2}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="act-date">Datum *</Label>
            <Input
              id="act-date"
              type="date"
              value={activityDate}
              onChange={(e) => setActivityDate(e.target.value)}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="act-start">Begintijd</Label>
              <Input
                id="act-start"
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="act-end">Eindtijd</Label>
              <Input
                id="act-end"
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="act-loc">Locatie</Label>
            <Input
              id="act-loc"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="bijv. Centraal Museum Utrecht"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="act-max">Max. deelnemers</Label>
            <Input
              id="act-max"
              type="number"
              min="1"
              value={maxParticipants}
              onChange={(e) => setMaxParticipants(e.target.value)}
              placeholder="Leeg = onbeperkt"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="act-deadline">Inschrijfdeadline</Label>
            <Input
              id="act-deadline"
              type="datetime-local"
              value={signupDeadline}
              onChange={(e) => setSignupDeadline(e.target.value)}
            />
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

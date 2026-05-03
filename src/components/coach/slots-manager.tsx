'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, Plus, Trash2, CalendarDays, Users, AlertTriangle } from 'lucide-react'

interface Booking {
  student_id: string
  goal_number: number
  phase: number
  status: string
  users: { full_name: string } | null
}

interface Slot {
  id: string
  date: string
  start_time: string
  duration_minutes: number
  max_bookings: number
  bookings: Booking[]
  users: { full_name: string } | null
}

interface Props {
  upcomingSlots: Slot[]
  pastSlots: Slot[]
  onCreate: (data: { date: string; start_time: string; max_bookings: number }) => Promise<{ error?: string }>
  onDelete: (id: string) => Promise<{ error?: string }>
}

function formatSlotTime(date: string, startTime: string, durationMin: number) {
  const d = new Date(`${date}T${startTime}`)
  const end = new Date(d.getTime() + durationMin * 60000)
  const dateStr = d.toLocaleDateString('nl-NL', { weekday: 'short', day: 'numeric', month: 'short' })
  const timeStr = `${d.toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' })}–${end.toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' })}`
  return `${dateStr} · ${timeStr}`
}

function SlotRow({ slot, onDelete }: { slot: Slot; onDelete: (id: string) => Promise<{ error?: string }> }) {
  const [deleting, setDeleting] = useState(false)

  async function handleDelete() {
    if (!confirm('Tijdslot verwijderen?')) return
    setDeleting(true)
    await onDelete(slot.id)
    setDeleting(false)
  }

  const booked = slot.bookings.length
  const available = slot.max_bookings - booked

  return (
    <div className="flex items-start justify-between gap-3 py-3 border-b last:border-0">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium">{formatSlotTime(slot.date, slot.start_time, slot.duration_minutes)}</p>
        <div className="flex items-center gap-2 mt-1 flex-wrap">
          <Badge variant={available > 0 ? 'outline' : 'secondary'} className="text-xs">
            {booked}/{slot.max_bookings} geboekt
          </Badge>
          {slot.bookings.map((b, i) => (
            <span key={i} className="text-xs text-muted-foreground">
              {b.users?.full_name ?? '—'} (OD{b.goal_number} F{b.phase})
            </span>
          ))}
        </div>
      </div>
      <Button
        variant="ghost"
        size="icon"
        className="h-7 w-7 text-destructive hover:text-destructive shrink-0"
        onClick={handleDelete}
        disabled={deleting || booked > 0}
        title={booked > 0 ? 'Kan niet verwijderen: al geboekt' : 'Verwijderen'}
      >
        {deleting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
      </Button>
    </div>
  )
}

export function SlotsManager({ upcomingSlots, pastSlots, onCreate, onDelete }: Props) {
  const [date, setDate] = useState('')
  const [time, setTime] = useState('')
  const [maxBookings, setMaxBookings] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const result = await onCreate({ date, start_time: time, max_bookings: maxBookings })
    if (result.error) {
      setError(result.error)
      setLoading(false)
      return
    }
    setDate('')
    setTime('')
    setMaxBookings(1)
    setLoading(false)
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Voortgangsgesprekken</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Stel beschikbare tijdsloten in (30 min). Studenten kiezen hieruit bij het aanmelden voor een beoordeling.
        </p>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Tijdslot toevoegen
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="date">Datum</Label>
                <Input
                  id="date"
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  required
                  disabled={loading}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="time">Starttijd</Label>
                <Input
                  id="time"
                  type="time"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  required
                  disabled={loading}
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="max">Max. studenten per slot</Label>
              <Input
                id="max"
                type="number"
                min={1}
                max={10}
                value={maxBookings}
                onChange={(e) => setMaxBookings(Number(e.target.value))}
                className="w-24"
                disabled={loading}
              />
              <p className="text-xs text-muted-foreground">Duur: 30 minuten per gesprek</p>
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <Button type="submit" disabled={loading || !date || !time} className="gap-2">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              Tijdslot toevoegen
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <CalendarDays className="h-4 w-4" />
            Komende tijdsloten ({upcomingSlots.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          {upcomingSlots.length === 0 ? (
            <p className="text-sm text-muted-foreground">Geen tijdsloten ingepland.</p>
          ) : (
            upcomingSlots.map((slot) => (
              <SlotRow key={slot.id} slot={slot} onDelete={onDelete} />
            ))
          )}
        </CardContent>
      </Card>

      {pastSlots.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2 text-muted-foreground">
              <Users className="h-4 w-4" />
              Vorige tijdsloten
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            {pastSlots.map((slot) => (
              <SlotRow key={slot.id} slot={slot} onDelete={onDelete} />
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  )
}

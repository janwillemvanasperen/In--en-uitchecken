'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { submitLeaveRequest } from '@/app/student/actions'
import { AlertTriangle, CheckCircle, Loader2 } from 'lucide-react'
import type { LeaveReason } from '@/types'

interface Schedule {
  day_of_week: number
  start_time: string
  end_time: string
  valid_from: string
  valid_until: string
}

interface Props {
  schedules: Schedule[]
}

type LateOption = '10' | '20' | '30' | 'custom'

function getScheduleForDate(date: string, schedules: Schedule[]): Schedule | null {
  if (!date) return null
  const d = new Date(date + 'T00:00:00')
  const dow = d.getDay() === 0 ? 7 : d.getDay()
  return schedules.find(s =>
    s.day_of_week === dow && s.valid_from <= date && s.valid_until >= date
  ) ?? null
}

function addMinutes(time: string, minutes: number): string {
  const [h, m] = time.split(':').map(Number)
  const total = h * 60 + m + minutes
  return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`
}

export function LeaveRequestForm({ schedules }: Props) {
  const router = useRouter()
  const [date, setDate] = useState('')
  const [reason, setReason] = useState<LeaveReason>('sick')
  const [description, setDescription] = useState('')
  // Afspraak: handmatige tijden
  const [fullDay, setFullDay] = useState(true)
  const [startTime, setStartTime] = useState('')
  const [endTime, setEndTime] = useState('')
  // Te laat: blok-keuze
  const [lateOption, setLateOption] = useState<LateOption>('10')
  const [lateCustomMinutes, setLateCustomMinutes] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  // Bereken tijden voor "te laat" op basis van rooster + keuze
  const scheduleForDate = getScheduleForDate(date, schedules)

  function computeLateTimes(): { start: string; end: string } | null {
    if (!scheduleForDate) return null
    const start = scheduleForDate.start_time.slice(0, 5)
    let mins = 0
    if (lateOption === '10') mins = 10
    else if (lateOption === '20') mins = 20
    else if (lateOption === '30') mins = 30
    else mins = parseInt(lateCustomMinutes) || 0
    if (mins <= 0) return null
    return { start, end: addMinutes(start, mins) }
  }

  // Reset tijdvelden als reden wijzigt
  useEffect(() => {
    setStartTime('')
    setEndTime('')
    setFullDay(true)
    setLateOption('10')
    setLateCustomMinutes('')
  }, [reason])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccess(false)

    let submitStart: string | undefined
    let submitEnd: string | undefined

    if (reason === 'sick') {
      // Altijd hele dag
      submitStart = undefined
      submitEnd = undefined
    } else if (reason === 'late') {
      const times = computeLateTimes()
      if (!times) {
        setError(scheduleForDate ? 'Voer een geldig aantal minuten in.' : 'Geen rooster gevonden voor deze dag.')
        setLoading(false)
        return
      }
      submitStart = times.start
      submitEnd = times.end
    } else {
      // Afspraak
      submitStart = !fullDay && startTime ? startTime : undefined
      submitEnd = !fullDay && endTime ? endTime : undefined
    }

    const result = await submitLeaveRequest({
      date,
      reason,
      description,
      start_time: submitStart,
      end_time: submitEnd,
    })

    if (result.error) {
      setError(result.error)
    } else {
      setSuccess(true)
      setDate('')
      setReason('sick')
      setDescription('')
      setFullDay(true)
      setStartTime('')
      setEndTime('')
      setLateOption('10')
      setLateCustomMinutes('')
      router.refresh()
      setTimeout(() => setSuccess(false), 3000)
    }

    setLoading(false)
  }

  const lateTimes = reason === 'late' ? computeLateTimes() : null

  return (
    <Card>
      <CardHeader>
        <CardTitle>Nieuwe verlofaanvraag</CardTitle>
        <CardDescription>
          Vraag verlof aan voor ziekte, te laat komen of een afspraak
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">

          <div className="space-y-2">
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

          <div className="space-y-2">
            <Label htmlFor="reason">Reden</Label>
            <Select value={reason} onValueChange={(v) => setReason(v as LeaveReason)} disabled={loading}>
              <SelectTrigger id="reason">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="sick">🤒 Ziek</SelectItem>
                <SelectItem value="late">⏰ Te laat</SelectItem>
                <SelectItem value="appointment">📅 Afspraak</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Ziek: hele dag automatisch */}
          {reason === 'sick' && (
            <p className="text-sm text-muted-foreground">
              Bij ziekte wordt automatisch de hele dag geregistreerd.
            </p>
          )}

          {/* Te laat: blok-keuze */}
          {reason === 'late' && (
            <div className="space-y-3">
              <Label>Te laat met</Label>
              <div className="grid grid-cols-2 gap-2">
                {(['10', '20', '30', 'custom'] as LateOption[]).map((opt) => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => setLateOption(opt)}
                    disabled={loading}
                    className={`rounded-md border px-3 py-2 text-sm text-left transition-colors ${
                      lateOption === opt
                        ? 'border-primary bg-primary/10 text-primary font-medium'
                        : 'border-border hover:bg-muted'
                    }`}
                  >
                    {opt === '10' && 'Max 10 minuten'}
                    {opt === '20' && 'Max 20 minuten'}
                    {opt === '30' && 'Max 30 minuten'}
                    {opt === 'custom' && 'Anders, namelijk…'}
                  </button>
                ))}
              </div>

              {lateOption === 'custom' && (
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    min="1"
                    max="480"
                    placeholder="Aantal minuten"
                    value={lateCustomMinutes}
                    onChange={(e) => setLateCustomMinutes(e.target.value)}
                    disabled={loading}
                    className="w-40"
                  />
                  <span className="text-sm text-muted-foreground">minuten</span>
                </div>
              )}

              {/* Berekende tijden */}
              {date && (
                <div className="rounded-md bg-muted px-3 py-2 text-sm">
                  {scheduleForDate ? (
                    lateTimes ? (
                      <span>
                        Registratie: <strong>{lateTimes.start}</strong> – <strong>{lateTimes.end}</strong>
                        <span className="text-muted-foreground ml-1">(rooster start om {scheduleForDate.start_time.slice(0, 5)})</span>
                      </span>
                    ) : (
                      <span className="text-muted-foreground">Voer het aantal minuten in.</span>
                    )
                  ) : (
                    <span className="text-muted-foreground">Geen rooster gevonden voor deze dag.</span>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Afspraak: handmatige tijden */}
          {reason === 'appointment' && (
            <>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="full-day"
                  checked={fullDay}
                  onChange={(e) => setFullDay(e.target.checked)}
                  disabled={loading}
                  className="h-4 w-4 rounded border-gray-300"
                />
                <Label htmlFor="full-day" className="font-normal">Hele dag</Label>
              </div>

              {!fullDay && (
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="start-time">Van</Label>
                    <Input
                      id="start-time"
                      type="time"
                      value={startTime}
                      onChange={(e) => setStartTime(e.target.value)}
                      disabled={loading}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="end-time">Tot</Label>
                    <Input
                      id="end-time"
                      type="time"
                      value={endTime}
                      onChange={(e) => setEndTime(e.target.value)}
                      disabled={loading}
                      required
                    />
                  </div>
                </div>
              )}
            </>
          )}

          <div className="space-y-2">
            <Label htmlFor="description">Toelichting</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Geef hier een korte toelichting..."
              rows={3}
              disabled={loading}
            />
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert className="bg-green-50 border-green-200">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                Verlofaanvraag succesvol ingediend!
              </AlertDescription>
            </Alert>
          )}

          <Button type="submit" disabled={loading || !date} className="w-full">
            {loading ? (
              <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Aanvraag indienen...</>
            ) : (
              'Aanvraag indienen'
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}

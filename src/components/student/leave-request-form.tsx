'use client'

import { useState } from 'react'
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

const REASON_LABELS: Record<LeaveReason, string> = {
  sick: 'Ziek',
  late: 'Te laat',
  appointment: 'Afspraak',
}

export function LeaveRequestForm() {
  const router = useRouter()
  const [date, setDate] = useState('')
  const [reason, setReason] = useState<LeaveReason>('sick')
  const [description, setDescription] = useState('')
  const [fullDay, setFullDay] = useState(true)
  const [startTime, setStartTime] = useState('')
  const [endTime, setEndTime] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccess(false)

    const result = await submitLeaveRequest({
      date,
      reason,
      description,
      start_time: !fullDay && startTime ? startTime : undefined,
      end_time: !fullDay && endTime ? endTime : undefined,
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
      router.refresh()
      setTimeout(() => setSuccess(false), 3000)
    }

    setLoading(false)
  }

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
            <Select value={reason} onValueChange={(value) => setReason(value as LeaveReason)} disabled={loading}>
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
                  required={!fullDay}
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
                  required={!fullDay}
                />
              </div>
            </div>
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
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Aanvraag indienen...
              </>
            ) : (
              'Aanvraag indienen'
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}

'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { submitSchedule, updatePendingSchedule, deletePendingSchedule } from '@/app/student/actions'
import { Loader2, Clock, Trash2 } from 'lucide-react'
import type { Schedule, ScheduleEntry } from '@/types'

const FIXED_START_TIME = '10:00'

const END_TIME_OPTIONS = [
  '13:00', '13:30', '14:00', '14:30', '15:00', '15:30', '16:00',
]

const DAY_NAMES: Record<number, string> = {
  1: 'Maandag',
  2: 'Dinsdag',
  3: 'Woensdag',
  4: 'Donderdag',
  5: 'Vrijdag',
  6: 'Zaterdag',
  7: 'Zondag',
}

interface PushRequest {
  id: string
  valid_from: string
  valid_until: string
  message: string | null
}

interface DayCapacityInfo {
  used: number
  max: number
}

interface ScheduleEditorProps {
  defaultStartTime: string
  minimumHours: number
  periodWeeks: number
  existingPending: Schedule[] | null
  pushRequest?: PushRequest | null
  dayCapacity?: Record<number, DayCapacityInfo>
  coachScheduleDays?: number[] | null
  coachName?: string | null
}

function buildInitialEntries(
  existingPending: Schedule[] | null
): ScheduleEntry[] {
  return [1, 2, 3, 4, 5, 6, 7].map(day => {
    const existing = existingPending?.find(s => s.day_of_week === day)
    if (existing) {
      const existingEnd = existing.end_time.slice(0, 5)
      return {
        day_of_week: day,
        active: true,
        start_time: FIXED_START_TIME,
        end_time: END_TIME_OPTIONS.includes(existingEnd) ? existingEnd : END_TIME_OPTIONS[4],
      }
    }
    return {
      day_of_week: day,
      active: day >= 1 && day <= 5,
      start_time: FIXED_START_TIME,
      end_time: END_TIME_OPTIONS[4], // 15:00 default
    }
  })
}

export function ScheduleEditor({
  minimumHours,
  periodWeeks,
  existingPending,
  pushRequest,
  dayCapacity,
  coachScheduleDays,
  coachName,
}: Omit<ScheduleEditorProps, 'defaultStartTime'> & { defaultStartTime?: string }) {
  const router = useRouter()
  const isEditing = !!existingPending && existingPending.length > 0

  const [entries, setEntries] = useState<ScheduleEntry[]>(
    buildInitialEntries(existingPending)
  )
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const updateEntry = (dayIndex: number, field: keyof ScheduleEntry, value: string | boolean) => {
    setEntries(prev => prev.map((entry, i) =>
      i === dayIndex ? { ...entry, [field]: value } : entry
    ))
  }

  const calculateDayHours = (entry: ScheduleEntry): number => {
    if (!entry.active) return 0
    const [sh, sm] = entry.start_time.split(':').map(Number)
    const [eh, em] = entry.end_time.split(':').map(Number)
    const hours = (eh + em / 60) - (sh + sm / 60)
    return Math.max(0, hours)
  }

  const totalHours = entries.reduce((sum, entry) => sum + calculateDayHours(entry), 0)
  const progressPercent = Math.min(100, (totalHours / minimumHours) * 100)
  const isValid = totalHours >= minimumHours

  // Period display — use push request dates if available, else auto-calculate
  const validFrom = pushRequest
    ? new Date(pushRequest.valid_from).toLocaleDateString('nl-NL', { day: 'numeric', month: 'long', year: 'numeric' })
    : new Date().toLocaleDateString('nl-NL', { day: 'numeric', month: 'long', year: 'numeric' })
  const validUntil = pushRequest
    ? new Date(pushRequest.valid_until).toLocaleDateString('nl-NL', { day: 'numeric', month: 'long', year: 'numeric' })
    : (() => { const d = new Date(); d.setDate(d.getDate() + periodWeeks * 7); return d.toLocaleDateString('nl-NL', { day: 'numeric', month: 'long', year: 'numeric' }) })()

  const handleSubmit = async () => {
    setIsSubmitting(true)
    setError(null)
    setSuccess(null)

    const action = isEditing ? updatePendingSchedule : submitSchedule
    const result = await action({
      entries,
      pushRequestId: pushRequest?.id,
      forcedValidFrom: pushRequest?.valid_from,
      forcedValidUntil: pushRequest?.valid_until,
    })

    if (result.error) {
      setError(result.error)
      setIsSubmitting(false)
    } else {
      setSuccess(
        result.autoApproved
          ? 'Rooster goedgekeurd!'
          : isEditing
          ? 'Rooster bijgewerkt! Wacht op goedkeuring van je docent.'
          : 'Rooster ingediend! Wacht op goedkeuring van je docent.'
      )
      router.refresh()
      setTimeout(() => {
        router.push('/student/dashboard')
      }, 2500)
    }
  }

  const handleDelete = async () => {
    setIsDeleting(true)
    setError(null)

    const result = await deletePendingSchedule()

    if (result.error) {
      setError(result.error)
    } else {
      setSuccess('Pending rooster verwijderd.')
      router.refresh()
    }

    setIsDeleting(false)
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              {isEditing ? 'Rooster bewerken' : 'Nieuw rooster indienen'}
            </CardTitle>
            <CardDescription>
              Stel je wekelijkse rooster samen. Minimaal {minimumHours} uur per week.
            </CardDescription>
          </div>
          {isEditing && (
            <Badge variant="secondary">In afwachting</Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Period info */}
        <div className={`rounded-lg p-3 text-sm ${pushRequest ? 'bg-[#ffd100]/10 border border-[#ffd100]/40' : 'bg-muted'}`}>
          <p className="font-medium">
            {pushRequest ? 'Gevraagde roosterperiode' : 'Geldigheidsperiode'}
          </p>
          <p className="text-muted-foreground">
            {validFrom} — {validUntil}
            {!pushRequest && ` (${periodWeeks} weken)`}
          </p>
          {pushRequest?.message && (
            <p className="mt-1 text-muted-foreground italic">&quot;{pushRequest.message}&quot;</p>
          )}
        </div>

        {/* Day entries */}
        <div className="space-y-3">
          {entries.map((entry, index) => {
            const cap = dayCapacity?.[entry.day_of_week]
            const isFull = cap ? cap.used >= cap.max : false
            const isDisabledByCapacity = isFull && !entry.active
            const coachAbsent = entry.active && coachScheduleDays != null && !coachScheduleDays.includes(entry.day_of_week)

            return (
              <div key={entry.day_of_week} className="space-y-1">
                <div
                  className={`flex items-center gap-3 rounded-lg border p-3 transition-colors ${
                    isDisabledByCapacity
                      ? 'bg-muted/50 opacity-60 border-red-200'
                      : coachAbsent
                      ? 'border-yellow-400 bg-yellow-50/50'
                      : entry.active
                      ? 'bg-background'
                      : 'bg-muted/50 opacity-60'
                  }`}
                >
                  <label className={`flex items-center gap-2 min-w-[120px] ${isDisabledByCapacity ? 'cursor-not-allowed' : 'cursor-pointer'}`}>
                    <input
                      type="checkbox"
                      checked={entry.active}
                      disabled={isDisabledByCapacity}
                      onChange={(e) => updateEntry(index, 'active', e.target.checked)}
                      className="h-4 w-4 rounded border-gray-300 disabled:cursor-not-allowed"
                    />
                    <span className="text-sm font-medium">{DAY_NAMES[entry.day_of_week]}</span>
                  </label>

                  {entry.active && (
                    <>
                      <span className="text-sm font-mono tabular-nums text-muted-foreground w-[60px] text-center">
                        {FIXED_START_TIME}
                      </span>
                      <span className="text-muted-foreground">—</span>
                      <div className="flex items-center gap-2">
                        <Label className="text-xs text-muted-foreground sr-only">Eindtijd</Label>
                        <Select
                          value={entry.end_time}
                          onValueChange={(val) => updateEntry(index, 'end_time', val)}
                        >
                          <SelectTrigger className="w-[100px] h-9">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {END_TIME_OPTIONS.map((t) => (
                              <SelectItem key={t} value={t}>{t}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <span className="text-sm text-muted-foreground ml-auto">
                        {calculateDayHours(entry).toFixed(1)}u
                      </span>
                    </>
                  )}

                  {!entry.active && isDisabledByCapacity && cap && (
                    <span className="text-sm text-red-500 ml-auto">
                      Volgeboekt ({cap.used}/{cap.max})
                    </span>
                  )}

                  {!entry.active && !isDisabledByCapacity && (
                    <span className="text-sm text-muted-foreground ml-auto">Vrij</span>
                  )}
                </div>

                {coachAbsent && (
                  <p className="text-xs text-yellow-700 px-1">
                    ⚠ {coachName ? `${coachName} is` : 'Je coach is'} niet aanwezig op deze dag.
                  </p>
                )}
              </div>
            )
          })}
        </div>

        {/* Hours summary */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium">Totaal: {totalHours.toFixed(1)} uur / week</span>
            <span className={isValid ? 'text-green-600' : 'text-red-600'}>
              {isValid ? 'Voldoende' : `Nog ${(minimumHours - totalHours).toFixed(1)} uur nodig`}
            </span>
          </div>
          <Progress
            value={progressPercent}
            className="h-3"
            indicatorClassName={
              progressPercent >= 100
                ? 'bg-green-500'
                : progressPercent >= 75
                ? 'bg-yellow-500'
                : 'bg-red-500'
            }
          />
        </div>

        {/* Error/success messages */}
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        {success && (
          <Alert>
            <AlertDescription className="text-green-600">{success}</AlertDescription>
          </Alert>
        )}

        {/* Actions */}
        <div className="flex gap-3">
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting || !isValid}
            className="flex-1"
          >
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isEditing ? 'Rooster bijwerken' : 'Rooster indienen'}
          </Button>

          {isEditing && (
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4" />
              )}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

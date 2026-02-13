'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { submitSchedule, updatePendingSchedule, deletePendingSchedule } from '@/app/student/actions'
import { Loader2, Clock, Trash2 } from 'lucide-react'
import type { Schedule, ScheduleEntry } from '@/types'

const DAY_NAMES: Record<number, string> = {
  1: 'Maandag',
  2: 'Dinsdag',
  3: 'Woensdag',
  4: 'Donderdag',
  5: 'Vrijdag',
  6: 'Zaterdag',
  7: 'Zondag',
}

interface ScheduleEditorProps {
  defaultStartTime: string
  minimumHours: number
  periodWeeks: number
  existingPending: Schedule[] | null
}

function buildInitialEntries(
  defaultStartTime: string,
  existingPending: Schedule[] | null
): ScheduleEntry[] {
  const days = [1, 2, 3, 4, 5, 6, 7].map(day => {
    const existing = existingPending?.find(s => s.day_of_week === day)
    if (existing) {
      return {
        day_of_week: day,
        active: true,
        start_time: existing.start_time.slice(0, 5),
        end_time: existing.end_time.slice(0, 5),
      }
    }
    return {
      day_of_week: day,
      active: day >= 1 && day <= 5,
      start_time: defaultStartTime,
      end_time: '17:00',
    }
  })
  return days
}

export function ScheduleEditor({
  defaultStartTime,
  minimumHours,
  periodWeeks,
  existingPending,
}: ScheduleEditorProps) {
  const router = useRouter()
  const isEditing = !!existingPending && existingPending.length > 0

  const [entries, setEntries] = useState<ScheduleEntry[]>(
    buildInitialEntries(defaultStartTime, existingPending)
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

  const validFrom = new Date().toLocaleDateString('nl-NL', {
    day: 'numeric', month: 'long', year: 'numeric'
  })
  const validUntilDate = new Date()
  validUntilDate.setDate(validUntilDate.getDate() + periodWeeks * 7)
  const validUntil = validUntilDate.toLocaleDateString('nl-NL', {
    day: 'numeric', month: 'long', year: 'numeric'
  })

  const handleSubmit = async () => {
    setIsSubmitting(true)
    setError(null)
    setSuccess(null)

    const action = isEditing ? updatePendingSchedule : submitSchedule
    const result = await action({ entries })

    if (result.error) {
      setError(result.error)
    } else {
      setSuccess(isEditing ? 'Rooster bijgewerkt!' : 'Rooster ingediend! Wacht op goedkeuring van je docent.')
      router.refresh()
    }

    setIsSubmitting(false)
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
        <div className="rounded-lg bg-muted p-3 text-sm">
          <p className="font-medium">Geldigheidsperiode</p>
          <p className="text-muted-foreground">{validFrom} — {validUntil} ({periodWeeks} weken)</p>
        </div>

        {/* Day entries */}
        <div className="space-y-3">
          {entries.map((entry, index) => (
            <div
              key={entry.day_of_week}
              className={`flex items-center gap-3 rounded-lg border p-3 transition-colors ${
                entry.active ? 'bg-background' : 'bg-muted/50 opacity-60'
              }`}
            >
              <label className="flex items-center gap-2 min-w-[120px] cursor-pointer">
                <input
                  type="checkbox"
                  checked={entry.active}
                  onChange={(e) => updateEntry(index, 'active', e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300"
                />
                <span className="text-sm font-medium">{DAY_NAMES[entry.day_of_week]}</span>
              </label>

              {entry.active && (
                <>
                  <div className="flex items-center gap-2">
                    <Label className="text-xs text-muted-foreground sr-only">Start</Label>
                    <Input
                      type="time"
                      value={entry.start_time}
                      onChange={(e) => updateEntry(index, 'start_time', e.target.value)}
                      className="w-[120px] h-9"
                    />
                  </div>
                  <span className="text-muted-foreground">—</span>
                  <div className="flex items-center gap-2">
                    <Label className="text-xs text-muted-foreground sr-only">Eind</Label>
                    <Input
                      type="time"
                      value={entry.end_time}
                      onChange={(e) => updateEntry(index, 'end_time', e.target.value)}
                      className="w-[120px] h-9"
                    />
                  </div>
                  <span className="text-sm text-muted-foreground ml-auto">
                    {calculateDayHours(entry).toFixed(1)}u
                  </span>
                </>
              )}

              {!entry.active && (
                <span className="text-sm text-muted-foreground ml-auto">Vrij</span>
              )}
            </div>
          ))}
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

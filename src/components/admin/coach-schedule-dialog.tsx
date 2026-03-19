'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Input } from '@/components/ui/input'
import { Loader2 } from 'lucide-react'
import { updateCoachSchedule } from '@/app/admin/actions'

const DAY_NAMES: Record<number, string> = {
  1: 'Maandag',
  2: 'Dinsdag',
  3: 'Woensdag',
  4: 'Donderdag',
  5: 'Vrijdag',
  6: 'Zaterdag',
  7: 'Zondag',
}

interface CoachScheduleEntry {
  day_of_week: number
  start_time: string
  end_time: string
}

interface CoachScheduleDialogProps {
  coachId: string
  coachName: string
  existingSchedule: CoachScheduleEntry[]
  open: boolean
  onOpenChange: (open: boolean) => void
}

interface DayState {
  active: boolean
  start_time: string
  end_time: string
}

export function CoachScheduleDialog({
  coachId,
  coachName,
  existingSchedule,
  open,
  onOpenChange,
}: CoachScheduleDialogProps) {
  const buildInitial = (): Record<number, DayState> => {
    const result: Record<number, DayState> = {}
    for (let d = 1; d <= 7; d++) {
      const existing = existingSchedule.find(e => e.day_of_week === d)
      result[d] = existing
        ? { active: true, start_time: existing.start_time.slice(0, 5), end_time: existing.end_time.slice(0, 5) }
        : { active: d >= 1 && d <= 5, start_time: '09:00', end_time: '17:00' }
    }
    return result
  }

  const [days, setDays] = useState<Record<number, DayState>>(buildInitial)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const update = (day: number, field: keyof DayState, value: string | boolean) => {
    setDays(prev => ({ ...prev, [day]: { ...prev[day], [field]: value } }))
  }

  const handleSave = async () => {
    setIsSaving(true)
    setError(null)
    setSuccess(null)

    const entries = Object.entries(days)
      .filter(([, state]) => state.active)
      .map(([day, state]) => ({
        day_of_week: Number(day),
        start_time: state.start_time,
        end_time: state.end_time,
      }))

    const result = await updateCoachSchedule(coachId, entries)

    if (result.error) {
      setError(result.error)
    } else {
      setSuccess('Werkrooster opgeslagen.')
    }

    setIsSaving(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Werkrooster — {coachName}</DialogTitle>
          <DialogDescription>
            Selecteer de dagen en tijden waarop deze coach aanwezig is.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2 py-2">
          {[1, 2, 3, 4, 5, 6, 7].map(day => (
            <div key={day} className={`flex items-center gap-3 rounded-lg border p-2 ${days[day].active ? '' : 'opacity-60 bg-muted/40'}`}>
              <label className="flex items-center gap-2 min-w-[100px] cursor-pointer">
                <input
                  type="checkbox"
                  checked={days[day].active}
                  onChange={e => update(day, 'active', e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300"
                />
                <span className="text-sm font-medium">{DAY_NAMES[day]}</span>
              </label>

              {days[day].active && (
                <>
                  <Input
                    type="time"
                    value={days[day].start_time}
                    onChange={e => update(day, 'start_time', e.target.value)}
                    className="w-[110px] h-8 text-sm"
                  />
                  <span className="text-muted-foreground text-sm">—</span>
                  <Input
                    type="time"
                    value={days[day].end_time}
                    onChange={e => update(day, 'end_time', e.target.value)}
                    className="w-[110px] h-8 text-sm"
                  />
                </>
              )}
            </div>
          ))}
        </div>

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

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Sluiten
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Opslaan
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

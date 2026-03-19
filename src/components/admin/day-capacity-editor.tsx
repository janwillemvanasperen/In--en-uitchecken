'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { updateDayCapacities } from '@/app/admin/actions'
import { Loader2, Users } from 'lucide-react'

const DAY_NAMES: Record<number, string> = {
  1: 'Maandag',
  2: 'Dinsdag',
  3: 'Woensdag',
  4: 'Donderdag',
  5: 'Vrijdag',
  6: 'Zaterdag',
  7: 'Zondag',
}

interface DayCapacityRow {
  day_of_week: number
  max_spots: number
}

interface DayCapacityEditorProps {
  initialCapacities: DayCapacityRow[]
}

export function DayCapacityEditor({ initialCapacities }: DayCapacityEditorProps) {
  const allDays = [1, 2, 3, 4, 5, 6, 7].map(day => {
    const existing = initialCapacities.find(c => c.day_of_week === day)
    return { day_of_week: day, max_spots: existing?.max_spots ?? 50 }
  })

  const [capacities, setCapacities] = useState<DayCapacityRow[]>(allDays)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const updateSpots = (day: number, value: string) => {
    const num = parseInt(value, 10)
    setCapacities(prev =>
      prev.map(c => c.day_of_week === day ? { ...c, max_spots: isNaN(num) ? 0 : Math.max(0, num) } : c)
    )
  }

  const handleSave = async () => {
    setIsSaving(true)
    setError(null)
    setSuccess(null)

    const result = await updateDayCapacities(capacities)

    if (result.error) {
      setError(result.error)
    } else {
      setSuccess('Capaciteit opgeslagen.')
    }

    setIsSaving(false)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Dagcapaciteit
        </CardTitle>
        <CardDescription>
          Stel het maximaal aantal studenten per dag in. Volle dagen zijn niet meer selecteerbaar voor studenten.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          {capacities.map(({ day_of_week, max_spots }) => (
            <div key={day_of_week} className="flex items-center gap-3">
              <span className="text-sm font-medium w-[100px]">{DAY_NAMES[day_of_week]}</span>
              <Input
                type="number"
                min={0}
                value={max_spots}
                onChange={(e) => updateSpots(day_of_week, e.target.value)}
                className="w-[100px] h-9"
              />
              <span className="text-sm text-muted-foreground">plekken</span>
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

        <Button onClick={handleSave} disabled={isSaving}>
          {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Opslaan
        </Button>
      </CardContent>
    </Card>
  )
}

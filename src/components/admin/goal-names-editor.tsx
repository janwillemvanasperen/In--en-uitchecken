'use client'

import { useState, useTransition } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { upsertGoalName } from '@/app/admin/actions'
import { Loader2, Check } from 'lucide-react'

interface GoalName {
  goal_number: number
  goal_name: string
  description: string | null
}

export function GoalNamesEditor({ goalNames }: { goalNames: GoalName[] }) {
  const [names, setNames] = useState<GoalName[]>(goalNames)
  const [saved, setSaved] = useState<Record<number, boolean>>({})
  const [errors, setErrors] = useState<Record<number, string>>({})
  const [pending, startTransition] = useTransition()

  const handleSave = (gn: GoalName) => {
    startTransition(async () => {
      const result = await upsertGoalName(gn.goal_number, gn.goal_name, gn.description || undefined)
      if (result.error) {
        setErrors(p => ({ ...p, [gn.goal_number]: result.error! }))
      } else {
        setSaved(p => ({ ...p, [gn.goal_number]: true }))
        setTimeout(() => setSaved(p => ({ ...p, [gn.goal_number]: false })), 2000)
        setErrors(p => { const n = { ...p }; delete n[gn.goal_number]; return n })
      }
    })
  }

  return (
    <div className="space-y-3">
      {names.map((gn) => (
        <div key={gn.goal_number} className="flex items-start gap-3">
          <span className="text-xs text-muted-foreground w-4 pt-2 shrink-0">{gn.goal_number}</span>
          <div className="flex-1 grid grid-cols-2 gap-2">
            <Input
              value={gn.goal_name}
              onChange={e => setNames(p => p.map(n => n.goal_number === gn.goal_number ? { ...n, goal_name: e.target.value } : n))}
              placeholder="Doelnaam"
              className="h-8 text-sm"
            />
            <Input
              value={gn.description || ''}
              onChange={e => setNames(p => p.map(n => n.goal_number === gn.goal_number ? { ...n, description: e.target.value } : n))}
              placeholder="Beschrijving (optioneel)"
              className="h-8 text-sm"
            />
          </div>
          <Button
            size="sm"
            variant="outline"
            className="h-8 text-xs shrink-0"
            onClick={() => handleSave(gn)}
            disabled={pending}
          >
            {saved[gn.goal_number]
              ? <Check className="h-3 w-3 text-green-600" />
              : pending
                ? <Loader2 className="h-3 w-3 animate-spin" />
                : 'Opslaan'}
          </Button>
          {errors[gn.goal_number] && (
            <p className="text-xs text-red-500 col-span-full">{errors[gn.goal_number]}</p>
          )}
        </div>
      ))}
    </div>
  )
}

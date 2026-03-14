'use client'

import { useState, useTransition, useMemo } from 'react'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { GoalPhaseCircle } from '@/components/shared/goal-phase-circle'
import { upsertStudentGoalPhases } from '@/app/admin/actions'

const PHASE_LABELS = ['Onbekend', 'Oriëntatie', 'Ontwikkeling', 'Beheersing', 'Expert']

interface StudentWithGoals {
  id: string
  full_name: string
  class_code: string | null
  goal_phases: [number, number, number, number, number, number]
}

interface GoalName {
  goal_number: number
  goal_name: string
  description: string | null
}

function PhaseSelect({
  studentId,
  goalNumber,
  phase,
  onChange,
}: {
  studentId: string
  goalNumber: number
  phase: number
  onChange: (studentId: string, goalNumber: number, phase: number) => void
}) {
  const [, startTransition] = useTransition()

  const handleChange = (val: string) => {
    const newPhase = Number(val)
    onChange(studentId, goalNumber, newPhase)
    startTransition(async () => {
      await upsertStudentGoalPhases(studentId, [{ goal_number: goalNumber, phase: newPhase }])
    })
  }

  return (
    <Select value={String(phase)} onValueChange={handleChange}>
      <SelectTrigger className="h-7 text-xs w-28 border-0 bg-transparent hover:bg-muted px-1">
        <div className="flex items-center gap-1">
          <GoalPhaseCircle phase={phase} size="sm" />
          <span className="truncate">{PHASE_LABELS[phase]}</span>
        </div>
      </SelectTrigger>
      <SelectContent>
        {PHASE_LABELS.map((label, i) => (
          <SelectItem key={i} value={String(i)}>
            <div className="flex items-center gap-2">
              <GoalPhaseCircle phase={i} size="sm" />
              {label}
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

export function StudentGoalsEditor({
  students,
  goalNames,
}: {
  students: StudentWithGoals[]
  goalNames: GoalName[]
}) {
  const [phases, setPhases] = useState<Record<string, [number, number, number, number, number, number]>>(
    Object.fromEntries(students.map(s => [s.id, s.goal_phases]))
  )
  const [search, setSearch] = useState('')

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return students.filter(s =>
      !q ||
      s.full_name.toLowerCase().includes(q) ||
      (s.class_code || '').toLowerCase().includes(q)
    )
  }, [students, search])

  const handleChange = (studentId: string, goalNumber: number, phase: number) => {
    setPhases(prev => {
      const cur = [...(prev[studentId] || [0, 0, 0, 0, 0, 0])] as [number, number, number, number, number, number]
      cur[goalNumber - 1] = phase
      return { ...prev, [studentId]: cur }
    })
  }

  return (
    <div className="space-y-3">
      <div className="px-4 pt-2">
        <Input
          placeholder="Zoeken op naam of klas..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="h-8 text-sm w-64"
        />
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 border-b border-t">
            <tr>
              <th className="text-left px-4 py-2 font-medium text-xs text-muted-foreground min-w-[160px]">Student</th>
              {goalNames.map(gn => (
                <th key={gn.goal_number} className="px-2 py-2 font-medium text-xs text-muted-foreground min-w-[130px]">
                  {gn.goal_name}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y">
            {filtered.map(s => (
              <tr key={s.id} className="hover:bg-muted/20">
                <td className="px-4 py-1.5">
                  <div className="flex items-center gap-2">
                    <span className="font-medium truncate max-w-[120px]">{s.full_name}</span>
                    {s.class_code && (
                      <Badge variant="outline" className="text-xs px-1 py-0 h-4">{s.class_code}</Badge>
                    )}
                  </div>
                </td>
                {goalNames.map((gn, i) => (
                  <td key={gn.goal_number} className="px-2 py-1">
                    <PhaseSelect
                      studentId={s.id}
                      goalNumber={gn.goal_number}
                      phase={phases[s.id]?.[i] ?? 0}
                      onChange={handleChange}
                    />
                  </td>
                ))}
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={99} className="px-4 py-6 text-center text-muted-foreground text-sm">
                  Geen studenten gevonden.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

'use client'

const PHASE_STYLES = [
  { bg: 'bg-gray-200', text: 'text-gray-500',    label: 'Nog niet begonnen' },
  { bg: 'bg-blue-100', text: 'text-blue-700',    label: 'Fase 1' },
  { bg: 'bg-blue-400', text: 'text-white',        label: 'Fase 2' },
  { bg: 'bg-[#ffd100]', text: 'text-black',       label: 'Fase 3' },
  { bg: 'bg-green-500', text: 'text-white',       label: 'Afgerond' },
]

interface GoalPhaseCircleProps {
  phase: number
  goalName?: string
  description?: string | null
  size?: 'sm' | 'md'
}

export function GoalPhaseCircle({ phase, goalName, description, size = 'sm' }: GoalPhaseCircleProps) {
  const p = Math.min(4, Math.max(0, phase || 0))
  const { bg, text, label } = PHASE_STYLES[p]
  const dim = size === 'md' ? 'w-10 h-10 text-base' : 'w-8 h-8 text-sm'
  const tooltip = [goalName, `Fase ${p}: ${label}`, description].filter(Boolean).join('\n')
  return (
    <div
      className={`${dim} rounded-full flex items-center justify-center font-bold ${bg} ${text} select-none cursor-default shrink-0`}
      title={tooltip}
    >
      {p}
    </div>
  )
}

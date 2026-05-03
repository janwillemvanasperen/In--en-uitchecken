// @ts-nocheck
import { requireStudent } from '@/lib/auth'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { PortfolioGoalSection } from '@/components/student/portfolio-goal-section'
import { addPortfolioItem, deletePortfolioItem } from './actions'

export const dynamic = 'force-dynamic'

export default async function StudentPortfolioPage() {
  const user = await requireStudent()
  const supabase = await createClient()
  const adminClient = createAdminClient()

  const [
    { data: goalNamesRaw },
    { data: devGoals },
    { data: items },
    { data: rubricCriteria },
  ] = await Promise.all([
    adminClient
      .from('development_goal_names')
      .select('goal_number, goal_name, description, active')
      .eq('active', true)
      .order('goal_number'),
    adminClient
      .from('student_development_goals')
      .select('goal_1_phase, goal_2_phase, goal_3_phase, goal_4_phase, goal_5_phase, goal_6_phase')
      .eq('student_id', user.id)
      .single(),
    supabase
      .from('portfolio_items')
      .select('*, portfolio_feedback(id, feedback_text, created_at, coach_id)')
      .eq('student_id', user.id)
      .order('created_at', { ascending: false }),
    adminClient
      .from('rubric_criteria')
      .select('goal_number, phase, phase_description')
      .eq('active', true)
      .order('goal_number')
      .order('phase')
      .order('sort_order'),
  ])

  const goalNames = Array.from({ length: 6 }, (_, i) => {
    const found = (goalNamesRaw || []).find((gn) => gn.goal_number === i + 1)
    return found || { goal_number: i + 1, goal_name: `Doel ${i + 1}`, description: null, active: true }
  })

  const phases: number[] = [
    devGoals?.goal_1_phase ?? 0,
    devGoals?.goal_2_phase ?? 0,
    devGoals?.goal_3_phase ?? 0,
    devGoals?.goal_4_phase ?? 0,
    devGoals?.goal_5_phase ?? 0,
    devGoals?.goal_6_phase ?? 0,
  ]

  // Build phase descriptions: { [goal_number]: { [phase]: description } }
  const phaseDescriptions: Record<number, Record<number, string>> = {}
  for (const rc of rubricCriteria || []) {
    if (!phaseDescriptions[rc.goal_number]) phaseDescriptions[rc.goal_number] = {}
    if (!phaseDescriptions[rc.goal_number][rc.phase] && rc.phase_description) {
      phaseDescriptions[rc.goal_number][rc.phase] = rc.phase_description
    }
  }

  // Group items by goal_number → phase
  const itemsByGoalPhase: Record<number, Record<number, any[]>> = {}
  for (const item of items || []) {
    const g = item.goal_number
    const p = item.phase || 1
    if (!itemsByGoalPhase[g]) itemsByGoalPhase[g] = {}
    if (!itemsByGoalPhase[g][p]) itemsByGoalPhase[g][p] = []
    itemsByGoalPhase[g][p].push(item)
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Mijn portfolio</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Voeg bewijs toe per ontwikkeldoel en fase, en vraag feedback aan je coach.
        </p>
      </div>

      {goalNames.map((goal, i) => (
        <PortfolioGoalSection
          key={goal.goal_number}
          goalNumber={goal.goal_number}
          goalName={goal.goal_name}
          goalDescription={goal.description}
          currentPhase={phases[i]}
          phaseDescriptions={phaseDescriptions[goal.goal_number] || {}}
          itemsByPhase={itemsByGoalPhase[goal.goal_number] || {}}
          onAdd={addPortfolioItem}
          onDelete={deletePortfolioItem}
        />
      ))}
    </div>
  )
}

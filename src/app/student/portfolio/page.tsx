// @ts-nocheck
import { requireStudent } from '@/lib/auth'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { PortfolioGoalSection } from '@/components/student/portfolio-goal-section'
import { addPortfolioItem, deletePortfolioItem, submitPhaseReview, cancelPhaseReview } from './actions'

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
    { data: reviewRequestsRaw },
    { data: allSlots },
    { data: slotBookings },
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
      .select('id, goal_number, phase, phase_description, criterion_text, description_insufficient, description_sufficient, description_good, sort_order')
      .eq('active', true)
      .order('goal_number')
      .order('phase')
      .order('sort_order'),
    supabase
      .from('phase_review_requests')
      .select('id, goal_number, phase, status, student_notes, slot_id, progress_meeting_slots(date, start_time, duration_minutes)')
      .eq('student_id', user.id)
      .eq('status', 'submitted'),
    supabase
      .from('progress_meeting_slots')
      .select('id, date, start_time, duration_minutes, max_bookings')
      .eq('active', true)
      .gte('date', new Date().toISOString().split('T')[0])
      .order('date')
      .order('start_time'),
    supabase
      .from('phase_review_requests')
      .select('slot_id')
      .neq('status', 'cancelled'),
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

  // Phase descriptions and full criteria grouped by goal_number
  const phaseDescriptions: Record<number, Record<number, string>> = {}
  const criteriaByGoal: Record<number, any[]> = {}
  for (const rc of rubricCriteria || []) {
    if (!phaseDescriptions[rc.goal_number]) phaseDescriptions[rc.goal_number] = {}
    if (!phaseDescriptions[rc.goal_number][rc.phase] && rc.phase_description) {
      phaseDescriptions[rc.goal_number][rc.phase] = rc.phase_description
    }
    if (!criteriaByGoal[rc.goal_number]) criteriaByGoal[rc.goal_number] = []
    criteriaByGoal[rc.goal_number].push(rc)
  }

  // Review requests keyed by "goal_number-phase"
  const reviewRequests: Record<string, any> = {}
  for (const req of reviewRequestsRaw || []) {
    reviewRequests[`${req.goal_number}-${req.phase}`] = req
  }

  // Available slots (exclude fully booked)
  const bookingCounts: Record<string, number> = {}
  for (const b of slotBookings || []) {
    if (b.slot_id) bookingCounts[b.slot_id] = (bookingCounts[b.slot_id] || 0) + 1
  }
  const availableSlots = (allSlots || []).filter(
    (s) => (bookingCounts[s.id] || 0) < s.max_bookings
  )

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
          reviewRequests={reviewRequests}
          availableSlots={availableSlots}
          allCriteria={criteriaByGoal[goal.goal_number] || []}
          onAdd={addPortfolioItem}
          onDelete={deletePortfolioItem}
          onSubmitReview={submitPhaseReview}
          onCancelReview={cancelPhaseReview}
        />
      ))}
    </div>
  )
}

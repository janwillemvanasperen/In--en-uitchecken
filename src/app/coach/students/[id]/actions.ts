// @ts-nocheck
'use server'

import { requireCoach } from '@/lib/auth'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function addPortfolioFeedback(
  itemId: string,
  feedbackText: string
): Promise<{ error?: string }> {
  const coach = await requireCoach()
  const supabase = await createClient()

  if (!feedbackText.trim()) return { error: 'Feedback mag niet leeg zijn' }

  const { error } = await supabase.from('portfolio_feedback').insert({
    item_id: itemId,
    coach_id: coach.id,
    feedback_text: feedbackText.trim(),
  })

  if (error) return { error: error.message }

  revalidatePath('/coach/students', 'layout')
  return {}
}

type Score = 'onvoldoende' | 'voldoende' | 'goed'
const SCORE_VALUE: Record<Score, number> = { onvoldoende: 0, voldoende: 1, goed: 2 }

export async function assessPortfolioPhase(
  studentId: string,
  goalNumber: number,
  phaseAssessed: number,
  scores: { criterion_id: string; score: Score }[],
  notes?: string
): Promise<{ error?: string }> {
  const coach = await requireCoach()
  const supabase = await createClient()
  const adminClient = createAdminClient()

  // Compute overall result from rubric scores
  const total = scores.reduce((sum, s) => sum + SCORE_VALUE[s.score], 0)
  const maxPossible = scores.length * 2
  const pct = maxPossible > 0 ? (total / maxPossible) * 100 : 0
  const result: Score = pct >= 80 ? 'goed' : pct >= 50 ? 'voldoende' : 'onvoldoende'

  // Insert assessment record
  const { data: assessment, error: insertError } = await supabase
    .from('portfolio_assessments')
    .insert({
      student_id: studentId,
      coach_id: coach.id,
      goal_number: goalNumber,
      phase_assessed: phaseAssessed,
      result,
      notes: notes?.trim() || null,
    })
    .select('id')
    .single()

  if (insertError) return { error: insertError.message }

  // Insert rubric scores
  if (scores.length > 0 && assessment?.id) {
    const { error: scoresError } = await supabase.from('rubric_scores').insert(
      scores.map((s) => ({
        assessment_id: assessment.id,
        criterion_id: s.criterion_id,
        score: s.score,
      }))
    )
    if (scoresError) return { error: scoresError.message }
  }

  // Advance phase if result is voldoende or goed
  if (result === 'voldoende' || result === 'goed') {
    const colName = `goal_${goalNumber}_phase`

    const { data: current, error: fetchError } = await adminClient
      .from('student_development_goals')
      .select(colName)
      .eq('student_id', studentId)
      .single()

    if (fetchError) return { error: fetchError.message }

    const currentPhase = current?.[colName] ?? 0
    const newPhase = Math.min(currentPhase + 1, 4)

    const { error: updateError } = await adminClient
      .from('student_development_goals')
      .update({ [colName]: newPhase, updated_at: new Date().toISOString(), updated_by: coach.id })
      .eq('student_id', studentId)

    if (updateError) return { error: updateError.message }
  }

  revalidatePath('/coach/students', 'layout')
  revalidatePath('/student/portfolio')
  revalidatePath('/student/dashboard')
  return {}
}

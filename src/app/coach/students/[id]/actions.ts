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

export async function assessPortfolioPhase(
  studentId: string,
  goalNumber: number,
  phaseAssessed: number,
  result: 'onvoldoende' | 'voldoende' | 'goed',
  notes?: string
): Promise<{ error?: string }> {
  const coach = await requireCoach()
  const supabase = await createClient()
  const adminClient = createAdminClient()

  const { error: insertError } = await supabase.from('portfolio_assessments').insert({
    student_id: studentId,
    coach_id: coach.id,
    goal_number: goalNumber,
    phase_assessed: phaseAssessed,
    result,
    notes: notes?.trim() || null,
  })

  if (insertError) return { error: insertError.message }

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

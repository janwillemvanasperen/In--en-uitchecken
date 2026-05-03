// @ts-nocheck
'use server'

import { requireStudent } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function addPortfolioItem(data: {
  goal_number: number
  phase: number
  title: string
  description?: string
  link_url?: string
  file_url?: string
}): Promise<{ error?: string }> {
  const user = await requireStudent()
  const supabase = await createClient()

  if (!data.title.trim()) return { error: 'Titel is verplicht' }
  if (!data.description?.trim() && !data.link_url?.trim() && !data.file_url?.trim()) {
    return { error: 'Voeg een reflectie, link of bestand toe' }
  }

  const { error } = await supabase.from('portfolio_items').insert({
    student_id: user.id,
    goal_number: data.goal_number,
    phase: data.phase,
    title: data.title.trim(),
    description: data.description?.trim() || null,
    link_url: data.link_url?.trim() || null,
    file_url: data.file_url?.trim() || null,
  })

  if (error) return { error: error.message }

  revalidatePath('/student/portfolio')
  revalidatePath('/student/dashboard')
  return {}
}

export async function submitPhaseReview(data: {
  goal_number: number
  phase: number
  slot_id: string
  self_scores: { criterion_id: string; score: 'onvoldoende' | 'voldoende' | 'goed' }[]
  notes?: string
}): Promise<{ error?: string }> {
  const user = await requireStudent()
  const supabase = await createClient()

  const { data: existing } = await supabase
    .from('phase_review_requests')
    .select('id')
    .eq('student_id', user.id)
    .eq('goal_number', data.goal_number)
    .eq('phase', data.phase)
    .eq('status', 'submitted')
    .maybeSingle()

  if (existing) return { error: 'Er is al een aanvraag ingediend voor deze fase.' }

  const { data: request, error: reqError } = await supabase
    .from('phase_review_requests')
    .insert({
      student_id: user.id,
      goal_number: data.goal_number,
      phase: data.phase,
      slot_id: data.slot_id,
      student_notes: data.notes?.trim() || null,
      status: 'submitted',
    })
    .select('id')
    .single()

  if (reqError) return { error: reqError.message }

  if (data.self_scores.length > 0 && request?.id) {
    const { error: scoresError } = await supabase.from('phase_review_self_scores').insert(
      data.self_scores.map((s) => ({
        request_id: request.id,
        criterion_id: s.criterion_id,
        score: s.score,
      }))
    )
    if (scoresError) return { error: scoresError.message }
  }

  revalidatePath('/student/portfolio')
  return {}
}

export async function cancelPhaseReview(requestId: string): Promise<{ error?: string }> {
  const user = await requireStudent()
  const supabase = await createClient()

  const { error } = await supabase
    .from('phase_review_requests')
    .update({ status: 'cancelled', updated_at: new Date().toISOString() })
    .eq('id', requestId)
    .eq('student_id', user.id)
    .eq('status', 'submitted')

  if (error) return { error: error.message }

  revalidatePath('/student/portfolio')
  return {}
}

export async function deletePortfolioItem(itemId: string): Promise<{ error?: string }> {
  const user = await requireStudent()
  const supabase = await createClient()

  const { error } = await supabase
    .from('portfolio_items')
    .delete()
    .eq('id', itemId)
    .eq('student_id', user.id)

  if (error) return { error: error.message }

  revalidatePath('/student/portfolio')
  revalidatePath('/student/dashboard')
  return {}
}

export async function requestItemFeedback(
  itemId: string,
  data: {
    request_type: 'coach' | 'student' | 'external'
    target_user_id?: string
    target_name?: string
    target_email?: string
  }
): Promise<{ error?: string; token?: string }> {
  const user = await requireStudent()
  const supabase = await createClient()

  const { data: item } = await supabase
    .from('portfolio_items')
    .select('id')
    .eq('id', itemId)
    .eq('student_id', user.id)
    .single()

  if (!item) return { error: 'Item niet gevonden' }

  const { data: existing } = await supabase
    .from('portfolio_feedback_requests')
    .select('id')
    .eq('item_id', itemId)
    .eq('request_type', data.request_type)
    .eq('status', 'pending')
    .maybeSingle()

  if (existing) return { error: 'Er is al een openstaande aanvraag voor dit type feedback' }

  const token = data.request_type === 'external' ? crypto.randomUUID().replace(/-/g, '') : null

  const { error } = await supabase.from('portfolio_feedback_requests').insert({
    item_id: itemId,
    student_id: user.id,
    request_type: data.request_type,
    target_user_id: data.target_user_id || null,
    target_name: data.target_name || null,
    target_email: data.target_email || null,
    token,
  })

  if (error) return { error: error.message }

  revalidatePath('/student/portfolio')
  return { token: token || undefined }
}

export async function cancelFeedbackRequest(requestId: string): Promise<{ error?: string }> {
  const user = await requireStudent()
  const supabase = await createClient()

  const { error } = await supabase
    .from('portfolio_feedback_requests')
    .delete()
    .eq('id', requestId)
    .eq('student_id', user.id)
    .eq('status', 'pending')

  if (error) return { error: error.message }

  revalidatePath('/student/portfolio')
  return {}
}

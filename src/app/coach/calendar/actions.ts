// @ts-nocheck
'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { requireCoach } from '@/lib/auth'

export type CalendarActionType = 'submit_schedule' | 'submit_leave_request' | 'check_in'
export type CalendarVariant = 'coach' | 'shared'

export interface CreateCalendarEventData {
  title: string
  description?: string
  event_date: string
  start_time?: string
  end_time?: string
  variant: CalendarVariant
  student_id?: string | null
  label_id?: string | null
  action_type?: CalendarActionType | null
  action_label?: string
}

export async function createCalendarEvent(data: CreateCalendarEventData): Promise<{ error?: string }> {
  const coach = await requireCoach()
  const supabase = await createClient()

  const { error } = await supabase.from('calendar_events').insert({
    title: data.title.trim(),
    description: data.description?.trim() || null,
    event_date: data.event_date,
    start_time: data.start_time || null,
    end_time: data.end_time || null,
    variant: data.variant,
    created_by: coach.id,
    student_id: data.student_id || null,
    label_id: data.label_id || null,
    action_type: data.action_type || null,
    action_label: data.action_label?.trim() || null,
  })

  if (error) return { error: error.message }

  revalidatePath('/coach/calendar')
  revalidatePath('/student/dashboard')
  revalidatePath('/student/calendar')
  return {}
}

export async function updateCalendarEvent(
  eventId: string,
  data: Partial<CreateCalendarEventData>
): Promise<{ error?: string }> {
  const coach = await requireCoach()
  const supabase = await createClient()

  // Verify the coach owns this event or it's a shared event of one of their students
  const { data: existing } = await supabase
    .from('calendar_events')
    .select('id, created_by, variant, student_id')
    .eq('id', eventId)
    .single()

  if (!existing) return { error: 'Item niet gevonden' }
  if (existing.created_by !== coach.id && !(existing.variant === 'shared')) {
    return { error: 'Geen toegang tot dit item' }
  }

  const updates: Record<string, unknown> = {}
  if (data.title !== undefined) updates.title = data.title.trim()
  if (data.description !== undefined) updates.description = data.description?.trim() || null
  if (data.event_date !== undefined) updates.event_date = data.event_date
  if (data.start_time !== undefined) updates.start_time = data.start_time || null
  if (data.end_time !== undefined) updates.end_time = data.end_time || null
  if (data.student_id !== undefined) updates.student_id = data.student_id || null
  if (data.label_id !== undefined) updates.label_id = data.label_id || null
  if (data.action_type !== undefined) updates.action_type = data.action_type || null
  if (data.action_label !== undefined) updates.action_label = data.action_label?.trim() || null

  const { error } = await supabase
    .from('calendar_events')
    .update(updates)
    .eq('id', eventId)

  if (error) return { error: error.message }

  revalidatePath('/coach/calendar')
  revalidatePath('/student/dashboard')
  revalidatePath('/student/calendar')
  return {}
}

export async function deleteCalendarEvent(eventId: string): Promise<{ error?: string }> {
  await requireCoach()
  const supabase = await createClient()

  const { error } = await supabase
    .from('calendar_events')
    .delete()
    .eq('id', eventId)

  if (error) return { error: error.message }

  revalidatePath('/coach/calendar')
  revalidatePath('/student/dashboard')
  revalidatePath('/student/calendar')
  return {}
}

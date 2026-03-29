// @ts-nocheck
'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { requireStudent } from '@/lib/auth'

export interface CreateSharedEventData {
  title: string
  description?: string
  event_date: string
  all_day: boolean
  start_time?: string
  end_time?: string
}

export async function createSharedCalendarEvent(
  data: CreateSharedEventData
): Promise<{ error?: string }> {
  const student = await requireStudent()
  const supabase = await createClient()

  const { error } = await supabase.from('calendar_events').insert({
    title: data.title.trim(),
    description: data.description?.trim() || null,
    event_date: data.event_date,
    all_day: data.all_day ?? false,
    start_time: data.all_day ? null : (data.start_time || null),
    end_time: data.all_day ? null : (data.end_time || null),
    variant: 'shared',
    created_by: student.id,
    student_id: student.id,
  })

  if (error) return { error: error.message }

  revalidatePath('/student/calendar')
  revalidatePath('/student/dashboard')
  return {}
}

export async function updateSharedCalendarEvent(
  eventId: string,
  data: Partial<CreateSharedEventData>
): Promise<{ error?: string }> {
  const student = await requireStudent()
  const supabase = await createClient()

  // RLS ensures the student can only update their own shared events,
  // but we also check here for a clear error message.
  const { data: existing } = await supabase
    .from('calendar_events')
    .select('id, student_id, variant')
    .eq('id', eventId)
    .single()

  if (!existing) return { error: 'Item niet gevonden' }
  if (existing.variant !== 'shared' || existing.student_id !== student.id) {
    return { error: 'Geen toegang tot dit item' }
  }

  const updates: Record<string, unknown> = {}
  if (data.title !== undefined) updates.title = data.title.trim()
  if (data.description !== undefined) updates.description = data.description?.trim() || null
  if (data.event_date !== undefined) updates.event_date = data.event_date
  if (data.all_day !== undefined) {
    updates.all_day = data.all_day
    if (data.all_day) { updates.start_time = null; updates.end_time = null }
  }
  if (data.start_time !== undefined && !data.all_day) updates.start_time = data.start_time || null
  if (data.end_time !== undefined && !data.all_day) updates.end_time = data.end_time || null

  const { error } = await supabase
    .from('calendar_events')
    .update(updates)
    .eq('id', eventId)

  if (error) return { error: error.message }

  revalidatePath('/student/calendar')
  revalidatePath('/student/dashboard')
  return {}
}

export async function deleteSharedCalendarEvent(eventId: string): Promise<{ error?: string }> {
  const student = await requireStudent()
  const supabase = await createClient()

  const { data: existing } = await supabase
    .from('calendar_events')
    .select('id, student_id, variant')
    .eq('id', eventId)
    .single()

  if (!existing) return { error: 'Item niet gevonden' }
  if (existing.variant !== 'shared' || existing.student_id !== student.id) {
    return { error: 'Geen toegang tot dit item' }
  }

  const { error } = await supabase
    .from('calendar_events')
    .delete()
    .eq('id', eventId)

  if (error) return { error: error.message }

  revalidatePath('/student/calendar')
  revalidatePath('/student/dashboard')
  return {}
}

// ─── Meeting bookings ─────────────────────────────────────────────────────────

export async function bookMeetingSlot(slotId: string): Promise<{ error?: string }> {
  const student = await requireStudent()
  const supabase = await createClient()

  // Verify slot is still available before booking
  const { data: slot } = await supabase
    .from('meeting_slots')
    .select('available')
    .eq('id', slotId)
    .single()

  if (!slot) return { error: 'Tijdslot niet gevonden' }
  if (!slot.available) return { error: 'Dit tijdslot is niet meer beschikbaar' }

  const { error } = await supabase
    .from('meeting_bookings')
    .insert({ slot_id: slotId, student_id: student.id })

  if (error) {
    if (error.code === '23505') return { error: 'Je hebt dit tijdslot al geboekt' }
    return { error: error.message }
  }

  revalidatePath('/student/calendar')
  return {}
}

export async function cancelMeetingBooking(slotId: string): Promise<{ error?: string }> {
  const student = await requireStudent()
  const supabase = await createClient()

  const { error } = await supabase
    .from('meeting_bookings')
    .delete()
    .eq('slot_id', slotId)
    .eq('student_id', student.id)

  if (error) return { error: error.message }

  revalidatePath('/student/calendar')
  return {}
}

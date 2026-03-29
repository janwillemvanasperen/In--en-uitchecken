// @ts-nocheck
'use server'

import { revalidatePath } from 'next/cache'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { requireCoach } from '@/lib/auth'

export type CalendarActionType = 'submit_schedule' | 'submit_leave_request' | 'check_in'
export type CalendarVariant = 'coach' | 'shared'

export interface CreateCalendarEventData {
  title: string
  description?: string
  event_date: string
  all_day: boolean
  start_time?: string
  end_time?: string
  variant: CalendarVariant
  // For shared events: the owning student; for coach events: leave null
  student_id?: string | null
  // For coach events: null = all students, array = specific students
  target_student_ids?: string[] | null
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
    all_day: data.all_day ?? false,
    start_time: data.all_day ? null : (data.start_time || null),
    end_time: data.all_day ? null : (data.end_time || null),
    variant: data.variant,
    created_by: coach.id,
    student_id: data.variant === 'shared' ? (data.student_id || null) : null,
    target_student_ids: data.variant === 'coach' ? (data.target_student_ids ?? null) : null,
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
  if (data.all_day !== undefined) {
    updates.all_day = data.all_day
    if (data.all_day) { updates.start_time = null; updates.end_time = null }
  }
  if (data.start_time !== undefined && !data.all_day) updates.start_time = data.start_time || null
  if (data.end_time !== undefined && !data.all_day) updates.end_time = data.end_time || null
  if (data.student_id !== undefined) updates.student_id = data.student_id || null
  if (data.target_student_ids !== undefined) updates.target_student_ids = data.target_student_ids ?? null
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

// ─── Meeting cycles ────────────────────────────────────────────────────────────

export interface CreateMeetingCycleData {
  title: string
  description?: string
  date_from: string
  date_until: string
  days_of_week: number[]
  day_start_time: string
  day_end_time: string
  slot_duration: number
  // null = all students of this coach; array = specific students
  target_student_ids?: string[] | null
}

/** Generate all slot records for a cycle and insert them in bulk. */
async function generateSlots(cycleId: string, data: CreateMeetingCycleData) {
  const supabase = createAdminClient()
  const slots: { cycle_id: string; slot_date: string; start_time: string; end_time: string }[] = []

  const from = new Date(data.date_from)
  const until = new Date(data.date_until)

  for (let d = new Date(from); d <= until; d.setDate(d.getDate() + 1)) {
    const dow = d.getDay() === 0 ? 7 : d.getDay() // 1=Mon…7=Sun
    if (!data.days_of_week.includes(dow)) continue

    const dateStr = d.toISOString().slice(0, 10)
    let [h, m] = data.day_start_time.split(':').map(Number)
    const [endH, endM] = data.day_end_time.split(':').map(Number)
    const endMinutes = endH * 60 + endM

    while (h * 60 + m + data.slot_duration <= endMinutes) {
      const startStr = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
      const totalEnd = h * 60 + m + data.slot_duration
      const endStr = `${String(Math.floor(totalEnd / 60)).padStart(2, '0')}:${String(totalEnd % 60).padStart(2, '0')}`
      slots.push({ cycle_id: cycleId, slot_date: dateStr, start_time: startStr, end_time: endStr })
      m += data.slot_duration
      while (m >= 60) { m -= 60; h++ }
    }
  }

  if (slots.length > 0) {
    await supabase.from('meeting_slots').insert(slots)
  }
}

export async function createMeetingCycle(data: CreateMeetingCycleData): Promise<{ error?: string }> {
  const coach = await requireCoach()
  const supabase = await createClient()

  const { data: cycle, error } = await supabase
    .from('meeting_cycles')
    .insert({
      title: data.title.trim(),
      description: data.description?.trim() || null,
      coach_id: coach.id,
      date_from: data.date_from,
      date_until: data.date_until,
      days_of_week: data.days_of_week,
      day_start_time: data.day_start_time,
      day_end_time: data.day_end_time,
      slot_duration: data.slot_duration,
      target_student_ids: data.target_student_ids ?? null,
    })
    .select('id')
    .single()

  if (error || !cycle) return { error: error?.message ?? 'Onbekende fout' }

  await generateSlots(cycle.id, data)

  revalidatePath('/coach/calendar')
  revalidatePath('/student/calendar')
  return {}
}

export async function closeMeetingCycle(cycleId: string): Promise<{ error?: string }> {
  await requireCoach()
  const supabase = await createClient()

  const { error } = await supabase
    .from('meeting_cycles')
    .update({ status: 'closed' })
    .eq('id', cycleId)

  if (error) return { error: error.message }

  revalidatePath('/coach/calendar')
  revalidatePath('/student/calendar')
  return {}
}

export async function deleteMeetingCycle(cycleId: string): Promise<{ error?: string }> {
  await requireCoach()
  const supabase = await createClient()

  const { error } = await supabase
    .from('meeting_cycles')
    .delete()
    .eq('id', cycleId)

  if (error) return { error: error.message }

  revalidatePath('/coach/calendar')
  revalidatePath('/student/calendar')
  return {}
}

export async function toggleSlotAvailability(
  slotId: string,
  available: boolean
): Promise<{ error?: string }> {
  await requireCoach()
  const supabase = await createClient()

  const { error } = await supabase
    .from('meeting_slots')
    .update({ available })
    .eq('id', slotId)

  if (error) return { error: error.message }

  revalidatePath('/coach/calendar')
  revalidatePath('/student/calendar')
  return {}
}

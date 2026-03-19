// @ts-nocheck
'use server'

import { revalidatePath } from 'next/cache'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { requireCoach } from '@/lib/auth'

// ─── Notes CRUD ─────────────────────────────────────────────────────────────

export async function createNote(
  studentId: string,
  noteText: string,
  visibleToStudent: boolean,
  visibleToCoaches: boolean,
  labelId?: string | null,
  notifyCoachUserIds?: string[]
) {
  const coach = await requireCoach()
  const supabase = await createClient()
  const adminClient = createAdminClient()

  // Get coach display name for notifications
  const { data: coachProfile } = await adminClient
    .from('users')
    .select('full_name')
    .eq('id', coach.id)
    .single()

  // Verify coach has access to this student (student must be assigned to this coach)
  const { data: student } = await adminClient
    .from('users')
    .select('full_name, coach_id')
    .eq('id', studentId)
    .eq('role', 'student')
    .single()

  if (!student) return { error: 'Student niet gevonden' }
  if (student.coach_id !== coach.id) return { error: 'Geen toegang tot deze student' }

  const { error } = await supabase.from('coach_notes').insert({
    coach_id: coach.id,
    student_id: studentId,
    note_text: noteText,
    visible_to_student: visibleToStudent,
    visible_to_coaches: visibleToCoaches,
    label_id: labelId || null,
  })

  if (error) return { error: error.message }

  // Send notifications to selected coaches
  if (notifyCoachUserIds && notifyCoachUserIds.length > 0) {
    const notifications = notifyCoachUserIds
      .filter((id) => id !== coach.id)
      .map((userId) => ({
        user_id: userId,
        type: 'note_created',
        title: 'Nieuwe notitie',
        message: `${coachProfile?.full_name ?? 'Een coach'} heeft een notitie toegevoegd voor ${student?.full_name ?? 'een student'}.`,
        related_id: studentId,
        read: false,
      }))

    if (notifications.length > 0) {
      await adminClient.from('notifications').insert(notifications)
    }
  }

  revalidatePath(`/coach/students/${studentId}`)
  revalidatePath('/coach/notes')
  return { success: true }
}

export async function updateNote(
  noteId: string,
  noteText: string,
  visibleToStudent: boolean,
  visibleToCoaches: boolean,
  labelId?: string | null
) {
  const coach = await requireCoach()
  const supabase = await createClient()

  const { data: note } = await supabase
    .from('coach_notes')
    .select('student_id, coach_id')
    .eq('id', noteId)
    .single()

  if (!note || note.coach_id !== coach.id) return { error: 'Geen toegang' }

  const { error } = await supabase
    .from('coach_notes')
    .update({
      note_text: noteText,
      visible_to_student: visibleToStudent,
      visible_to_coaches: visibleToCoaches,
      label_id: labelId !== undefined ? labelId || null : undefined,
      updated_at: new Date().toISOString(),
    })
    .eq('id', noteId)

  if (error) return { error: error.message }
  revalidatePath(`/coach/students/${note.student_id}`)
  revalidatePath('/coach/notes')
  return { success: true }
}

export async function deleteNote(noteId: string) {
  const coach = await requireCoach()
  const supabase = await createClient()

  const { data: note } = await supabase
    .from('coach_notes')
    .select('student_id, coach_id')
    .eq('id', noteId)
    .single()

  if (!note || note.coach_id !== coach.id) return { error: 'Geen toegang' }

  const { error } = await supabase
    .from('coach_notes')
    .delete()
    .eq('id', noteId)

  if (error) return { error: error.message }
  revalidatePath(`/coach/students/${note.student_id}`)
  revalidatePath('/coach/notes')
  return { success: true }
}

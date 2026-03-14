// @ts-nocheck
'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { requireCoach } from '@/lib/auth'

// ─── Notes CRUD ─────────────────────────────────────────────────────────────

export async function createNote(
  studentId: string,
  noteText: string,
  visibleToStudent: boolean,
  visibleToCoaches: boolean
) {
  const coach = await requireCoach()
  const supabase = await createClient()

  const { error } = await supabase.from('coach_notes').insert({
    coach_id: coach.id,
    student_id: studentId,
    note_text: noteText,
    visible_to_student: visibleToStudent,
    visible_to_coaches: visibleToCoaches,
  })

  if (error) return { error: error.message }
  revalidatePath(`/coach/students/${studentId}`)
  revalidatePath('/coach/notes')
  return { success: true }
}

export async function updateNote(
  noteId: string,
  noteText: string,
  visibleToStudent: boolean,
  visibleToCoaches: boolean
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

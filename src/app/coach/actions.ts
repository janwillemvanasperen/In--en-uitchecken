// @ts-nocheck
'use server'

import { revalidatePath } from 'next/cache'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { requireCoach } from '@/lib/auth'

// ─── Helper: get student IDs for a coach view level ─────────────────────────

export async function getStudentIdsForView(
  coachId: string,
  view: 'mijn-studenten' | 'mijn-klas' | 'alle'
): Promise<string[] | null> {
  const supabase = await createClient()

  if (view === 'alle') return null // null = no filter = all students

  if (view === 'mijn-studenten') {
    // Students where their coach entity is linked to this coach user
    const { data } = await supabase
      .from('users')
      .select('id, coaches!users_coach_id_fkey(user_id)')
      .eq('role', 'student')
    const ids = (data || [])
      .filter((u: any) => u.coaches?.user_id === coachId)
      .map((u: any) => u.id)
    return ids
  }

  if (view === 'mijn-klas') {
    // Get class codes of this coach's students, then all students in those classes
    const { data: myStudents } = await supabase
      .from('users')
      .select('class_code, coaches!users_coach_id_fkey(user_id)')
      .eq('role', 'student')
    const myClassCodes = [...new Set(
      (myStudents || [])
        .filter((u: any) => u.coaches?.user_id === coachId && u.class_code)
        .map((u: any) => u.class_code)
    )]
    if (myClassCodes.length === 0) return []
    const { data } = await supabase
      .from('users')
      .select('id')
      .eq('role', 'student')
      .in('class_code', myClassCodes)
    return (data || []).map((u: any) => u.id)
  }

  return null
}

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

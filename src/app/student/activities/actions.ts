// @ts-nocheck
'use server'

import { requireStudent } from '@/lib/auth'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function signUpForActivity(activityId: string): Promise<{ error?: string }> {
  const user = await requireStudent()
  const supabase = await createClient()
  const adminSupabase = createAdminClient()

  // Check spots with admin client (students have no SELECT on activity_signups for others)
  const { data: activity } = await adminSupabase
    .from('activities')
    .select('max_participants, signup_deadline, status')
    .eq('id', activityId)
    .single()

  if (!activity) return { error: 'Activiteit niet gevonden' }
  if (activity.status !== 'active') return { error: 'Activiteit is niet meer beschikbaar' }

  if (activity.signup_deadline && new Date(activity.signup_deadline) < new Date()) {
    return { error: 'De inschrijfdeadline is verstreken' }
  }

  if (activity.max_participants != null) {
    const { count } = await adminSupabase
      .from('activity_signups')
      .select('id', { count: 'exact', head: true })
      .eq('activity_id', activityId)
    if ((count ?? 0) >= activity.max_participants) {
      return { error: 'Er zijn geen plekken meer beschikbaar' }
    }
  }

  const { error } = await supabase
    .from('activity_signups')
    .insert({ activity_id: activityId, student_id: user.id })

  if (error) {
    if (error.code === '23505') return { error: 'Je bent al ingeschreven' }
    return { error: error.message }
  }

  revalidatePath('/student/activities')
  revalidatePath('/student/calendar')
  return {}
}

export async function cancelActivitySignup(activityId: string): Promise<{ error?: string }> {
  const user = await requireStudent()
  const supabase = await createClient()

  const { error } = await supabase
    .from('activity_signups')
    .delete()
    .eq('activity_id', activityId)
    .eq('student_id', user.id)

  if (error) return { error: error.message }

  revalidatePath('/student/activities')
  revalidatePath('/student/calendar')
  return {}
}

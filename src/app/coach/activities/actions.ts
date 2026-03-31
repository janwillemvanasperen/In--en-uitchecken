'use server'

import { requireCoach } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export interface CreateActivityData {
  title: string
  description?: string
  activity_date: string
  start_time?: string
  end_time?: string
  location?: string
  max_participants?: number | null
  signup_deadline?: string | null
}

export async function createActivity(data: CreateActivityData): Promise<{ error?: string }> {
  const user = await requireCoach()
  const adminSupabase = createAdminClient()

  const { error } = await adminSupabase.from('activities').insert({
    title: data.title,
    description: data.description || null,
    activity_date: data.activity_date,
    start_time: data.start_time || null,
    end_time: data.end_time || null,
    location: data.location || null,
    max_participants: data.max_participants ?? null,
    signup_deadline: data.signup_deadline || null,
    created_by: user.id,
    status: 'active',
  })

  if (error) return { error: error.message }
  revalidatePath('/coach/activities')
  return {}
}

export async function cancelActivity(id: string): Promise<{ error?: string }> {
  await requireCoach()
  const adminSupabase = createAdminClient()

  const { error } = await adminSupabase
    .from('activities')
    .update({ status: 'cancelled' })
    .eq('id', id)

  if (error) return { error: error.message }
  revalidatePath('/coach/activities')
  return {}
}

export async function deleteActivity(id: string): Promise<{ error?: string }> {
  await requireCoach()
  const adminSupabase = createAdminClient()

  const { error } = await adminSupabase.from('activities').delete().eq('id', id)

  if (error) return { error: error.message }
  revalidatePath('/coach/activities')
  return {}
}

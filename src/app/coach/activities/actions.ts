// @ts-nocheck
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

const MAX_TITLE_LENGTH = 200
const MAX_DESCRIPTION_LENGTH = 2000
const MAX_LOCATION_LENGTH = 500

export async function createActivity(data: CreateActivityData): Promise<{ error?: string }> {
  const user = await requireCoach()
  const adminSupabase = createAdminClient()

  const title = data.title.trim()
  const description = data.description?.trim() || null
  const location = data.location?.trim() || null

  if (!title) return { error: 'Titel is verplicht' }
  if (title.length > MAX_TITLE_LENGTH) return { error: `Titel mag maximaal ${MAX_TITLE_LENGTH} tekens zijn` }
  if (description && description.length > MAX_DESCRIPTION_LENGTH) return { error: `Omschrijving mag maximaal ${MAX_DESCRIPTION_LENGTH} tekens zijn` }
  if (location && location.length > MAX_LOCATION_LENGTH) return { error: `Locatie mag maximaal ${MAX_LOCATION_LENGTH} tekens zijn` }

  const { error } = await adminSupabase.from('activities').insert({
    title,
    description,
    activity_date: data.activity_date,
    start_time: data.start_time || null,
    end_time: data.end_time || null,
    location,
    max_participants: data.max_participants ?? null,
    signup_deadline: data.signup_deadline || null,
    created_by: user.id,
    status: 'active',
  })

  if (error) return { error: 'Activiteit aanmaken mislukt. Probeer het opnieuw.' }
  revalidatePath('/coach/activities')
  return {}
}

export async function cancelActivity(id: string): Promise<{ error?: string }> {
  const user = await requireCoach()
  const adminSupabase = createAdminClient()

  // Verify ownership before mutating
  const { data: activity } = await adminSupabase
    .from('activities')
    .select('created_by')
    .eq('id', id)
    .single()

  if (!activity) return { error: 'Activiteit niet gevonden' }
  if (activity.created_by !== user.id) return { error: 'Geen toegang tot deze activiteit' }

  const { error } = await adminSupabase
    .from('activities')
    .update({ status: 'cancelled' })
    .eq('id', id)

  if (error) return { error: 'Annuleren mislukt. Probeer het opnieuw.' }
  revalidatePath('/coach/activities')
  return {}
}

export async function deleteActivity(id: string): Promise<{ error?: string }> {
  const user = await requireCoach()
  const adminSupabase = createAdminClient()

  // Verify ownership before mutating
  const { data: activity } = await adminSupabase
    .from('activities')
    .select('created_by')
    .eq('id', id)
    .single()

  if (!activity) return { error: 'Activiteit niet gevonden' }
  if (activity.created_by !== user.id) return { error: 'Geen toegang tot deze activiteit' }

  const { error } = await adminSupabase.from('activities').delete().eq('id', id)

  if (error) return { error: 'Verwijderen mislukt. Probeer het opnieuw.' }
  revalidatePath('/coach/activities')
  return {}
}

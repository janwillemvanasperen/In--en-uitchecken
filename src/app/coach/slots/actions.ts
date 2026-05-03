// @ts-nocheck
'use server'

import { requireCoach } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function createSlot(data: {
  date: string
  start_time: string
  max_bookings: number
}): Promise<{ error?: string }> {
  const coach = await requireCoach()
  const adminClient = createAdminClient()

  if (!data.date || !data.start_time) return { error: 'Datum en tijd zijn verplicht' }

  const { error } = await adminClient.from('progress_meeting_slots').insert({
    date: data.date,
    start_time: data.start_time,
    duration_minutes: 30,
    max_bookings: data.max_bookings || 1,
    created_by: coach.id,
  })

  if (error) return { error: error.message }

  revalidatePath('/coach/slots')
  return {}
}

export async function deleteSlot(slotId: string): Promise<{ error?: string }> {
  await requireCoach()
  const adminClient = createAdminClient()

  const { error } = await adminClient
    .from('progress_meeting_slots')
    .update({ active: false })
    .eq('id', slotId)

  if (error) return { error: error.message }

  revalidatePath('/coach/slots')
  return {}
}

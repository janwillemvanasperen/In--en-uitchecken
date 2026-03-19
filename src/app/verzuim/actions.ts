// @ts-nocheck
'use server'

import { requireAdminOrVerzuim } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function updateCheckInTimes(
  checkInId: string,
  dateStr: string,       // "YYYY-MM-DD"
  checkInTime: string,   // "HH:MM"
  checkOutTime: string | null,
): Promise<{ error?: string }> {
  await requireAdminOrVerzuim()
  const adminClient = createAdminClient()

  const inIso = `${dateStr}T${checkInTime}:00`
  const outIso = checkOutTime ? `${dateStr}T${checkOutTime}:00` : null

  if (outIso && outIso <= inIso) {
    return { error: 'Uittijd moet na inchecktijd liggen.' }
  }

  const { error } = await adminClient
    .from('check_ins')
    .update({ check_in_time: inIso, check_out_time: outIso, updated_at: new Date().toISOString() })
    .eq('id', checkInId)

  if (error) return { error: error.message }
  revalidatePath('/verzuim/dashboard')
  return {}
}

export async function createManualCheckIn(
  userId: string,
  dateStr: string,
  checkInTime: string,   // "HH:MM"
  checkOutTime: string | null,
  expectedStart: string, // "HH:MM" from schedule
  expectedEnd: string,   // "HH:MM" from schedule
): Promise<{ error?: string }> {
  await requireAdminOrVerzuim()
  const adminClient = createAdminClient()

  const inIso = `${dateStr}T${checkInTime}:00`
  const outIso = checkOutTime ? `${dateStr}T${checkOutTime}:00` : null

  if (outIso && outIso <= inIso) {
    return { error: 'Uittijd moet na inchecktijd liggen.' }
  }

  // Use first available location as fallback for manual entries
  const { data: locations } = await adminClient.from('locations').select('id').limit(1)
  if (!locations || locations.length === 0) {
    return { error: 'Geen locaties beschikbaar voor handmatige invoer.' }
  }

  const { error } = await adminClient.from('check_ins').insert({
    user_id: userId,
    location_id: locations[0].id,
    check_in_time: inIso,
    check_out_time: outIso,
    expected_start: `${dateStr}T${expectedStart}:00`,
    expected_end: `${dateStr}T${expectedEnd}:00`,
  })

  if (error) return { error: error.message }
  revalidatePath('/verzuim/dashboard')
  return {}
}

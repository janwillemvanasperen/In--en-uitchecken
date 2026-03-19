// @ts-nocheck
'use server'

import { requireAdminOrVerzuim } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

// Both functions now receive full UTC ISO strings (e.g. "2026-03-19T08:15:00.000Z").
// The UTC conversion happens in the browser (client component) before calling these actions,
// because only the browser knows the user's local timezone offset.

export async function updateCheckInTimes(
  checkInId: string,
  checkInIso: string,        // full UTC ISO timestamp
  checkOutIso: string | null,
): Promise<{ error?: string }> {
  await requireAdminOrVerzuim()
  const adminClient = createAdminClient()

  if (checkOutIso && checkOutIso <= checkInIso) {
    return { error: 'Uittijd moet na inchecktijd liggen.' }
  }

  const { error } = await adminClient
    .from('check_ins')
    .update({ check_in_time: checkInIso, check_out_time: checkOutIso, updated_at: new Date().toISOString() })
    .eq('id', checkInId)

  if (error) return { error: error.message }
  revalidatePath('/verzuim/dashboard')
  return {}
}

export async function createManualCheckIn(
  userId: string,
  checkInIso: string,        // full UTC ISO timestamp
  checkOutIso: string | null,
  expectedStartIso: string,  // full UTC ISO timestamp
  expectedEndIso: string,    // full UTC ISO timestamp
): Promise<{ error?: string }> {
  await requireAdminOrVerzuim()
  const adminClient = createAdminClient()

  if (checkOutIso && checkOutIso <= checkInIso) {
    return { error: 'Uittijd moet na inchecktijd liggen.' }
  }

  const { data: locations } = await adminClient.from('locations').select('id').limit(1)
  if (!locations || locations.length === 0) {
    return { error: 'Geen locaties beschikbaar voor handmatige invoer.' }
  }

  const { error } = await adminClient.from('check_ins').insert({
    user_id: userId,
    location_id: locations[0].id,
    check_in_time: checkInIso,
    check_out_time: checkOutIso,
    expected_start: expectedStartIso,
    expected_end: expectedEndIso,
  })

  if (error) return { error: error.message }
  revalidatePath('/verzuim/dashboard')
  return {}
}

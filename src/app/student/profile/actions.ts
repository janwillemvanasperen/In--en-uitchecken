// @ts-nocheck
'use server'

import { requireStudent } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function regenerateIcalToken(): Promise<{ token?: string; error?: string }> {
  const user = await requireStudent()
  const adminSupabase = createAdminClient()

  const newToken = crypto.randomUUID()

  const { error } = await adminSupabase
    .from('users')
    .update({ ical_token: newToken })
    .eq('id', user.id)

  if (error) return { error: 'Vernieuwen mislukt. Probeer het opnieuw.' }

  revalidatePath('/student/profile')
  return { token: newToken }
}

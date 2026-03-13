// @ts-nocheck
'use server'

import { createClient } from '@/lib/supabase/server'
import { requireAuth } from '@/lib/auth'
import { redirect } from 'next/navigation'

export async function switchRole(newRole: string) {
  const user = await requireAuth()
  const supabase = await createClient()

  // Verify the user actually has this role in their roles array
  const { data: userData } = await supabase
    .from('users')
    .select('roles')
    .eq('id', user.id)
    .single()

  const allowedRoles: string[] = userData?.roles || []
  if (!allowedRoles.includes(newRole)) {
    return { error: 'Je hebt geen toegang tot deze rol' }
  }

  // Update the active role
  const { error } = await supabase
    .from('users')
    .update({ role: newRole as 'student' | 'admin' | 'coach' })
    .eq('id', user.id)

  if (error) {
    return { error: 'Kon niet wisselen van rol' }
  }

  // Redirect to the new role's dashboard
  if (newRole === 'admin') redirect('/admin/dashboard')
  if (newRole === 'coach') redirect('/coach/dashboard')
  redirect('/student/dashboard')
}

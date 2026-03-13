// @ts-nocheck
'use server'

import { createClient } from '@/lib/supabase/server'
import { requireAuth } from '@/lib/auth'

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

  // Return the target dashboard so the client can navigate
  const dashboardMap: Record<string, string> = {
    admin: '/admin/dashboard',
    coach: '/coach/dashboard',
    student: '/student/dashboard',
  }
  return { redirectTo: dashboardMap[newRole] ?? '/student/dashboard' }
}

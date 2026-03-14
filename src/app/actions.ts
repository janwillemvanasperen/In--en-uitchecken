// @ts-nocheck
'use server'

import { revalidatePath } from 'next/cache'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { requireAuth } from '@/lib/auth'

export async function switchRole(newRole: string) {
  const user = await requireAuth()
  const supabase = await createClient()
  const adminClient = createAdminClient()

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

  // Update the active role via admin client to bypass RLS
  const { error } = await adminClient
    .from('users')
    .update({ role: newRole as 'student' | 'admin' | 'coach' })
    .eq('id', user.id)

  if (error) {
    return { error: 'Kon niet wisselen van rol' }
  }

  // Invalidate all dashboard caches so the new page reads fresh data
  revalidatePath('/admin/dashboard', 'layout')
  revalidatePath('/student/dashboard', 'layout')
  revalidatePath('/coach/dashboard', 'layout')

  // Return the target dashboard so the client can navigate
  const dashboardMap: Record<string, string> = {
    admin: '/admin/dashboard',
    coach: '/coach/dashboard',
    student: '/student/dashboard',
  }
  return { redirectTo: dashboardMap[newRole] ?? '/student/dashboard' }
}

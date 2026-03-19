import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import type { Database } from '@/lib/supabase/database.types'

type UserProfile = Database['public']['Tables']['users']['Row']

export async function getCurrentUser(): Promise<UserProfile | null> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return null
  }

  const { data: userData } = await supabase
    .from('users')
    .select('*')
    .eq('id', user.id)
    .single()

  return userData
}

export async function requireAuth(): Promise<UserProfile> {
  const user = await getCurrentUser()
  if (!user) {
    redirect('/auth/login')
  }
  return user
}

export async function requireAdmin(): Promise<UserProfile> {
  const user = await requireAuth()
  if (user.role !== 'admin') {
    redirect('/student/dashboard')
  }
  return user
}

export async function requireStudent(): Promise<UserProfile> {
  const user = await requireAuth()
  if (user.role !== 'student') {
    if (user.role === 'admin') redirect('/admin/dashboard')
    if (user.role === 'coach') redirect('/coach/dashboard')
    if (user.role === 'verzuim') redirect('/verzuim/dashboard')
    redirect('/auth/login')
  }
  return user
}

export async function requireCoach(): Promise<UserProfile> {
  const user = await requireAuth()
  if (user.role !== 'coach') {
    if (user.role === 'admin') redirect('/admin/dashboard')
    if (user.role === 'verzuim') redirect('/verzuim/dashboard')
    redirect('/student/dashboard')
  }
  return user
}

export async function requireVerzuim(): Promise<UserProfile> {
  const user = await requireAuth()
  if (user.role !== 'verzuim') {
    if (user.role === 'admin') redirect('/admin/dashboard')
    if (user.role === 'coach') redirect('/coach/dashboard')
    redirect('/student/dashboard')
  }
  return user
}

export async function requireAdminOrVerzuim(): Promise<UserProfile> {
  const user = await requireAuth()
  if (user.role !== 'admin' && user.role !== 'verzuim') {
    if (user.role === 'coach') redirect('/coach/dashboard')
    redirect('/student/dashboard')
  }
  return user
}

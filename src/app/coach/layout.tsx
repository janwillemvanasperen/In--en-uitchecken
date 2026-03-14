// @ts-nocheck
import { requireCoach } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { CoachShell } from '@/components/coach/coach-shell'

export default async function CoachLayout({ children }: { children: React.ReactNode }) {
  const user = await requireCoach()
  const supabase = await createClient()

  const { data: profile } = await supabase
    .from('users')
    .select('role, roles, profile_photo_url')
    .eq('id', user.id)
    .single()

  const { data: notifications } = await supabase
    .from('notifications')
    .select('id, read')
    .eq('user_id', user.id)
    .eq('read', false)
    .limit(99)

  const unreadCount = (notifications || []).length

  return (
    <CoachShell
      user={{
        id: user.id,
        full_name: user.full_name,
        profile_photo_url: profile?.profile_photo_url || null,
        role: profile?.role || user.role,
        roles: profile?.roles || [user.role],
      }}
      unreadCount={unreadCount}
    >
      {children}
    </CoachShell>
  )
}

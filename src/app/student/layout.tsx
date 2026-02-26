// @ts-nocheck
import { requireStudent } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { StudentHeader } from '@/components/student/student-header'
import { MobileBottomNav } from '@/components/student/mobile-bottom-nav'
import { Breadcrumb } from '@/components/student/breadcrumb'

export default async function StudentLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await requireStudent()
  const supabase = await createClient()

  // Fetch profile photo
  const { data: profile } = await supabase
    .from('users')
    .select('profile_photo_url')
    .eq('id', user.id)
    .single()

  // Fetch recent notifications (max 20)
  const { data: notifications } = await supabase
    .from('notifications')
    .select('id, type, title, message, read, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(20)

  // Count unread
  const unreadCount = (notifications || []).filter((n: any) => !n.read).length

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-0">
      <StudentHeader
        user={{
          id: user.id,
          full_name: user.full_name,
          profile_photo_url: profile?.profile_photo_url || null,
        }}
        notifications={notifications || []}
        unreadCount={unreadCount}
      />
      <Breadcrumb />
      <main className="container mx-auto px-4 py-6">
        {children}
      </main>
      <MobileBottomNav />
    </div>
  )
}

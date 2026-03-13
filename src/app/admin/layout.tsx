// @ts-nocheck
import { requireAdmin } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { LogoutButton } from '@/components/logout-button'
import { RoleSwitcher } from '@/components/shared/role-switcher'
import Link from 'next/link'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await requireAdmin()
  const supabase = await createClient()

  const { data: profile } = await supabase
    .from('users')
    .select('role, roles')
    .eq('id', user.id)
    .single()

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 bg-background border-b shadow-sm">
        <div className="container mx-auto px-4 h-14 flex items-center justify-between">
          <Link href="/admin/dashboard">
            <img src="/logo.png" alt="Scratch MBO Utrecht" className="h-8" />
          </Link>
          <div className="flex items-center gap-2">
            <RoleSwitcher
              currentRole={profile?.role || user.role}
              availableRoles={profile?.roles || [user.role]}
            />
            <span className="hidden sm:block text-sm font-medium">{user.full_name}</span>
            <LogoutButton />
          </div>
        </div>
      </header>
      {children}
    </div>
  )
}

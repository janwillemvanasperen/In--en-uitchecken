// @ts-nocheck
import { requireVerzuim } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { RoleSwitcher } from '@/components/shared/role-switcher'
import { LogoutButton } from '@/components/logout-button'
import Link from 'next/link'
import { LayoutDashboard, UserCheck, FileText, Calendar, Send } from 'lucide-react'

const NAV_ITEMS = [
  { href: '/verzuim/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/verzuim/check-ins', label: 'Aanwezigheid', icon: UserCheck },
  { href: '/verzuim/leave-requests', label: 'Verlof', icon: FileText },
  { href: '/verzuim/schedules', label: 'Roosters', icon: Calendar },
  { href: '/verzuim/schedule-push', label: 'Roosterpush', icon: Send },
]

export default async function VerzuimLayout({ children }: { children: React.ReactNode }) {
  const user = await requireVerzuim()
  const supabase = await createClient()

  const { data: profile } = await supabase
    .from('users')
    .select('role, roles')
    .eq('id', user.id)
    .single()

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 bg-background border-b shadow-sm">
        <div className="container mx-auto px-4 h-14 flex items-center gap-6">
          <Link href="/verzuim/dashboard">
            <img src="/logo.png" alt="Scratch MBO Utrecht" className="h-8" />
          </Link>
          <nav className="hidden md:flex items-center gap-1 flex-1">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              >
                <item.icon className="h-3.5 w-3.5" />
                {item.label}
              </Link>
            ))}
          </nav>
          <div className="flex items-center gap-2 ml-auto">
            <RoleSwitcher
              currentRole={profile?.role || user.role}
              availableRoles={profile?.roles || [user.role]}
            />
            <span className="hidden sm:block text-sm font-medium">{user.full_name}</span>
            <LogoutButton />
          </div>
        </div>
      </header>
      <main className="container mx-auto px-4 py-6">
        {children}
      </main>
    </div>
  )
}

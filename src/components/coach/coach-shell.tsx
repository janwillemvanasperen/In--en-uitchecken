'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { AvatarWithFallback } from '@/components/shared/avatar-with-fallback'
import { RoleSwitcher } from '@/components/shared/role-switcher'
import { LogoutButton } from '@/components/logout-button'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Menu, LayoutDashboard, Users, Briefcase, FileText,
  GitCompare, Settings, Bell
} from 'lucide-react'

const navItems = [
  { href: '/coach/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/coach/students', label: 'Studenten', icon: Users },
  { href: '/coach/work', label: 'Ingediend Werk', icon: Briefcase, comingSoon: true },
  { href: '/coach/notes', label: 'Notities', icon: FileText },
  { href: '/coach/compare', label: 'Vergelijken', icon: GitCompare },
  { href: '/coach/settings', label: 'Instellingen', icon: Settings },
]

interface CoachShellProps {
  user: {
    id: string
    full_name: string
    profile_photo_url?: string | null
    role: string
    roles: string[]
  }
  unreadCount: number
  children: React.ReactNode
}

function NavLink({ item, pathname, onClick }: { item: typeof navItems[0]; pathname: string; onClick?: () => void }) {
  const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
  const Icon = item.icon

  if (item.comingSoon) {
    return (
      <div className="flex items-center gap-3 px-3 py-2.5 rounded-md text-sm text-muted-foreground/50 cursor-not-allowed">
        <Icon className="h-4 w-4 shrink-0" />
        <span>{item.label}</span>
        <Badge variant="outline" className="text-xs px-1 py-0 h-4 ml-auto border-[#ffd100] text-[#ffd100]">Binnenkort</Badge>
      </div>
    )
  }

  return (
    <Link
      href={item.href}
      onClick={onClick}
      className={`flex items-center gap-3 px-3 py-2.5 rounded-md text-sm transition-colors ${
        isActive
          ? 'bg-[#ffd100]/20 text-foreground font-medium border-l-2 border-[#ffd100]'
          : 'text-muted-foreground hover:bg-muted hover:text-foreground'
      }`}
    >
      <Icon className="h-4 w-4 shrink-0" />
      {item.label}
    </Link>
  )
}

export function CoachShell({ user, unreadCount, children }: CoachShellProps) {
  const pathname = usePathname()

  const sidebar = (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b">
        <Link href="/coach/dashboard">
          <img src="/logo.png" alt="Scratch MBO Utrecht" className="h-8" />
        </Link>
      </div>
      <nav className="flex flex-col p-2 gap-0.5 flex-1 overflow-y-auto">
        {navItems.map((item) => (
          <NavLink key={item.href} item={item} pathname={pathname} />
        ))}
      </nav>
      <div className="p-3 border-t">
        <div className="flex items-center gap-2 px-2 py-2">
          <AvatarWithFallback src={user.profile_photo_url} fullName={user.full_name} size="sm" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{user.full_name}</p>
            <p className="text-xs text-muted-foreground">Coach</p>
          </div>
        </div>
        <div className="flex items-center gap-1 mt-1">
          <RoleSwitcher currentRole={user.role} availableRoles={user.roles} />
          <LogoutButton />
        </div>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-background">
      {/* Desktop: sticky sidebar */}
      <div className="hidden md:fixed md:inset-y-0 md:left-0 md:flex md:w-56 md:flex-col md:border-r md:bg-background md:z-40">
        {sidebar}
      </div>

      {/* Mobile header */}
      <header className="md:hidden sticky top-0 z-50 bg-background border-b h-14 flex items-center px-4 gap-2">
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-56 p-0">
            {sidebar}
          </SheetContent>
        </Sheet>
        <Link href="/coach/dashboard" className="flex-1">
          <img src="/logo.png" alt="Scratch MBO Utrecht" className="h-8" />
        </Link>
        <div className="flex items-center gap-1">
          {unreadCount > 0 && (
            <Badge className="bg-[#ffd100] text-black text-xs h-5 min-w-5 flex items-center justify-center">
              {unreadCount}
            </Badge>
          )}
          <RoleSwitcher currentRole={user.role} availableRoles={user.roles} />
        </div>
      </header>

      {/* Main content */}
      <div className="md:pl-56">
        {/* Desktop top bar */}
        <div className="hidden md:flex items-center justify-between px-6 h-12 border-b bg-background/80 sticky top-0 z-30 backdrop-blur">
          <div />
          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <Button variant="ghost" size="sm" className="relative h-8 w-8 p-0">
                <Bell className="h-4 w-4" />
                <span className="absolute -top-0.5 -right-0.5 h-4 w-4 rounded-full bg-[#ffd100] text-black text-xs flex items-center justify-center font-medium">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              </Button>
            )}
          </div>
        </div>
        <main className="px-4 md:px-6 py-6">
          {children}
        </main>
      </div>
    </div>
  )
}

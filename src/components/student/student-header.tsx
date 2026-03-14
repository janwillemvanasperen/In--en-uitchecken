'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { AvatarWithFallback } from '@/components/shared/avatar-with-fallback'
import { RoleSwitcher } from '@/components/shared/role-switcher'
import { LogoutButton } from '@/components/logout-button'
import { NotificationsDropdown } from '@/components/student/notifications-dropdown'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Menu, Home, Calendar, LogIn, FileText, User, History } from 'lucide-react'

const navItems = [
  { href: '/student/dashboard', label: 'Dashboard', icon: Home },
  { href: '/student/check-in', label: 'Check-in', icon: LogIn },
  { href: '/student/schedule', label: 'Rooster', icon: Calendar },
  { href: '/student/leave-requests', label: 'Verlofaanvragen', icon: FileText },
  { href: '/student/history', label: 'Geschiedenis', icon: History },
  { href: '/student/profile', label: 'Profiel', icon: User },
]

interface Notification {
  id: string
  type: string
  title: string
  message: string
  read: boolean
  created_at: string
}

interface StudentHeaderProps {
  user: {
    id: string
    full_name: string
    profile_photo_url?: string | null
    role: string
    roles: string[]
  }
  notifications: Notification[]
  unreadCount: number
}

export function StudentHeader({ user, notifications, unreadCount }: StudentHeaderProps) {
  const pathname = usePathname()

  return (
    <header className="sticky top-0 z-50 bg-background border-b shadow-sm">
      <div className="container mx-auto px-4 h-14 flex items-center justify-between">
        {/* Left: Hamburger (mobile) + Logo */}
        <div className="flex items-center gap-2">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-64 p-0">
              <div className="p-4 border-b">
                <img src="/logo.png" alt="Scratch MBO Utrecht" className="h-8" />
              </div>
              <nav className="flex flex-col p-2 gap-1">
                {navItems.map((item) => {
                  const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
                  const Icon = item.icon
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-md text-sm transition-colors ${
                        isActive
                          ? 'bg-primary/10 text-primary font-medium'
                          : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                      }`}
                    >
                      <Icon className="h-4 w-4 shrink-0" />
                      {item.label}
                    </Link>
                  )
                })}
              </nav>
            </SheetContent>
          </Sheet>

          <Link href="/student/dashboard">
            <img src="/logo.png" alt="Scratch MBO Utrecht" className="h-8" />
          </Link>
        </div>

        {/* Right: Role switcher + Notifications + Avatar + Name + Logout */}
        <div className="flex items-center gap-2">
          <RoleSwitcher currentRole={user.role} availableRoles={user.roles} />
          <NotificationsDropdown
            userId={user.id}
            initialNotifications={notifications}
            initialUnreadCount={unreadCount}
          />
          <Link href="/student/profile" className="flex items-center gap-2">
            <span className="hidden sm:block text-sm font-medium leading-tight">{user.full_name}</span>
            <AvatarWithFallback
              src={user.profile_photo_url}
              fullName={user.full_name}
              size="sm"
            />
          </Link>
          <LogoutButton />
        </div>
      </div>
    </header>
  )
}

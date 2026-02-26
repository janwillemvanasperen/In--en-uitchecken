'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Calendar, LogIn, FileText, User } from 'lucide-react'

const navItems = [
  { href: '/student/dashboard', label: 'Home', icon: Home },
  { href: '/student/schedule', label: 'Rooster', icon: Calendar },
  { href: '/student/check-in', label: 'Check-in', icon: LogIn, isCenter: true },
  { href: '/student/leave-requests', label: 'Verlof', icon: FileText },
  { href: '/student/profile', label: 'Profiel', icon: User },
]

export function MobileBottomNav() {
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-background border-t pb-[env(safe-area-inset-bottom)]">
      <div className="flex items-end justify-around h-16">
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
          const Icon = item.icon

          if (item.isCenter) {
            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex flex-col items-center -mt-4"
              >
                <div className={`h-14 w-14 rounded-full flex items-center justify-center shadow-lg ${isActive ? 'bg-primary' : 'bg-primary'}`}>
                  <Icon className="h-6 w-6 text-primary-foreground" />
                </div>
                <span className={`text-[10px] mt-0.5 ${isActive ? 'text-primary font-medium' : 'text-muted-foreground'}`}>
                  {item.label}
                </span>
              </Link>
            )
          }

          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex flex-col items-center justify-center py-2 px-3"
            >
              <Icon className={`h-5 w-5 ${isActive ? 'text-primary' : 'text-muted-foreground'}`} />
              <span className={`text-[10px] mt-1 ${isActive ? 'text-primary font-medium' : 'text-muted-foreground'}`}>
                {item.label}
              </span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}

'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Calendar, LogIn, BookOpen, User } from 'lucide-react'

const navItems = [
  { href: '/student/dashboard', label: 'Home', icon: Home },
  { href: '/student/schedule', label: 'Rooster', icon: Calendar },
  { href: '/student/check-in', label: 'Check-in', icon: LogIn, isCenter: true },
  { href: '/student/portfolio', label: 'Portfolio', icon: BookOpen, badgeKey: 'portfolio' },
  { href: '/student/profile', label: 'Profiel', icon: User },
]

interface Props {
  badgeCounts?: Record<string, number>
}

export function MobileBottomNav({ badgeCounts = {} }: Props) {
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-background border-t pb-[env(safe-area-inset-bottom)]">
      <div className="flex items-end justify-around h-16">
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
          const Icon = item.icon
          const badge = item.badgeKey ? (badgeCounts[item.badgeKey] ?? 0) : 0

          if (item.isCenter) {
            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex flex-col items-center -mt-4"
              >
                <div className="h-14 w-14 rounded-full flex items-center justify-center shadow-lg bg-primary">
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
              className="flex flex-col items-center justify-center py-2 px-3 relative"
            >
              <div className="relative">
                <Icon className={`h-5 w-5 ${isActive ? 'text-primary' : 'text-muted-foreground'}`} />
                {badge > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 h-4 min-w-4 px-0.5 rounded-full bg-destructive text-destructive-foreground text-[9px] font-bold flex items-center justify-center">
                    {badge > 9 ? '9+' : badge}
                  </span>
                )}
              </div>
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

import Link from 'next/link'
import { AvatarWithFallback } from '@/components/shared/avatar-with-fallback'
import { RoleSwitcher } from '@/components/shared/role-switcher'
import { LogoutButton } from '@/components/logout-button'
import { NotificationsDropdown } from '@/components/student/notifications-dropdown'

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
  return (
    <header className="sticky top-0 z-50 bg-background border-b shadow-sm">
      <div className="container mx-auto px-4 h-14 flex items-center justify-between">
        {/* Left: Logo */}
        <Link href="/student/dashboard">
          <img src="/logo.png" alt="Scratch MBO Utrecht" className="h-8" />
        </Link>

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

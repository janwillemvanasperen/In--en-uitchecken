'use client'

import { useState, useEffect } from 'react'
import { Bell, BellOff, Check, CheckCheck, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { createClient } from '@/lib/supabase/client'
import { markNotificationRead, markAllNotificationsRead } from '@/app/student/actions'
import {
  isPushSupported,
  registerServiceWorker,
  subscribeToPush,
  getExistingSubscription,
  unsubscribeFromPush,
} from '@/lib/push-notifications'
import { savePushSubscription, deletePushSubscription } from '@/app/student/actions'

interface Notification {
  id: string
  type: string
  title: string
  message: string
  read: boolean
  created_at: string
}

interface NotificationsDropdownProps {
  userId: string
  initialNotifications: Notification[]
  initialUnreadCount: number
}

export function NotificationsDropdown({
  userId,
  initialNotifications,
  initialUnreadCount,
}: NotificationsDropdownProps) {
  const [notifications, setNotifications] = useState<Notification[]>(initialNotifications)
  const [unreadCount, setUnreadCount] = useState(initialUnreadCount)
  const [open, setOpen] = useState(false)
  const supabase = createClient()

  // Push notification state
  const [pushSupported, setPushSupported] = useState(false)
  const [pushSubscribed, setPushSubscribed] = useState(false)
  const [pushLoading, setPushLoading] = useState(true)
  const [pushToggling, setPushToggling] = useState(false)

  // Check push notification status
  useEffect(() => {
    const checkPush = async () => {
      const supported = isPushSupported()
      setPushSupported(supported)
      if (supported) {
        const sub = await getExistingSubscription()
        setPushSubscribed(!!sub)
      }
      setPushLoading(false)
    }
    checkPush()
  }, [])

  // Real-time subscription for new notifications
  useEffect(() => {
    const channel = supabase
      .channel(`notifications-${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          const newNotification = payload.new as Notification
          setNotifications((prev) => [newNotification, ...prev].slice(0, 20))
          setUnreadCount((prev) => prev + 1)
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [userId, supabase])

  async function handleMarkRead(id: string) {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    )
    setUnreadCount((prev) => Math.max(0, prev - 1))
    await markNotificationRead(id)
  }

  async function handleMarkAllRead() {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
    setUnreadCount(0)
    await markAllNotificationsRead()
  }

  async function handleEnablePush() {
    setPushToggling(true)
    try {
      const registration = await registerServiceWorker()
      if (!registration) { setPushToggling(false); return }
      const subscription = await subscribeToPush(registration)
      if (!subscription) { setPushToggling(false); return }
      const result = await savePushSubscription(subscription)
      if (!result.error) setPushSubscribed(true)
    } catch {}
    setPushToggling(false)
  }

  async function handleDisablePush() {
    setPushToggling(true)
    try {
      const endpoint = await unsubscribeFromPush()
      if (endpoint) await deletePushSubscription(endpoint)
      setPushSubscribed(false)
    } catch {}
    setPushToggling(false)
  }

  function formatTime(dateStr: string) {
    const d = new Date(dateStr)
    const now = new Date()
    const diffMs = now.getTime() - d.getTime()
    const diffMin = Math.floor(diffMs / 60000)

    if (diffMin < 1) return 'Zojuist'
    if (diffMin < 60) return `${diffMin}m geleden`
    const diffHours = Math.floor(diffMin / 60)
    if (diffHours < 24) return `${diffHours}u geleden`
    const diffDays = Math.floor(diffHours / 24)
    if (diffDays < 7) return `${diffDays}d geleden`
    return d.toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' })
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-destructive text-destructive-foreground text-[10px] flex items-center justify-center font-medium">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <h3 className="font-semibold text-sm">Meldingen</h3>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="text-xs h-7"
              onClick={handleMarkAllRead}
            >
              <CheckCheck className="h-3.5 w-3.5 mr-1" />
              Alles gelezen
            </Button>
          )}
        </div>
        <div className="max-h-64 overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="py-8 text-center text-sm text-muted-foreground">
              Geen meldingen
            </div>
          ) : (
            notifications.map((notification) => (
              <div
                key={notification.id}
                className={`px-4 py-3 border-b last:border-0 ${
                  !notification.read ? 'bg-primary/5' : ''
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm ${!notification.read ? 'font-medium' : ''}`}>
                      {notification.title}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                      {notification.message}
                    </p>
                    <p className="text-[10px] text-muted-foreground mt-1">
                      {formatTime(notification.created_at)}
                    </p>
                  </div>
                  {!notification.read && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 shrink-0"
                      onClick={() => handleMarkRead(notification.id)}
                    >
                      <Check className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Push notification toggle */}
        {pushSupported && !pushLoading && (
          <div className="px-4 py-3 border-t bg-muted/30">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm">
                {pushSubscribed ? (
                  <Bell className="h-3.5 w-3.5 text-green-600" />
                ) : (
                  <BellOff className="h-3.5 w-3.5 text-muted-foreground" />
                )}
                <span className="text-muted-foreground">
                  Push meldingen
                </span>
              </div>
              <Button
                variant={pushSubscribed ? 'outline' : 'default'}
                size="sm"
                className="h-7 text-xs"
                onClick={pushSubscribed ? handleDisablePush : handleEnablePush}
                disabled={pushToggling}
              >
                {pushToggling ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : pushSubscribed ? (
                  'Uitschakelen'
                ) : (
                  'Inschakelen'
                )}
              </Button>
            </div>
          </div>
        )}
      </PopoverContent>
    </Popover>
  )
}

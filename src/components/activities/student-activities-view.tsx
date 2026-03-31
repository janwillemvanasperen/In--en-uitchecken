'use client'

import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { MapPin, Clock, Users, CheckCircle, Loader2 } from 'lucide-react'
import type { Activity } from '@/components/calendar/types'

interface Props {
  activities: Activity[]
  onSignUp: (activityId: string) => Promise<{ error?: string }>
  onCancel: (activityId: string) => Promise<{ error?: string }>
}

const DUTCH_DAY_NAMES = ['zondag', 'maandag', 'dinsdag', 'woensdag', 'donderdag', 'vrijdag', 'zaterdag']
const DUTCH_MONTHS = [
  'januari', 'februari', 'maart', 'april', 'mei', 'juni',
  'juli', 'augustus', 'september', 'oktober', 'november', 'december',
]

function formatDate(dateStr: string): string {
  const [year, month, day] = dateStr.split('-').map(Number)
  const d = new Date(year, month - 1, day)
  return `${DUTCH_DAY_NAMES[d.getDay()]} ${day} ${DUTCH_MONTHS[month - 1]}`
}

function formatTime(t: string | null): string | null {
  return t ? t.slice(0, 5) : null
}

function formatDeadline(iso: string | null): string | null {
  if (!iso) return null
  const d = new Date(iso)
  const now = new Date()
  if (d < now) return null  // past deadline — show nothing (button will be disabled)
  return `Inschrijven t/m ${d.getDate()} ${DUTCH_MONTHS[d.getMonth()]} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

function isPastDeadline(iso: string | null): boolean {
  if (!iso) return false
  return new Date(iso) < new Date()
}

export function StudentActivitiesView({ activities, onSignUp, onCancel }: Props) {
  const [pendingId, setPendingId] = useState<string | null>(null)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isPending, startTransition] = useTransition()

  const today = new Date().toISOString().split('T')[0]
  const upcoming = activities.filter((a) => a.activity_date >= today)
  const past = activities.filter((a) => a.activity_date < today && a.is_signed_up)

  function handleSignUp(activityId: string) {
    setPendingId(activityId)
    setErrors((prev) => { const n = { ...prev }; delete n[activityId]; return n })
    startTransition(async () => {
      const result = await onSignUp(activityId)
      if (result.error) setErrors((prev) => ({ ...prev, [activityId]: result.error! }))
      setPendingId(null)
    })
  }

  function handleCancel(activityId: string) {
    setPendingId(activityId)
    setErrors((prev) => { const n = { ...prev }; delete n[activityId]; return n })
    startTransition(async () => {
      const result = await onCancel(activityId)
      if (result.error) setErrors((prev) => ({ ...prev, [activityId]: result.error! }))
      setPendingId(null)
    })
  }

  function renderCard(activity: Activity) {
    const spotsLeft = activity.max_participants != null
      ? activity.max_participants - (activity.signup_count ?? 0)
      : null
    const isFull = spotsLeft != null && spotsLeft <= 0
    const deadlinePassed = isPastDeadline(activity.signup_deadline)
    const deadline = formatDeadline(activity.signup_deadline)
    const startTime = formatTime(activity.start_time)
    const endTime = formatTime(activity.end_time)
    const isLoading = pendingId === activity.id && isPending
    const canSignUp = !isFull && !deadlinePassed && activity.status === 'active'

    return (
      <div key={activity.id} className="rounded-lg border bg-card p-4 space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div className="space-y-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="font-semibold text-sm">{activity.title}</p>
              {activity.is_signed_up && (
                <Badge variant="outline" className="text-xs text-green-700 border-green-400 flex items-center gap-1">
                  <CheckCircle className="h-3 w-3" />
                  Ingeschreven
                </Badge>
              )}
              {isFull && !activity.is_signed_up && (
                <Badge variant="secondary" className="text-xs">Vol</Badge>
              )}
            </div>

            <div className="flex items-center gap-3 flex-wrap text-xs text-muted-foreground">
              <span className="font-medium text-foreground">{formatDate(activity.activity_date)}</span>
              {startTime && (
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {endTime ? `${startTime} – ${endTime}` : startTime}
                </span>
              )}
              {activity.location && (
                <span className="flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  {activity.location}
                </span>
              )}
              {spotsLeft != null && spotsLeft > 0 && (
                <span className="flex items-center gap-1">
                  <Users className="h-3 w-3" />
                  Nog {spotsLeft} {spotsLeft === 1 ? 'plek' : 'plekken'}
                </span>
              )}
              {spotsLeft != null && spotsLeft <= 0 && !activity.is_signed_up && (
                <span className="flex items-center gap-1 text-orange-600">
                  <Users className="h-3 w-3" />
                  Helaas vol
                </span>
              )}
            </div>

            {activity.description && (
              <p className="text-xs text-muted-foreground">{activity.description}</p>
            )}

            {deadline && (
              <p className="text-xs text-muted-foreground">{deadline}</p>
            )}
          </div>

          <div className="shrink-0">
            {activity.is_signed_up ? (
              <Button
                size="sm"
                variant="outline"
                className="text-xs h-7 px-3 text-destructive border-destructive/50 hover:text-destructive"
                onClick={() => handleCancel(activity.id)}
                disabled={isLoading}
              >
                {isLoading
                  ? <Loader2 className="h-3 w-3 animate-spin" />
                  : 'Uitschrijven'
                }
              </Button>
            ) : canSignUp ? (
              <Button
                size="sm"
                className="text-xs h-7 px-3 bg-[#ffd100] text-black hover:bg-[#ffd100]/90"
                onClick={() => handleSignUp(activity.id)}
                disabled={isLoading}
              >
                {isLoading
                  ? <Loader2 className="h-3 w-3 animate-spin" />
                  : 'Inschrijven'
                }
              </Button>
            ) : null}
          </div>
        </div>

        {errors[activity.id] && (
          <p className="text-xs text-destructive">{errors[activity.id]}</p>
        )}
      </div>
    )
  }

  if (upcoming.length === 0 && past.length === 0) {
    return (
      <p className="text-sm text-muted-foreground text-center py-12">
        Er zijn momenteel geen activiteiten beschikbaar.
      </p>
    )
  }

  return (
    <div className="space-y-6">
      {upcoming.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
            Aankomend
          </h2>
          {upcoming.map(renderCard)}
        </div>
      )}
      {past.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
            Eerder ingeschreven
          </h2>
          {past.map(renderCard)}
        </div>
      )}
    </div>
  )
}

'use client'

import { useState, useTransition } from 'react'
import { ActivityFormDialog } from './activity-form'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ChevronDown, ChevronUp, MapPin, Clock, Users, CalendarX, Trash2, Loader2 } from 'lucide-react'
import type { CreateActivityData } from '@/app/coach/activities/actions'

interface Signup {
  student_id: string
  full_name: string
  signed_up_at: string
}

interface ActivityWithSignups {
  id: string
  title: string
  description: string | null
  activity_date: string
  start_time: string | null
  end_time: string | null
  location: string | null
  max_participants: number | null
  signup_deadline: string | null
  status: string
  signup_count: number
  signups: Signup[]
}

interface Props {
  activities: ActivityWithSignups[]
  onCreateActivity: (data: CreateActivityData) => Promise<{ error?: string }>
  onDeleteActivity: (id: string) => Promise<{ error?: string }>
  onCancelActivity: (id: string) => Promise<{ error?: string }>
}

const DUTCH_MONTHS_SHORT = [
  'jan', 'feb', 'mrt', 'apr', 'mei', 'jun',
  'jul', 'aug', 'sep', 'okt', 'nov', 'dec',
]

function formatDate(dateStr: string): string {
  const [, month, day] = dateStr.split('-').map(Number)
  return `${day} ${DUTCH_MONTHS_SHORT[month - 1]}`
}

function formatTime(t: string | null): string | null {
  return t ? t.slice(0, 5) : null
}

function formatDeadline(iso: string | null): string | null {
  if (!iso) return null
  const d = new Date(iso)
  return `${d.getDate()} ${DUTCH_MONTHS_SHORT[d.getMonth()]} ${d.getFullYear()} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

function isSpotsLeft(activity: ActivityWithSignups): boolean {
  if (activity.max_participants == null) return true
  return activity.signup_count < activity.max_participants
}

export function CoachActivitiesView({ activities, onCreateActivity, onDeleteActivity, onCancelActivity }: Props) {
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [pendingId, setPendingId] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleDelete(id: string) {
    setPendingId(id + ':delete')
    startTransition(async () => {
      await onDeleteActivity(id)
      setPendingId(null)
    })
  }

  function handleCancel(id: string) {
    setPendingId(id + ':cancel')
    startTransition(async () => {
      await onCancelActivity(id)
      setPendingId(null)
    })
  }

  const upcoming = activities.filter((a) => a.activity_date >= new Date().toISOString().split('T')[0])
  const past = activities.filter((a) => a.activity_date < new Date().toISOString().split('T')[0])

  function renderList(list: ActivityWithSignups[], isPastSection = false) {
    if (list.length === 0) {
      return <p className="text-sm text-muted-foreground py-4 text-center">Geen activiteiten</p>
    }
    return list.map((activity) => {
      const isExpanded = expandedId === activity.id
      const spotsLeft = activity.max_participants != null
        ? activity.max_participants - activity.signup_count
        : null
      const startTime = formatTime(activity.start_time)
      const endTime = formatTime(activity.end_time)
      const deadline = formatDeadline(activity.signup_deadline)

      return (
        <div key={activity.id} className="rounded-lg border bg-card">
          <div className="p-4">
            <div className="flex items-start justify-between gap-2">
              <div className="space-y-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-semibold text-sm">{activity.title}</p>
                  {activity.status === 'cancelled' && (
                    <Badge variant="destructive" className="text-xs">Geannuleerd</Badge>
                  )}
                  {spotsLeft != null && spotsLeft <= 3 && spotsLeft > 0 && (
                    <Badge variant="outline" className="text-xs text-orange-600 border-orange-400">
                      Nog {spotsLeft} {spotsLeft === 1 ? 'plek' : 'plekken'}
                    </Badge>
                  )}
                  {spotsLeft === 0 && (
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
                  <span className="flex items-center gap-1">
                    <Users className="h-3 w-3" />
                    {activity.signup_count}
                    {activity.max_participants != null && ` / ${activity.max_participants}`} ingeschreven
                  </span>
                </div>

                {activity.description && (
                  <p className="text-xs text-muted-foreground">{activity.description}</p>
                )}

                {deadline && (
                  <p className="text-xs text-muted-foreground">Deadline: {deadline}</p>
                )}
              </div>

              <div className="flex items-center gap-1 shrink-0">
                {!isPastSection && activity.status === 'active' && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-muted-foreground hover:text-orange-600"
                    title="Annuleer activiteit"
                    disabled={pendingId === activity.id + ':cancel' && isPending}
                    onClick={() => handleCancel(activity.id)}
                  >
                    {pendingId === activity.id + ':cancel' && isPending
                      ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      : <CalendarX className="h-3.5 w-3.5" />
                    }
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-muted-foreground hover:text-destructive"
                  title="Verwijder activiteit"
                  disabled={pendingId === activity.id + ':delete' && isPending}
                  onClick={() => handleDelete(activity.id)}
                >
                  {pendingId === activity.id + ':delete' && isPending
                    ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    : <Trash2 className="h-3.5 w-3.5" />
                  }
                </Button>
                {activity.signups.length > 0 && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => setExpandedId(isExpanded ? null : activity.id)}
                  >
                    {isExpanded
                      ? <ChevronUp className="h-4 w-4" />
                      : <ChevronDown className="h-4 w-4" />
                    }
                  </Button>
                )}
              </div>
            </div>
          </div>

          {isExpanded && activity.signups.length > 0 && (
            <div className="border-t px-4 pb-3 pt-2 space-y-1">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
                Inschrijvingen ({activity.signups.length})
              </p>
              {activity.signups.map((signup) => (
                <div key={signup.student_id} className="flex items-center justify-between text-sm">
                  <span>{signup.full_name}</span>
                  <span className="text-xs text-muted-foreground">
                    {new Date(signup.signed_up_at).toLocaleDateString('nl-NL')}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <ActivityFormDialog onSubmit={onCreateActivity} />
      </div>

      <div className="space-y-3">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
          Aankomend
        </h2>
        {renderList(upcoming)}
      </div>

      {past.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
            Verleden
          </h2>
          {renderList(past, true)}
        </div>
      )}
    </div>
  )
}

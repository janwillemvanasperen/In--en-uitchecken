'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Loader2, Check, X, ChevronDown, ChevronUp, MessageSquare } from 'lucide-react'
import { approveSchedule, rejectSchedule } from '@/app/admin/actions'
import type { Coach } from '@/types'

type ScheduleRow = {
  id: string
  user_id: string
  day_of_week: number
  start_time: string
  end_time: string
  status: string
  valid_from: string
  valid_until: string
  submission_group: string | null
  admin_note: string | null
  users: { full_name: string } | null
}

type ScheduleGroup = {
  submissionGroup: string
  userId: string
  userName: string
  status: string
  validFrom: string
  validUntil: string
  entries: ScheduleRow[]
  totalHours: number
  adminNote: string | null
}

const DAY_NAMES: Record<number, string> = {
  1: 'Maandag',
  2: 'Dinsdag',
  3: 'Woensdag',
  4: 'Donderdag',
  5: 'Vrijdag',
  6: 'Zaterdag',
  7: 'Zondag',
}

const STATUS_BADGES: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' }> = {
  pending: { label: 'In afwachting', variant: 'secondary' },
  approved: { label: 'Goedgekeurd', variant: 'default' },
  rejected: { label: 'Afgewezen', variant: 'destructive' },
}

function groupSchedules(schedules: ScheduleRow[]): ScheduleGroup[] {
  const groups = new Map<string, ScheduleGroup>()

  for (const s of schedules) {
    const key = s.submission_group || s.id
    if (!groups.has(key)) {
      groups.set(key, {
        submissionGroup: key,
        userId: s.user_id,
        userName: (s.users as any)?.full_name || 'Onbekend',
        status: s.status,
        validFrom: s.valid_from,
        validUntil: s.valid_until,
        entries: [],
        totalHours: 0,
        adminNote: s.admin_note || null,
      })
    }
    const group = groups.get(key)!
    group.entries.push(s)
  }

  // Calculate total hours per group
  const allGroups = Array.from(groups.values())
  for (const group of allGroups) {
    group.entries.sort((a, b) => a.day_of_week - b.day_of_week)
    group.totalHours = group.entries.reduce((sum, entry) => {
      const [sh, sm] = entry.start_time.split(':').map(Number)
      const [eh, em] = entry.end_time.split(':').map(Number)
      return sum + (eh + em / 60) - (sh + sm / 60)
    }, 0)
  }

  return allGroups.sort(
    (a, b) => new Date(b.validFrom).getTime() - new Date(a.validFrom).getTime()
  )
}

function ScheduleGroupCard({ group }: { group: ScheduleGroup }) {
  const [expanded, setExpanded] = useState(group.status === 'pending')
  const [showNote, setShowNote] = useState(false)
  const [note, setNote] = useState('')
  const [pendingAction, setPendingAction] = useState<'approve' | 'reject' | null>(null)
  const [loadingAction, setLoadingAction] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const badge = STATUS_BADGES[group.status] || STATUS_BADGES.pending

  const handleAction = (action: 'approve' | 'reject') => {
    setPendingAction(action)
    setShowNote(true)
  }

  const handleConfirm = async () => {
    setLoadingAction(pendingAction)
    setError(null)
    const result = pendingAction === 'approve'
      ? await approveSchedule(group.submissionGroup, note || undefined)
      : await rejectSchedule(group.submissionGroup, note || undefined)
    if (result.error) setError(result.error)
    setLoadingAction(null)
    setShowNote(false)
    setNote('')
    setPendingAction(null)
  }

  const handleCancel = () => {
    setShowNote(false)
    setNote('')
    setPendingAction(null)
  }

  return (
    <Card>
      <CardHeader
        className="cursor-pointer pb-3"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base">{group.userName}</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              {new Date(group.validFrom).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' })}
              {' - '}
              {new Date(group.validUntil).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short', year: 'numeric' })}
              {' · '}
              {group.totalHours.toFixed(1)} uur/week
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={badge.variant}>{badge.label}</Badge>
            {expanded ? (
              <ChevronUp className="h-4 w-4 text-muted-foreground" />
            ) : (
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            )}
          </div>
        </div>
      </CardHeader>

      {expanded && (
        <CardContent className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="border rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted">
                <tr>
                  <th className="text-left px-4 py-2 font-medium">Dag</th>
                  <th className="text-left px-4 py-2 font-medium">Start</th>
                  <th className="text-left px-4 py-2 font-medium">Eind</th>
                  <th className="text-right px-4 py-2 font-medium">Uren</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {group.entries.map((entry) => {
                  const [sh, sm] = entry.start_time.split(':').map(Number)
                  const [eh, em] = entry.end_time.split(':').map(Number)
                  const hours = (eh + em / 60) - (sh + sm / 60)
                  return (
                    <tr key={entry.id}>
                      <td className="px-4 py-2">{DAY_NAMES[entry.day_of_week]}</td>
                      <td className="px-4 py-2">{entry.start_time.slice(0, 5)}</td>
                      <td className="px-4 py-2">{entry.end_time.slice(0, 5)}</td>
                      <td className="px-4 py-2 text-right">{hours.toFixed(1)}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {group.adminNote && group.status !== 'pending' && (
            <p className="text-sm text-muted-foreground flex items-center gap-1">
              <MessageSquare className="h-3 w-3 shrink-0" />
              {group.adminNote}
            </p>
          )}

          {group.status === 'pending' && !showNote && (
            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={() => handleAction('approve')}
                disabled={!!loadingAction}
              >
                <Check className="mr-2 h-4 w-4" />
                Goedkeuren
              </Button>
              <Button
                size="sm"
                variant="destructive"
                onClick={() => handleAction('reject')}
                disabled={!!loadingAction}
              >
                <X className="mr-2 h-4 w-4" />
                Afwijzen
              </Button>
            </div>
          )}

          {showNote && (
            <div className="space-y-2">
              <Textarea
                placeholder="Reactie (optioneel)..."
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={2}
              />
              <div className="flex gap-2 justify-end">
                <Button size="sm" variant="ghost" onClick={handleCancel} disabled={!!loadingAction}>
                  Annuleren
                </Button>
                <Button
                  size="sm"
                  variant={pendingAction === 'reject' ? 'destructive' : 'default'}
                  onClick={handleConfirm}
                  disabled={!!loadingAction}
                >
                  {loadingAction && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {pendingAction === 'approve' ? 'Goedkeuren' : 'Afwijzen'}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      )}
    </Card>
  )
}

export function ScheduleReviewList({
  schedules,
  coaches = [],
  userCoachMap = {},
}: {
  schedules: ScheduleRow[]
  coaches?: Coach[]
  userCoachMap?: Record<string, string | null>
}) {
  const [coachFilter, setCoachFilter] = useState('__all__')

  const allGroups = groupSchedules(schedules)

  const filteredGroups = allGroups.filter((g) => {
    if (coachFilter === '__all__') return true
    if (coachFilter === '__none__') return !userCoachMap[g.userId]
    return userCoachMap[g.userId] === coachFilter
  })

  const pending = filteredGroups.filter((g) => g.status === 'pending')
  const approved = filteredGroups.filter((g) => g.status === 'approved')
  const rejected = filteredGroups.filter((g) => g.status === 'rejected')

  const renderGroups = (items: ScheduleGroup[]) => {
    if (items.length === 0) {
      return (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            Geen roosters gevonden.
          </CardContent>
        </Card>
      )
    }

    return (
      <div className="space-y-4">
        {items.map((group) => (
          <ScheduleGroupCard key={group.submissionGroup} group={group} />
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {coaches.length > 0 && (
        <Select value={coachFilter} onValueChange={setCoachFilter}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Filter op coach" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">Alle coaches</SelectItem>
            <SelectItem value="__none__">Geen coach</SelectItem>
            {coaches.map((c) => (
              <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
      <Tabs defaultValue="pending">
        <TabsList>
          <TabsTrigger value="pending">
            In afwachting ({pending.length})
          </TabsTrigger>
          <TabsTrigger value="approved">
            Goedgekeurd ({approved.length})
          </TabsTrigger>
          <TabsTrigger value="rejected">
            Afgewezen ({rejected.length})
          </TabsTrigger>
        </TabsList>
        <TabsContent value="pending">{renderGroups(pending)}</TabsContent>
        <TabsContent value="approved">{renderGroups(approved)}</TabsContent>
        <TabsContent value="rejected">{renderGroups(rejected)}</TabsContent>
      </Tabs>
    </div>
  )
}

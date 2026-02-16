'use client'

import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Loader2, Check, X, MessageSquare, Clock } from 'lucide-react'
import { approveLeaveRequest, rejectLeaveRequest } from '@/app/admin/actions'
import type { Coach } from '@/types'

type LeaveWithUser = {
  id: string
  user_id: string
  date: string
  reason: string
  description: string | null
  status: string
  admin_note: string | null
  start_time: string | null
  end_time: string | null
  created_at: string
  users: { full_name: string } | null
}

const REASON_LABELS: Record<string, string> = {
  sick: 'Ziek',
  late: 'Te laat',
  appointment: 'Afspraak',
}

const STATUS_BADGES: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' }> = {
  pending: { label: 'In afwachting', variant: 'secondary' },
  approved: { label: 'Goedgekeurd', variant: 'default' },
  rejected: { label: 'Afgewezen', variant: 'destructive' },
}

function LeaveRequestRow({ lr, isPending }: { lr: LeaveWithUser; isPending: boolean }) {
  const [showNote, setShowNote] = useState(false)
  const [note, setNote] = useState('')
  const [pendingAction, setPendingAction] = useState<'approve' | 'reject' | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const badge = STATUS_BADGES[lr.status] || STATUS_BADGES.pending

  const handleAction = (action: 'approve' | 'reject') => {
    setPendingAction(action)
    setShowNote(true)
  }

  const handleConfirm = async () => {
    setIsLoading(true)
    setError(null)
    const result = pendingAction === 'approve'
      ? await approveLeaveRequest(lr.id, note || undefined)
      : await rejectLeaveRequest(lr.id, note || undefined)
    if (result.error) setError(result.error)
    setIsLoading(false)
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
    <>
      <tr>
        <td className="px-4 py-3 font-medium">
          {(lr.users as any)?.full_name || 'Onbekend'}
        </td>
        <td className="px-4 py-3">
          <div>
            {new Date(lr.date).toLocaleDateString('nl-NL', {
              day: 'numeric',
              month: 'long',
              year: 'numeric',
            })}
          </div>
          {lr.start_time && lr.end_time && (
            <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
              <Clock className="h-3 w-3" />
              {lr.start_time.slice(0, 5)} - {lr.end_time.slice(0, 5)}
            </p>
          )}
        </td>
        <td className="px-4 py-3 hidden sm:table-cell">
          {REASON_LABELS[lr.reason] || lr.reason}
        </td>
        <td className="px-4 py-3 hidden md:table-cell text-muted-foreground max-w-xs truncate">
          {lr.description || '-'}
        </td>
        <td className="px-4 py-3">
          <Badge variant={badge.variant}>{badge.label}</Badge>
        </td>
        {isPending && (
          <td className="px-4 py-3 text-right">
            <div className="flex justify-end gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleAction('approve')}
                disabled={isLoading}
              >
                <Check className="h-4 w-4 text-green-600" />
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleAction('reject')}
                disabled={isLoading}
              >
                <X className="h-4 w-4 text-destructive" />
              </Button>
            </div>
          </td>
        )}
      </tr>
      {showNote && (
        <tr>
          <td colSpan={isPending ? 6 : 5} className="px-4 py-3 bg-muted/50">
            {error && (
              <Alert variant="destructive" className="mb-2">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <div className="space-y-2">
              <Textarea
                placeholder="Reactie (optioneel)..."
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={2}
                className="bg-background"
              />
              <div className="flex gap-2 justify-end">
                <Button size="sm" variant="ghost" onClick={handleCancel} disabled={isLoading}>
                  Annuleren
                </Button>
                <Button
                  size="sm"
                  variant={pendingAction === 'reject' ? 'destructive' : 'default'}
                  onClick={handleConfirm}
                  disabled={isLoading}
                >
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {pendingAction === 'approve' ? 'Goedkeuren' : 'Afwijzen'}
                </Button>
              </div>
            </div>
          </td>
        </tr>
      )}
      {lr.admin_note && !isPending && (
        <tr>
          <td colSpan={5} className="px-4 pb-3 pt-0">
            <p className="text-sm text-muted-foreground flex items-center gap-1">
              <MessageSquare className="h-3 w-3" />
              {lr.admin_note}
            </p>
          </td>
        </tr>
      )}
    </>
  )
}

export function LeaveRequestList({
  leaveRequests,
  coaches = [],
  userCoachMap = {},
}: {
  leaveRequests: LeaveWithUser[]
  coaches?: Coach[]
  userCoachMap?: Record<string, string | null>
}) {
  const [coachFilter, setCoachFilter] = useState('__all__')

  const filtered = leaveRequests.filter((lr) => {
    if (coachFilter === '__all__') return true
    if (coachFilter === '__none__') return !userCoachMap[lr.user_id]
    return userCoachMap[lr.user_id] === coachFilter
  })

  const pending = filtered.filter((lr) => lr.status === 'pending')
  const approved = filtered.filter((lr) => lr.status === 'approved')
  const rejected = filtered.filter((lr) => lr.status === 'rejected')

  const renderTable = (items: LeaveWithUser[]) => {
    if (items.length === 0) {
      return (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            Geen verlofaanvragen gevonden.
          </CardContent>
        </Card>
      )
    }

    const isPending = items[0]?.status === 'pending'

    return (
      <div className="border rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted">
            <tr>
              <th className="text-left px-4 py-3 font-medium">Student</th>
              <th className="text-left px-4 py-3 font-medium">Datum</th>
              <th className="text-left px-4 py-3 font-medium hidden sm:table-cell">Reden</th>
              <th className="text-left px-4 py-3 font-medium hidden md:table-cell">Beschrijving</th>
              <th className="text-left px-4 py-3 font-medium">Status</th>
              {isPending && (
                <th className="text-right px-4 py-3 font-medium">Acties</th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y">
            {items.map((lr) => (
              <LeaveRequestRow key={lr.id} lr={lr} isPending={isPending} />
            ))}
          </tbody>
        </table>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {coaches.length > 0 && (
        <div className="flex gap-3 items-center">
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
        </div>
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
      <TabsContent value="pending">{renderTable(pending)}</TabsContent>
      <TabsContent value="approved">{renderTable(approved)}</TabsContent>
      <TabsContent value="rejected">{renderTable(rejected)}</TabsContent>
    </Tabs>
    </div>
  )
}

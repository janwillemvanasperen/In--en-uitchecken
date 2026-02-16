'use client'

import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Loader2, Check, X } from 'lucide-react'
import { approveLeaveRequest, rejectLeaveRequest } from '@/app/admin/actions'

type LeaveWithUser = {
  id: string
  user_id: string
  date: string
  reason: string
  description: string | null
  status: string
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

export function LeaveRequestList({ leaveRequests }: { leaveRequests: LeaveWithUser[] }) {
  const [loadingId, setLoadingId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleApprove = async (id: string) => {
    setLoadingId(id)
    setError(null)
    const result = await approveLeaveRequest(id)
    if (result.error) setError(result.error)
    setLoadingId(null)
  }

  const handleReject = async (id: string) => {
    setLoadingId(id)
    setError(null)
    const result = await rejectLeaveRequest(id)
    if (result.error) setError(result.error)
    setLoadingId(null)
  }

  const pending = leaveRequests.filter((lr) => lr.status === 'pending')
  const approved = leaveRequests.filter((lr) => lr.status === 'approved')
  const rejected = leaveRequests.filter((lr) => lr.status === 'rejected')

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
              {items[0]?.status === 'pending' && (
                <th className="text-right px-4 py-3 font-medium">Acties</th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y">
            {items.map((lr) => {
              const badge = STATUS_BADGES[lr.status] || STATUS_BADGES.pending
              return (
                <tr key={lr.id}>
                  <td className="px-4 py-3 font-medium">
                    {(lr.users as any)?.full_name || 'Onbekend'}
                  </td>
                  <td className="px-4 py-3">
                    {new Date(lr.date).toLocaleDateString('nl-NL', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })}
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
                  {lr.status === 'pending' && (
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleApprove(lr.id)}
                          disabled={loadingId === lr.id}
                        >
                          {loadingId === lr.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Check className="h-4 w-4 text-green-600" />
                          )}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleReject(lr.id)}
                          disabled={loadingId === lr.id}
                        >
                          <X className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </td>
                  )}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
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

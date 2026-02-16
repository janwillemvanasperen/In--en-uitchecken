import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { formatDate } from '@/lib/date-utils'
import { Calendar, Clock, FileText, MessageSquare } from 'lucide-react'
import type { LeaveRequest, LeaveReason, LeaveStatus } from '@/types'

interface LeaveRequestsListProps {
  requests: LeaveRequest[]
}

const REASON_LABELS: Record<LeaveReason, string> = {
  sick: '🤒 Ziek',
  late: '⏰ Te laat',
  appointment: '📅 Afspraak',
}

const STATUS_CONFIG: Record<
  LeaveStatus,
  { variant: 'default' | 'destructive' | 'secondary'; label: string }
> = {
  pending: { variant: 'secondary', label: 'In afwachting' },
  approved: { variant: 'default', label: 'Goedgekeurd' },
  rejected: { variant: 'destructive', label: 'Afgewezen' },
}

export function LeaveRequestsList({ requests }: LeaveRequestsListProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Mijn aanvragen</CardTitle>
        <CardDescription>
          Overzicht van je verlofaanvragen
        </CardDescription>
      </CardHeader>
      <CardContent>
        {requests.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            Nog geen verlofaanvragen
          </p>
        ) : (
          <div className="space-y-3">
            {requests.map((request) => {
              const statusConfig = STATUS_CONFIG[request.status]

              return (
                <div
                  key={request.id}
                  className="border rounded-lg p-3 space-y-2 hover:bg-accent/50 transition-colors"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">
                        {formatDate(request.date)}
                      </span>
                      {request.start_time && request.end_time && (
                        <span className="text-sm text-muted-foreground flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {request.start_time.slice(0, 5)} - {request.end_time.slice(0, 5)}
                        </span>
                      )}
                    </div>
                    <Badge variant={statusConfig.variant}>
                      {statusConfig.label}
                    </Badge>
                  </div>

                  <div className="flex items-center gap-2 text-sm">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <span>{REASON_LABELS[request.reason]}</span>
                  </div>

                  {request.description && (
                    <p className="text-sm text-muted-foreground pl-6">
                      {request.description.length > 100
                        ? `${request.description.slice(0, 100)}...`
                        : request.description}
                    </p>
                  )}

                  {request.admin_note && (
                    <p className="text-sm text-muted-foreground pl-6 flex items-center gap-1">
                      <MessageSquare className="h-3 w-3 shrink-0" />
                      <span className="italic">{request.admin_note}</span>
                    </p>
                  )}

                  {request.reviewed_at && (
                    <p className="text-xs text-muted-foreground pl-6">
                      Beoordeeld op {formatDate(request.reviewed_at)}
                    </p>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

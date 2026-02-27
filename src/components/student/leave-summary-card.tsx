import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { FileText } from 'lucide-react'
import Link from 'next/link'

interface LeaveSummaryCardProps {
  pendingCount: number
  approvedCount: number
  rejectedCount: number
}

export function LeaveSummaryCard({ pendingCount, approvedCount, rejectedCount }: LeaveSummaryCardProps) {
  const total = pendingCount + approvedCount + rejectedCount

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <FileText className="h-4 w-4 text-primary" />
          Verlof
        </CardTitle>
      </CardHeader>
      <CardContent>
        {total === 0 ? (
          <p className="text-sm text-muted-foreground">Geen verlofaanvragen</p>
        ) : (
          <div className="space-y-2">
            {pendingCount > 0 && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">In behandeling</span>
                <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                  {pendingCount}
                </Badge>
              </div>
            )}
            {approvedCount > 0 && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Goedgekeurd</span>
                <Badge variant="secondary" className="bg-green-100 text-green-800">
                  {approvedCount}
                </Badge>
              </div>
            )}
            {rejectedCount > 0 && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Afgewezen</span>
                <Badge variant="secondary" className="bg-red-100 text-red-800">
                  {rejectedCount}
                </Badge>
              </div>
            )}
          </div>
        )}
        <div className="mt-3 pt-3 border-t">
          <Link href="/student/leave-requests">
            <Button variant="outline" size="sm" className="w-full">
              Verlof aanvragen
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  )
}

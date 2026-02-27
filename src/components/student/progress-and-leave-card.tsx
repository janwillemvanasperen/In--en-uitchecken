import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { TrendingUp } from 'lucide-react'
import Link from 'next/link'

interface ProgressAndLeaveCardProps {
  weeklyHours: number
  targetHours: number
  pendingCount: number
  approvedCount: number
  rejectedCount: number
}

export function ProgressAndLeaveCard({
  weeklyHours,
  targetHours,
  pendingCount,
  approvedCount,
  rejectedCount,
}: ProgressAndLeaveCardProps) {
  const percentage = Math.min((weeklyHours / targetHours) * 100, 100)

  let progressColor = 'bg-red-500'
  if (percentage >= 80) progressColor = 'bg-green-500'
  else if (percentage >= 50) progressColor = 'bg-yellow-500'

  let textColor = 'text-red-600'
  if (percentage >= 80) textColor = 'text-green-600'
  else if (percentage >= 50) textColor = 'text-yellow-600'

  const leaveTotal = pendingCount + approvedCount + rejectedCount

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-primary" />
          Weekvoortgang & Verlof
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        {/* Weekly progress */}
        <div className="space-y-2">
          <div className="flex items-baseline gap-2">
            <span className={`text-2xl font-bold ${textColor}`}>
              {weeklyHours.toFixed(1)}
            </span>
            <span className="text-sm text-muted-foreground">van {targetHours.toFixed(0)} uur</span>
          </div>

          <Progress
            value={percentage}
            className="h-2.5"
            indicatorClassName={progressColor}
          />

          <p className="text-xs text-muted-foreground">
            {percentage >= 100 ? (
              <span className="text-green-600 font-medium">
                Doel bereikt! Je hebt deze week voldoende uren gemaakt.
              </span>
            ) : percentage >= 80 ? (
              <span className="text-green-600 font-medium">
                Bijna daar! Nog {(targetHours - weeklyHours).toFixed(1)} uur te gaan.
              </span>
            ) : percentage >= 50 ? (
              <span className="text-yellow-600 font-medium">
                Op schema. Nog {(targetHours - weeklyHours).toFixed(1)} uur te gaan.
              </span>
            ) : (
              <span className="text-red-600 font-medium">
                Nog {(targetHours - weeklyHours).toFixed(1)} uur te gaan om je doel te halen.
              </span>
            )}
          </p>
        </div>

        {/* Divider */}
        <div className="border-t" />

        {/* Leave summary */}
        <div className="space-y-2">
          <p className="text-sm font-medium">Verlofaanvragen</p>
          {leaveTotal === 0 ? (
            <p className="text-sm text-muted-foreground">Geen verlofaanvragen</p>
          ) : (
            <div className="space-y-1.5">
              {pendingCount > 0 && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">In behandeling</span>
                  <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 text-xs">
                    {pendingCount}
                  </Badge>
                </div>
              )}
              {approvedCount > 0 && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Goedgekeurd</span>
                  <Badge variant="secondary" className="bg-green-100 text-green-800 text-xs">
                    {approvedCount}
                  </Badge>
                </div>
              )}
              {rejectedCount > 0 && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Afgewezen</span>
                  <Badge variant="secondary" className="bg-red-100 text-red-800 text-xs">
                    {rejectedCount}
                  </Badge>
                </div>
              )}
            </div>
          )}
          <Link href="/student/leave-requests">
            <Button variant="outline" size="sm" className="w-full mt-2">
              Verlof aanvragen
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  )
}

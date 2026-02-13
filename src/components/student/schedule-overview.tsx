'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { CalendarDays, AlertTriangle } from 'lucide-react'
import type { Schedule } from '@/types'

const DAY_NAMES: Record<number, string> = {
  1: 'Maandag',
  2: 'Dinsdag',
  3: 'Woensdag',
  4: 'Donderdag',
  5: 'Vrijdag',
  6: 'Zaterdag',
  7: 'Zondag',
}

const STATUS_CONFIG: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' }> = {
  approved: { label: 'Goedgekeurd', variant: 'default' },
  pending: { label: 'In afwachting', variant: 'secondary' },
  rejected: { label: 'Afgewezen', variant: 'destructive' },
}

interface ScheduleOverviewProps {
  currentSchedule: Schedule[] | null
  pendingSchedule: Schedule[] | null
}

function calculateHours(start: string, end: string): number {
  const [sh, sm] = start.split(':').map(Number)
  const [eh, em] = end.split(':').map(Number)
  return Math.max(0, (eh + em / 60) - (sh + sm / 60))
}

function ScheduleTable({ schedules, status }: { schedules: Schedule[]; status: string }) {
  const totalHours = schedules.reduce(
    (sum, s) => sum + calculateHours(s.start_time, s.end_time),
    0
  )

  const statusConfig = STATUS_CONFIG[status] || STATUS_CONFIG.pending

  const validFrom = schedules[0]?.valid_from
  const validUntil = schedules[0]?.valid_until

  // Check if expiring within 2 weeks
  const isExpiringSoon = validUntil
    ? new Date(validUntil).getTime() - Date.now() < 14 * 24 * 60 * 60 * 1000
    : false

  const isExpired = validUntil
    ? new Date(validUntil).getTime() < Date.now()
    : false

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Badge variant={statusConfig.variant}>{statusConfig.label}</Badge>
        {validFrom && validUntil && (
          <span className="text-sm text-muted-foreground">
            {new Date(validFrom).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' })}
            {' — '}
            {new Date(validUntil).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short', year: 'numeric' })}
          </span>
        )}
      </div>

      {isExpiringSoon && !isExpired && status === 'approved' && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Je rooster verloopt op{' '}
            {new Date(validUntil).toLocaleDateString('nl-NL', { day: 'numeric', month: 'long' })}.
            Dien een nieuw rooster in.
          </AlertDescription>
        </Alert>
      )}

      {isExpired && status === 'approved' && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Je rooster is verlopen. Dien een nieuw rooster in.
          </AlertDescription>
        </Alert>
      )}

      <div className="rounded-lg border">
        {[1, 2, 3, 4, 5, 6, 7].map(day => {
          const schedule = schedules.find(s => s.day_of_week === day)
          return (
            <div
              key={day}
              className={`flex items-center justify-between px-4 py-2.5 ${
                day < 7 ? 'border-b' : ''
              } ${schedule ? '' : 'opacity-50'}`}
            >
              <span className="text-sm font-medium w-[100px]">{DAY_NAMES[day]}</span>
              {schedule ? (
                <>
                  <span className="text-sm">
                    {schedule.start_time.slice(0, 5)} — {schedule.end_time.slice(0, 5)}
                  </span>
                  <span className="text-sm text-muted-foreground w-[60px] text-right">
                    {calculateHours(schedule.start_time, schedule.end_time).toFixed(1)}u
                  </span>
                </>
              ) : (
                <>
                  <span className="text-sm text-muted-foreground">Vrij</span>
                  <span className="text-sm text-muted-foreground w-[60px] text-right">—</span>
                </>
              )}
            </div>
          )
        })}
      </div>

      <div className="flex items-center justify-between rounded-lg bg-muted p-3">
        <span className="text-sm font-medium">Totaal per week</span>
        <span className="text-sm font-bold">{totalHours.toFixed(1)} uur</span>
      </div>
    </div>
  )
}

export function ScheduleOverview({ currentSchedule, pendingSchedule }: ScheduleOverviewProps) {
  const hasApproved = currentSchedule && currentSchedule.length > 0
  const hasPending = pendingSchedule && pendingSchedule.length > 0

  return (
    <div className="space-y-6">
      {/* Current approved schedule */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarDays className="h-5 w-5" />
            Huidig rooster
          </CardTitle>
          <CardDescription>
            Je actieve weekrooster
          </CardDescription>
        </CardHeader>
        <CardContent>
          {hasApproved ? (
            <ScheduleTable schedules={currentSchedule} status="approved" />
          ) : (
            <p className="text-sm text-muted-foreground">
              Je hebt nog geen goedgekeurd rooster. Dien een rooster in via het tabblad &quot;Indienen&quot;.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Pending schedule */}
      {hasPending && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Ingediend rooster</CardTitle>
            <CardDescription>
              Wacht op goedkeuring van je docent
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ScheduleTable schedules={pendingSchedule} status="pending" />
          </CardContent>
        </Card>
      )}
    </div>
  )
}

// @ts-nocheck
import { requireStudent } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { CurrentStatusCard } from '@/components/student/current-status-card'
import { WeeklyProgressCard } from '@/components/student/weekly-progress-card'
import { WeekScheduleCard } from '@/components/student/week-schedule-card'
import { LeaveSummaryCard } from '@/components/student/leave-summary-card'
import { getMonday } from '@/lib/date-utils'
import { Clock, History } from 'lucide-react'

export default async function StudentDashboard() {
  const user = await requireStudent()
  const supabase = await createClient()

  const today = new Date()
  const dayOfWeek = today.getDay() || 7
  const todayStr = today.toISOString().split('T')[0]

  // Get active check-in
  const { data: activeCheckIn } = await supabase
    .from('check_ins')
    .select('*, locations(*)')
    .eq('user_id', user.id)
    .is('check_out_time', null)
    .single()

  // Get weekly hours
  const monday = getMonday(today)
  const { data: weeklyHours } = await supabase
    .rpc('get_weekly_hours', {
      student_id: user.id,
      week_start: monday.toISOString().split('T')[0],
    })

  // Get full week schedule (approved, current period)
  const { data: weekSchedules } = await supabase
    .from('schedules')
    .select('day_of_week, start_time, end_time')
    .eq('user_id', user.id)
    .eq('status', 'approved')
    .lte('valid_from', todayStr)
    .gte('valid_until', todayStr)
    .order('day_of_week', { ascending: true })

  // Calculate scheduled weekly hours from roster
  let scheduledWeeklyHours = 0
  for (const s of weekSchedules || []) {
    const start = s.start_time.split(':').map(Number)
    const end = s.end_time.split(':').map(Number)
    scheduledWeeklyHours += (end[0] + end[1] / 60) - (start[0] + start[1] / 60)
  }

  // Get leave request counts
  const { data: leaveRequests } = await supabase
    .from('leave_requests')
    .select('status')
    .eq('user_id', user.id)

  const pendingLeave = (leaveRequests || []).filter(lr => lr.status === 'pending').length
  const approvedLeave = (leaveRequests || []).filter(lr => lr.status === 'approved').length
  const rejectedLeave = (leaveRequests || []).filter(lr => lr.status === 'rejected').length

  // Get recent check-ins
  const { data: checkIns } = await supabase
    .from('check_ins')
    .select('*, locations(*)')
    .eq('user_id', user.id)
    .order('check_in_time', { ascending: false })
    .limit(5)

  // Find today's schedule from weekSchedules
  const todaySchedule = (weekSchedules || []).find((s: any) => s.day_of_week === dayOfWeek) || null

  return (
    <>
      {/* Hero: Status + Check-in button (full width) */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-6">
        <CurrentStatusCard
          initialCheckIn={activeCheckIn}
          userId={user.id}
        />
      </div>

      {/* Info row: Weekly Progress + Week Schedule + Leave Summary */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-6">
        <WeeklyProgressCard
          weeklyHours={weeklyHours || 0}
          targetHours={scheduledWeeklyHours > 0 ? scheduledWeeklyHours : undefined}
        />
        <WeekScheduleCard schedules={weekSchedules || []} />
        <LeaveSummaryCard
          pendingCount={pendingLeave}
          approvedCount={approvedLeave}
          rejectedCount={rejectedLeave}
        />
      </div>

      {/* Today's schedule info */}
      {todaySchedule && (
        <Card className="mb-6 border-primary/20">
          <CardContent className="py-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                <Clock className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Rooster vandaag</p>
                <p className="font-medium">
                  {todaySchedule.start_time.slice(0, 5)} - {todaySchedule.end_time.slice(0, 5)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent check-ins */}
      <Card className="mb-6">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Recente check-ins</CardTitle>
            <Link href="/student/history" className="text-xs text-primary hover:underline">
              Alles bekijken
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          {checkIns && checkIns.length > 0 ? (
            <div className="space-y-3">
              {checkIns.map((checkIn: any) => (
                <div key={checkIn.id} className="flex items-center justify-between border-b pb-2 last:border-0">
                  <div>
                    <p className="font-medium text-sm">{checkIn.locations?.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(checkIn.check_in_time).toLocaleString('nl-NL')}
                    </p>
                  </div>
                  <div className="text-right">
                    {checkIn.check_out_time ? (
                      <span className="text-xs text-green-600">Uitgecheckt</span>
                    ) : (
                      <span className="text-xs text-primary font-medium">Actief</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Nog geen check-ins</p>
          )}
          <div className="mt-4 pt-3 border-t">
            <Link href="/student/history">
              <Button variant="outline" size="sm" className="w-full">
                <History className="h-4 w-4 mr-2" />
                Bekijk volledige geschiedenis
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </>
  )
}

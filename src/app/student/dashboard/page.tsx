// @ts-nocheck
import { requireStudent } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { CheckInHistoryCard } from '@/components/student/check-in-history-card'
import { ProgressAndLeaveCard } from '@/components/student/progress-and-leave-card'
import { WeekScheduleCard } from '@/components/student/week-schedule-card'
import { getMonday } from '@/lib/date-utils'

export default async function StudentDashboard() {
  const user = await requireStudent()
  const supabase = await createClient()

  const today = new Date()
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

  // Get all locations for auto GPS check-in
  const { data: locations } = await supabase
    .from('locations')
    .select('*')

  // Derive today's schedule
  const dayOfWeek = today.getDay() || 7
  const todaySchedule = (weekSchedules || []).find(s => s.day_of_week === dayOfWeek) || null

  return (
    <div className="grid gap-6 md:grid-cols-3">
      <CheckInHistoryCard
        initialCheckIn={activeCheckIn}
        userId={user.id}
        recentCheckIns={checkIns || []}
        locations={locations || []}
        todaySchedule={todaySchedule}
      />
      <ProgressAndLeaveCard
        weeklyHours={weeklyHours || 0}
        targetHours={scheduledWeeklyHours > 0 ? scheduledWeeklyHours : 16}
        pendingCount={pendingLeave}
        approvedCount={approvedLeave}
        rejectedCount={rejectedLeave}
      />
      <WeekScheduleCard schedules={weekSchedules || []} />
    </div>
  )
}

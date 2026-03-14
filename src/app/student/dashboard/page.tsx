// @ts-nocheck
import { requireStudent } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { CheckInHistoryCard } from '@/components/student/check-in-history-card'
import { ProgressAndLeaveCard } from '@/components/student/progress-and-leave-card'
import { WeekScheduleCard } from '@/components/student/week-schedule-card'
import { getMonday, toLocalDateStr } from '@/lib/date-utils'
import type { DayData } from '@/components/student/week-history-view'

export default async function StudentDashboard() {
  const user = await requireStudent()
  const supabase = await createClient()

  const today = new Date()
  const todayStr = toLocalDateStr(today)
  const monday = getMonday(today)
  const nextMonday = new Date(monday)
  nextMonday.setDate(monday.getDate() + 7)
  const mondayStr = toLocalDateStr(monday)
  const sundayStr = toLocalDateStr(new Date(monday.getTime() + 6 * 86400000))

  // Get active check-in
  const { data: activeCheckIn } = await supabase
    .from('check_ins')
    .select('*, locations(*)')
    .eq('user_id', user.id)
    .is('check_out_time', null)
    .single()

  // Get weekly hours
  const { data: weeklyHours } = await supabase
    .rpc('get_weekly_hours', {
      student_id: user.id,
      week_start: mondayStr,
    })

  // Get full week schedules (approved, overlapping current week, newest first)
  const { data: weekSchedules } = await supabase
    .from('schedules')
    .select('day_of_week, start_time, end_time, valid_from, valid_until')
    .eq('user_id', user.id)
    .eq('status', 'approved')
    .lte('valid_from', sundayStr)
    .gte('valid_until', mondayStr)
    .order('valid_from', { ascending: false })

  // Calculate scheduled weekly hours (per-day filtered)
  let scheduledWeeklyHours = 0
  for (let dow = 1; dow <= 5; dow++) {
    const date = new Date(monday)
    date.setDate(monday.getDate() + (dow - 1))
    const dateStr = toLocalDateStr(date)
    const s = (weekSchedules || []).find(sch =>
      sch.day_of_week === dow && sch.valid_from <= dateStr && sch.valid_until >= dateStr
    )
    if (s) {
      const start = s.start_time.split(':').map(Number)
      const end = s.end_time.split(':').map(Number)
      scheduledWeeklyHours += (end[0] + end[1] / 60) - (start[0] + start[1] / 60)
    }
  }

  // Get leave request counts
  const { data: leaveRequests } = await supabase
    .from('leave_requests')
    .select('status')
    .eq('user_id', user.id)

  const pendingLeave = (leaveRequests || []).filter(lr => lr.status === 'pending').length
  const approvedLeave = (leaveRequests || []).filter(lr => lr.status === 'approved').length
  const rejectedLeave = (leaveRequests || []).filter(lr => lr.status === 'rejected').length

  // Fetch check-ins for the current week
  const { data: weekCheckIns } = await supabase
    .from('check_ins')
    .select('id, check_in_time, check_out_time, locations(name)')
    .eq('user_id', user.id)
    .gte('check_in_time', monday.toISOString())
    .lt('check_in_time', nextMonday.toISOString())
    .order('check_in_time', { ascending: true })

  // Fetch approved leave for the current week
  const { data: weekLeave } = await supabase
    .from('leave_requests')
    .select('date, hours_counted, start_time, end_time')
    .eq('user_id', user.id)
    .eq('status', 'approved')
    .gte('date', mondayStr)
    .lte('date', sundayStr)

  // Build DayData for Mon–Fri of the current week
  const currentWeekDays: DayData[] = [1, 2, 3, 4, 5].map((dow) => {
    const date = new Date(monday)
    date.setDate(monday.getDate() + (dow - 1))
    const isoDate = toLocalDateStr(date)

    const scheduled = (weekSchedules || []).find(s =>
      s.day_of_week === dow && s.valid_from <= isoDate && s.valid_until >= isoDate
    ) ?? null

    const lr = (weekLeave || []).find(l => l.date === isoDate) ?? null
    const approvedLeaveDay = lr ? {
      hours_counted: lr.hours_counted,
      start_time: lr.start_time ?? null,
      end_time: lr.end_time ?? null,
    } : null

    const dayCheckIns = (weekCheckIns || [])
      .filter(ci => toLocalDateStr(new Date(ci.check_in_time)) === isoDate)
      .map(ci => ({
        id: ci.id,
        check_in_time: ci.check_in_time,
        check_out_time: ci.check_out_time,
        location_name: (ci.locations as any)?.name ?? 'Onbekend',
      }))

    return { isoDate, dayOfWeek: dow, scheduled, checkIns: dayCheckIns, approvedLeave: approvedLeaveDay }
  })

  // Get all locations for auto GPS check-in
  const { data: locations } = await supabase
    .from('locations')
    .select('*')

  // Derive today's schedule
  const dayOfWeek = today.getDay() || 7
  const todaySchedule = (weekSchedules || []).find(s =>
    s.day_of_week === dayOfWeek && s.valid_from <= todayStr && s.valid_until >= todayStr
  ) ?? null

  return (
    <div className="grid gap-6 md:grid-cols-3">
      <CheckInHistoryCard
        initialCheckIn={activeCheckIn}
        userId={user.id}
        locations={locations || []}
        todaySchedule={todaySchedule}
      />
      <WeekScheduleCard days={currentWeekDays} />
      <ProgressAndLeaveCard
        weeklyHours={weeklyHours || 0}
        targetHours={scheduledWeeklyHours > 0 ? scheduledWeeklyHours : 16}
        pendingCount={pendingLeave}
        approvedCount={approvedLeave}
        rejectedCount={rejectedLeave}
      />
    </div>
  )
}

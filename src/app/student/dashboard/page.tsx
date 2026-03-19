// @ts-nocheck
import { requireStudent } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { CheckInHistoryCard } from '@/components/student/check-in-history-card'
import { ProgressAndLeaveCard } from '@/components/student/progress-and-leave-card'
import { WeekScheduleCard } from '@/components/student/week-schedule-card'
import { DevelopmentGoalsCard } from '@/components/student/development-goals-card'
import { getMonday, toLocalDateStr } from '@/lib/date-utils'
import type { DayData } from '@/components/student/week-history-view'
import { createAdminClient } from '@/lib/supabase/server'
import { CalendarClock } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

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

  // Development goals (use admin client to bypass RLS)
  const adminClient = createAdminClient()
  const [{ data: devGoals }, { data: goalNames }] = await Promise.all([
    adminClient
      .from('student_development_goals')
      .select('goal_1_phase, goal_2_phase, goal_3_phase, goal_4_phase, goal_5_phase, goal_6_phase')
      .eq('student_id', user.id)
      .single(),
    adminClient
      .from('development_goal_names')
      .select('goal_number, goal_name, description')
      .eq('active', true)
      .order('goal_number'),
  ])

  const goalPhases: [number, number, number, number, number, number] = [
    devGoals?.goal_1_phase ?? 0,
    devGoals?.goal_2_phase ?? 0,
    devGoals?.goal_3_phase ?? 0,
    devGoals?.goal_4_phase ?? 0,
    devGoals?.goal_5_phase ?? 0,
    devGoals?.goal_6_phase ?? 0,
  ]

  const finalGoalNames = Array.from({ length: 6 }, (_, i) => {
    const found = (goalNames || []).find((gn: any) => gn.goal_number === i + 1)
    return found || { goal_number: i + 1, goal_name: `Doel ${i + 1}`, description: null }
  })

  // Derive today's schedule
  const dayOfWeek = today.getDay() || 7
  const todaySchedule = (weekSchedules || []).find(s =>
    s.day_of_week === dayOfWeek && s.valid_from <= todayStr && s.valid_until >= todayStr
  ) ?? null

  // Open schedule push request for this student
  const { data: openPushRecipient } = await adminClient
    .from('schedule_push_recipients')
    .select('id, responded, schedule_push_requests(id, valid_from, valid_until, message)')
    .eq('student_id', user.id)
    .eq('responded', false)
    .order('id', { ascending: false })
    .limit(1)
    .maybeSingle()

  const openPush = openPushRecipient
    ? (openPushRecipient.schedule_push_requests as any)
    : null

  // Check if student has a rejected schedule from this push (to show different message)
  const hasRejectedForPush = openPush
    ? !!(await adminClient
        .from('schedules')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('status', 'rejected')
        .eq('push_request_id', openPush.id)
        .then(r => r.count && r.count > 0))
    : false

  // Coach notes visible to student
  const { data: coachNotes } = await supabase
    .from('coach_notes')
    .select('id, note_text, created_at, users!coach_notes_coach_id_fkey(full_name)')
    .eq('student_id', user.id)
    .eq('visible_to_student', true)
    .order('created_at', { ascending: false })
    .limit(3)

  return (
    <div className="space-y-6">
      {/* Schedule push banner */}
      {openPush && (
        <div className={`rounded-xl border p-4 flex items-start gap-3 ${
          hasRejectedForPush
            ? 'border-red-300 bg-red-50'
            : 'border-[#ffd100] bg-[#ffd100]/10'
        }`}>
          <CalendarClock className={`h-5 w-5 mt-0.5 shrink-0 ${hasRejectedForPush ? 'text-red-600' : 'text-[#b89900]'}`} />
          <div className="flex-1 min-w-0">
            <p className={`text-sm font-semibold ${hasRejectedForPush ? 'text-red-800' : 'text-[#b89900]'}`}>
              {hasRejectedForPush ? 'Je rooster is afgekeurd — vul het opnieuw in' : 'Vul je rooster in'}
            </p>
            <p className="text-sm mt-0.5 text-muted-foreground">
              Periode:{' '}
              {new Date(openPush.valid_from).toLocaleDateString('nl-NL', { day: 'numeric', month: 'long' })}
              {' '}t/m{' '}
              {new Date(openPush.valid_until).toLocaleDateString('nl-NL', { day: 'numeric', month: 'long', year: 'numeric' })}
              {openPush.message && ` — ${openPush.message}`}
            </p>
          </div>
          <Link href="/student/schedule?tab=indienen">
            <Button size="sm" className="shrink-0 bg-[#ffd100] text-black hover:bg-[#e6bc00]">
              Rooster invullen
            </Button>
          </Link>
        </div>
      )}

      {/* Coach notes banner */}
      {(coachNotes || []).length > 0 && (
        <div className="rounded-xl border border-[#ffd100]/40 bg-[#ffd100]/10 p-4">
          <h2 className="text-sm font-semibold mb-3 text-[#b89900]">Berichten van je coach</h2>
          <div className="space-y-2">
            {(coachNotes || []).map((note: any) => (
              <div key={note.id} className="bg-background/70 rounded-lg p-3">
                <p className="text-sm">{note.note_text}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {note.users?.full_name} · {new Date(note.created_at).toLocaleDateString('nl-NL', { day: 'numeric', month: 'long' })}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

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

      <DevelopmentGoalsCard goalPhases={goalPhases} goalNames={finalGoalNames} />
    </div>
  )
}

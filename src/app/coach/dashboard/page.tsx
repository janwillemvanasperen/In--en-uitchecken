// @ts-nocheck
import { requireCoach } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/server'
import { ViewSelector } from '@/components/coach/view-selector'
import { getCoachView, getStudentIdsForView, getCoachEntityId } from '@/lib/coach-utils'
import { getMonday, toLocalDateStr } from '@/lib/date-utils'
import { CoachDashboardTable } from '@/components/coach/coach-dashboard-table'
import type { StudentGoalRow, GoalNameRow } from '@/components/coach/coach-dashboard-table'
import { Card, CardContent } from '@/components/ui/card'

export const dynamic = 'force-dynamic'

export default async function CoachDashboard({ searchParams }: { searchParams: any }) {
  const user = await requireCoach()
  const supabase = await createClient()
  const adminClient = createAdminClient()
  const view = getCoachView(searchParams)

  const today = new Date()
  const dayOfWeek = today.getDay() || 7
  const todayStr = toLocalDateStr(today)
  const monday = getMonday(today)
  const mondayStr = toLocalDateStr(monday)
  const mondayLastWeek = new Date(monday.getTime() - 7 * 24 * 3600 * 1000)
  const mondayLastWeekStr = toLocalDateStr(mondayLastWeek)
  const sundayLastWeekStr = toLocalDateStr(new Date(monday.getTime() - 1000))

  const [studentIds, coachEntityId] = await Promise.all([
    getStudentIdsForView(user.id, view),
    getCoachEntityId(user.id),
  ])

  const studentFilter = (q: any) =>
    studentIds === null ? q : studentIds.length === 0 ? q.in('id', ['__none__']) : q.in('id', studentIds)

  // Fetch students + count data for view selector
  const [{ data: allStudents }, { data: allCount }, { data: myStudentsRaw }] = await Promise.all([
    studentFilter(
      supabase
        .from('users')
        .select('id, full_name, profile_photo_url, coach_id, class_code')
        .eq('role', 'student')
        .order('full_name')
    ),
    supabase.from('users').select('id', { count: 'exact', head: true }).eq('role', 'student'),
    coachEntityId
      ? supabase.from('users').select('id, coach_id, class_code').eq('role', 'student')
      : Promise.resolve({ data: [] }),
  ])

  const myStudentCount = coachEntityId
    ? (myStudentsRaw || []).filter((u: any) => u.coach_id === coachEntityId).length
    : 0
  const myClassCodes = Array.from(
    new Set(
      (myStudentsRaw || [])
        .filter((u: any) => u.coach_id === coachEntityId && u.class_code)
        .map((u: any) => u.class_code as string)
    )
  )
  const myKlasCount = (myStudentsRaw || []).filter((u: any) =>
    myClassCodes.includes(u.class_code)
  ).length

  const allIds = (allStudents || []).map((s: any) => s.id)

  if (allIds.length === 0) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold">Dashboard</h1>
          <ViewSelector
            currentView={view}
            counts={{ mijnStudenten: myStudentCount, mijnKlas: myKlasCount, alle: allCount || 0 }}
          />
        </div>
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground text-sm">
            Geen studenten gevonden voor deze weergave.
          </CardContent>
        </Card>
      </div>
    )
  }

  // Fetch all parallel data
  const [
    { data: activeCheckIns },
    { data: todaySchedules },
    { data: pendingLeave },
    { data: weekCheckIns },
    { data: lastWeekCheckIns },
    { data: devGoals },
    { data: goalNames },
    { data: coaches },
  ] = await Promise.all([
    // Who is checked in right now
    supabase
      .from('check_ins')
      .select('user_id')
      .in('user_id', allIds)
      .is('check_out_time', null),
    // Today's approved schedules
    supabase
      .from('schedules')
      .select('user_id')
      .in('user_id', allIds)
      .eq('day_of_week', dayOfWeek)
      .eq('status', 'approved')
      .lte('valid_from', todayStr)
      .gte('valid_until', todayStr),
    // Pending leave requests
    supabase
      .from('leave_requests')
      .select('user_id')
      .in('user_id', allIds)
      .eq('status', 'pending'),
    // This week check-ins (completed)
    supabase
      .from('check_ins')
      .select('user_id, check_in_time, check_out_time')
      .in('user_id', allIds)
      .gte('check_in_time', mondayStr + 'T00:00:00')
      .not('check_out_time', 'is', null),
    // Last week check-ins (completed)
    supabase
      .from('check_ins')
      .select('user_id, check_in_time, check_out_time')
      .in('user_id', allIds)
      .gte('check_in_time', mondayLastWeekStr + 'T00:00:00')
      .lt('check_in_time', mondayStr + 'T00:00:00')
      .not('check_out_time', 'is', null),
    // Development goals
    adminClient
      .from('student_development_goals')
      .select('student_id, goal_1_phase, goal_2_phase, goal_3_phase, goal_4_phase, goal_5_phase, goal_6_phase')
      .in('student_id', allIds),
    // Goal names
    adminClient
      .from('development_goal_names')
      .select('goal_number, goal_name, description')
      .eq('active', true)
      .order('goal_number'),
    // Coaches (for name lookup)
    adminClient.from('coaches').select('id, name'),
  ])

  // Build maps
  const checkedInSet = new Set((activeCheckIns || []).map((ci: any) => ci.user_id))
  const scheduledSet = new Set((todaySchedules || []).map((s: any) => s.user_id))

  const pendingLeaveMap: Record<string, number> = {}
  for (const lr of pendingLeave || []) {
    pendingLeaveMap[lr.user_id] = (pendingLeaveMap[lr.user_id] || 0) + 1
  }

  const weeklyHoursMap: Record<string, number> = {}
  for (const ci of weekCheckIns || []) {
    const h = (new Date(ci.check_out_time).getTime() - new Date(ci.check_in_time).getTime()) / 3600000
    weeklyHoursMap[ci.user_id] = (weeklyHoursMap[ci.user_id] || 0) + h
  }

  const lastWeekHoursMap: Record<string, number> = {}
  for (const ci of lastWeekCheckIns || []) {
    const h = (new Date(ci.check_out_time).getTime() - new Date(ci.check_in_time).getTime()) / 3600000
    lastWeekHoursMap[ci.user_id] = (lastWeekHoursMap[ci.user_id] || 0) + h
  }

  const devGoalsMap: Record<string, any> = {}
  for (const dg of devGoals || []) {
    devGoalsMap[dg.student_id] = dg
  }

  const coachNameMap: Record<string, string> = {}
  for (const c of coaches || []) {
    coachNameMap[c.id] = c.name
  }

  // Build final goal names (fill missing with placeholders)
  const finalGoalNames: GoalNameRow[] = Array.from({ length: 6 }, (_, i) => {
    const found = (goalNames || []).find((gn: any) => gn.goal_number === i + 1)
    return found
      ? { goal_number: i + 1, goal_name: found.goal_name, description: found.description }
      : { goal_number: i + 1, goal_name: `D${i + 1}`, description: null }
  })

  // Build table rows
  const tableRows: StudentGoalRow[] = (allStudents || []).map((s: any) => {
    const dg = devGoalsMap[s.id]
    return {
      id: s.id,
      full_name: s.full_name,
      profile_photo_url: s.profile_photo_url,
      coach_name: s.coach_id ? coachNameMap[s.coach_id] || null : null,
      class_code: s.class_code,
      is_own_student: !!coachEntityId && s.coach_id === coachEntityId,
      goal_phases: [
        dg?.goal_1_phase ?? 0,
        dg?.goal_2_phase ?? 0,
        dg?.goal_3_phase ?? 0,
        dg?.goal_4_phase ?? 0,
        dg?.goal_5_phase ?? 0,
        dg?.goal_6_phase ?? 0,
      ],
      hours_this_week: weeklyHoursMap[s.id] || 0,
      hours_last_week: lastWeekHoursMap[s.id] || 0,
      checked_in_today: checkedInSet.has(s.id),
      has_schedule_today: scheduledSet.has(s.id),
      pending_leave: pendingLeaveMap[s.id] || 0,
    }
  })

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <h1 className="text-xl font-bold">Dashboard</h1>
        <ViewSelector
          currentView={view}
          counts={{ mijnStudenten: myStudentCount, mijnKlas: myKlasCount, alle: allCount || 0 }}
        />
      </div>

      <CoachDashboardTable students={tableRows} goalNames={finalGoalNames} view={view} />
    </div>
  )
}

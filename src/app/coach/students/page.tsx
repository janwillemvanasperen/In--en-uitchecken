// @ts-nocheck
import { requireCoach } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { ViewSelector } from '@/components/coach/view-selector'
import { StudentCard } from '@/components/coach/student-card'
import { getCoachView, getStudentIdsForView, getCoachEntityId } from '@/lib/coach-utils'
import { getMonday, toLocalDateStr } from '@/lib/date-utils'

export const dynamic = 'force-dynamic'

export default async function CoachStudentsPage({ searchParams }: { searchParams: any }) {
  const user = await requireCoach()
  const supabase = await createClient()
  const view = getCoachView(searchParams)

  const today = new Date()
  const dayOfWeek = today.getDay() || 7
  const todayStr = toLocalDateStr(today)
  const monday = getMonday(today)
  const mondayStr = toLocalDateStr(monday)

  const [studentIds, coachEntityId] = await Promise.all([
    getStudentIdsForView(user.id, view),
    getCoachEntityId(user.id),
  ])

  const studentFilter = (q: any) =>
    studentIds === null ? q : studentIds.length === 0 ? q.in('id', ['__none__']) : q.in('id', studentIds)

  const { data: students } = await studentFilter(
    supabase
      .from('users')
      .select('id, full_name, profile_photo_url, class_code, cohort, coach_id')
      .eq('role', 'student')
      .order('full_name')
  )

  const allIds = (students || []).map((s: any) => s.id)

  // Count data for view selector
  const [{ data: allRaw }, { data: myStudentsRaw }] = await Promise.all([
    supabase.from('users').select('id', { count: 'exact', head: true }).eq('role', 'student'),
    coachEntityId
      ? supabase.from('users').select('id, coach_id, class_code').eq('role', 'student')
      : Promise.resolve({ data: [] }),
  ])
  const myStudentCount = coachEntityId ? (myStudentsRaw || []).filter((u: any) => u.coach_id === coachEntityId).length : 0
  const myClassCodes = Array.from(new Set((myStudentsRaw || []).filter((u: any) => u.coach_id === coachEntityId && u.class_code).map((u: any) => u.class_code as string)))
  const myKlasCount = (myStudentsRaw || []).filter((u: any) => myClassCodes.includes(u.class_code)).length

  if (allIds.length === 0) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold">Studenten</h1>
          <ViewSelector currentView={view} counts={{ mijnStudenten: myStudentCount, mijnKlas: myKlasCount, alle: allRaw || 0 }} />
        </div>
        <p className="text-muted-foreground text-sm">Geen studenten gevonden.</p>
      </div>
    )
  }

  const [
    { data: activeCheckIns },
    { data: todaySchedules },
    { data: pendingLeave },
    { data: weekCheckIns },
    { data: noteCounts },
  ] = await Promise.all([
    supabase.from('check_ins').select('user_id, check_in_time, locations!check_ins_location_id_fkey(name)').in('user_id', allIds).is('check_out_time', null),
    supabase.from('schedules').select('user_id').in('user_id', allIds).eq('day_of_week', dayOfWeek).eq('status', 'approved').lte('valid_from', todayStr).gte('valid_until', todayStr),
    supabase.from('leave_requests').select('user_id').in('user_id', allIds).eq('status', 'pending'),
    supabase.from('check_ins').select('user_id, check_in_time, check_out_time').in('user_id', allIds).gte('check_in_time', mondayStr + 'T00:00:00').not('check_out_time', 'is', null),
    supabase.from('coach_notes').select('student_id').eq('coach_id', user.id).in('student_id', allIds),
  ])

  const checkInMap: Record<string, { time: string; location: string }> = {}
  for (const ci of activeCheckIns || []) checkInMap[ci.user_id] = { time: ci.check_in_time, location: ci.locations?.name || '' }

  const scheduledSet = new Set((todaySchedules || []).map((s: any) => s.user_id))

  const pendingLeaveMap: Record<string, number> = {}
  for (const lr of pendingLeave || []) pendingLeaveMap[lr.user_id] = (pendingLeaveMap[lr.user_id] || 0) + 1

  const weeklyHoursMap: Record<string, number> = {}
  for (const ci of weekCheckIns || []) {
    if (ci.check_out_time) {
      const h = (new Date(ci.check_out_time).getTime() - new Date(ci.check_in_time).getTime()) / 3600000
      weeklyHoursMap[ci.user_id] = (weeklyHoursMap[ci.user_id] || 0) + h
    }
  }

  const noteCountMap: Record<string, number> = {}
  for (const n of noteCounts || []) noteCountMap[n.student_id] = (noteCountMap[n.student_id] || 0) + 1

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <h1 className="text-xl font-bold">Studenten</h1>
        <ViewSelector currentView={view} counts={{ mijnStudenten: myStudentCount, mijnKlas: myKlasCount, alle: allRaw || 0 }} />
      </div>

      <p className="text-sm text-muted-foreground">{(students || []).length} studenten</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {(students || []).map((student: any) => (
          <StudentCard
            key={student.id}
            student={student}
            isOwnStudent={!!coachEntityId && student.coach_id === coachEntityId}
            isCheckedIn={!!checkInMap[student.id]}
            checkInTime={checkInMap[student.id]?.time}
            checkInLocation={checkInMap[student.id]?.location}
            hasScheduleToday={scheduledSet.has(student.id)}
            weeklyHours={weeklyHoursMap[student.id] || 0}
            pendingLeave={pendingLeaveMap[student.id] || 0}
            noteCount={noteCountMap[student.id] || 0}
            viewHref={`/coach/students/${student.id}?view=${view}`}
          />
        ))}
      </div>
    </div>
  )
}

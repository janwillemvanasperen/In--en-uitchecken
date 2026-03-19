// @ts-nocheck
import { requireVerzuim } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase/server'
import { AttendanceDashboard } from '@/components/verzuim/attendance-dashboard'

export const dynamic = 'force-dynamic'

// ---- Types ----
type TodayStatus = 'aanwezig' | 'uitgecheck' | 'te-laat' | 'afwezig' | 'verlof' | 'verwacht'

interface TodayStudent {
  id: string
  full_name: string
  coach_name: string | null
  class_code: string | null
  scheduled_start: string
  scheduled_end: string
  scheduled_hours: number
  check_in_time: string | null
  check_out_time: string | null
  actual_hours: number
  status: TodayStatus
}

interface WeekRow {
  monday: string
  label: string
  shortLabel: string
  scheduledHours: number
  actualHours: number
  met16h: boolean
  adherencePct: number | null
  isCurrent: boolean
}

interface StudentHistory {
  id: string
  full_name: string
  coach_id: string | null
  coach_name: string | null
  class_code: string | null
  cohort: string | null
  weeks: WeekRow[]
  avgActualHours: number
  weeksMet16h: number
  totalWeeksWithSchedule: number
}

interface WeekMeta {
  monday: string
  friday: string
  label: string
  shortLabel: string
  isCurrent: boolean
  days: string[] // Mon–Fri date strings
}

// ---- Helpers ----
function toDateStr(d: Date): string {
  return d.toISOString().split('T')[0]
}

function addDays(d: Date, n: number): Date {
  const r = new Date(d)
  r.setDate(r.getDate() + n)
  return r
}

function getMonday(d: Date): Date {
  const r = new Date(d)
  const dow = r.getDay()
  r.setDate(r.getDate() - (dow === 0 ? 6 : dow - 1))
  r.setHours(0, 0, 0, 0)
  return r
}

function isoWeekNumber(d: Date): number {
  const tmp = new Date(d)
  tmp.setHours(0, 0, 0, 0)
  tmp.setDate(tmp.getDate() + 3 - ((tmp.getDay() + 6) % 7))
  const w1 = new Date(tmp.getFullYear(), 0, 4)
  return (
    1 +
    Math.round(
      ((tmp.getTime() - w1.getTime()) / 86400000 - 3 + ((w1.getDay() + 6) % 7)) / 7,
    )
  )
}

function getLast8Weeks(now: Date): WeekMeta[] {
  const thisMonday = getMonday(now)
  const result: WeekMeta[] = []
  for (let i = 7; i >= 0; i--) {
    const monday = addDays(thisMonday, -i * 7)
    const friday = addDays(monday, 4)
    result.push({
      monday: toDateStr(monday),
      friday: toDateStr(friday),
      label: `${monday.toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' })} – ${friday.toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' })}`,
      shortLabel: `W${isoWeekNumber(monday)}`,
      isCurrent: i === 0,
      days: Array.from({ length: 5 }, (_, j) => toDateStr(addDays(monday, j))),
    })
  }
  return result // oldest → newest
}

function timeDiffHours(start: string, end: string): number {
  const [sh, sm] = start.split(':').map(Number)
  const [eh, em] = end.split(':').map(Number)
  return (eh * 60 + em - (sh * 60 + sm)) / 60
}

function computeScheduledHours(studentId: string, week: WeekMeta, schedules: any[]): number {
  let hours = 0
  for (let dayIdx = 0; dayIdx < 5; dayIdx++) {
    const dayOfWeek = dayIdx + 1 // 1=Mon … 5=Fri
    const dateStr = week.days[dayIdx]
    const s = schedules.find(
      s =>
        s.user_id === studentId &&
        s.day_of_week === dayOfWeek &&
        s.valid_from <= dateStr &&
        s.valid_until >= dateStr,
    )
    if (s) hours += timeDiffHours(s.start_time, s.end_time)
  }
  return hours
}

function computeActualHours(
  studentId: string,
  week: WeekMeta,
  checkIns: any[],
  todayStr: string,
  now: Date,
): number {
  let hours = 0
  for (const ci of checkIns) {
    if (ci.user_id !== studentId) continue
    const d = ci.check_in_time.split('T')[0]
    if (d < week.monday || d > week.friday) continue
    if (ci.check_out_time) {
      hours +=
        (new Date(ci.check_out_time).getTime() - new Date(ci.check_in_time).getTime()) /
        3600000
    } else if (d === todayStr) {
      // Still checked in — use current time as running estimate
      hours += (now.getTime() - new Date(ci.check_in_time).getTime()) / 3600000
    }
    // If no checkout and not today: skip (incomplete record)
  }
  return Math.round(hours * 10) / 10
}

// ---- Page ----
export default async function VerzuimDashboard() {
  await requireVerzuim()
  const adminClient = createAdminClient()

  const now = new Date()
  const todayStr = toDateStr(now)
  const todayDow = now.getDay() === 0 ? 7 : now.getDay() // 1=Mon … 7=Sun

  const weeks = getLast8Weeks(now)
  const earliest = weeks[0].monday
  const latest = weeks[7].friday

  const [
    { data: students },
    { data: coaches },
    { data: allSchedules },
    { data: allCheckIns },
    { data: allLeave },
    { data: pendingLeave },
    { count: pendingScheduleCount },
  ] = await Promise.all([
    adminClient
      .from('users')
      .select('id, full_name, coach_id, class_code, cohort')
      .eq('role', 'student')
      .order('full_name'),
    adminClient.from('coaches').select('id, name'),
    adminClient
      .from('schedules')
      .select('user_id, day_of_week, start_time, end_time, valid_from, valid_until')
      .eq('status', 'approved')
      .lte('valid_from', latest)
      .gte('valid_until', earliest),
    adminClient
      .from('check_ins')
      .select('user_id, check_in_time, check_out_time')
      .gte('check_in_time', earliest + 'T00:00:00')
      .lte('check_in_time', latest + 'T23:59:59'),
    adminClient
      .from('leave_requests')
      .select('user_id, date')
      .eq('status', 'approved')
      .gte('date', earliest)
      .lte('date', latest),
    adminClient
      .from('leave_requests')
      .select('id')
      .eq('status', 'pending'),
    adminClient
      .from('schedules')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pending'),
  ])

  const coachMap: Record<string, string> = {}
  for (const c of coaches || []) coachMap[c.id] = c.name

  // ---- Build today's student list ----
  const STATUS_SORT: Record<TodayStatus, number> = {
    afwezig: 0,
    'te-laat': 1,
    verwacht: 2,
    aanwezig: 3,
    uitgecheck: 4,
    verlof: 5,
  }

  const todayStudents: TodayStudent[] = []

  for (const student of students || []) {
    const todaySchedule = (allSchedules || []).find(
      s =>
        s.user_id === student.id &&
        s.day_of_week === todayDow &&
        s.valid_from <= todayStr &&
        s.valid_until >= todayStr,
    )
    if (!todaySchedule) continue // not scheduled today

    const onLeave = (allLeave || []).some(
      l => l.user_id === student.id && l.date === todayStr,
    )
    const checkIn = (allCheckIns || []).find(
      ci => ci.user_id === student.id && ci.check_in_time.startsWith(todayStr),
    )

    const scheduledHours = timeDiffHours(todaySchedule.start_time, todaySchedule.end_time)
    let actualHours = 0
    let status: TodayStatus

    if (onLeave) {
      status = 'verlof'
    } else if (checkIn) {
      if (checkIn.check_out_time) {
        actualHours =
          (new Date(checkIn.check_out_time).getTime() -
            new Date(checkIn.check_in_time).getTime()) /
          3600000
        status = 'uitgecheck'
      } else {
        actualHours =
          (now.getTime() - new Date(checkIn.check_in_time).getTime()) / 3600000
        // Te laat = checked in >15 min after scheduled start
        const schedStart = new Date(todayStr + 'T' + todaySchedule.start_time).getTime()
        status =
          new Date(checkIn.check_in_time).getTime() > schedStart + 15 * 60000
            ? 'te-laat'
            : 'aanwezig'
      }
    } else {
      const schedStart = new Date(todayStr + 'T' + todaySchedule.start_time).getTime()
      status = now.getTime() < schedStart ? 'verwacht' : 'afwezig'
    }

    todayStudents.push({
      id: student.id,
      full_name: student.full_name,
      coach_name: student.coach_id ? (coachMap[student.coach_id] ?? null) : null,
      class_code: student.class_code,
      scheduled_start: todaySchedule.start_time,
      scheduled_end: todaySchedule.end_time,
      scheduled_hours: Math.round(scheduledHours * 10) / 10,
      check_in_time: checkIn?.check_in_time ?? null,
      check_out_time: checkIn?.check_out_time ?? null,
      actual_hours: Math.round(actualHours * 10) / 10,
      status,
    })
  }

  todayStudents.sort(
    (a, b) =>
      STATUS_SORT[a.status] - STATUS_SORT[b.status] ||
      a.full_name.localeCompare(b.full_name, 'nl'),
  )

  // ---- Build 8-week history per student ----
  const studentHistories: StudentHistory[] = []

  for (const student of students || []) {
    const weekRows: WeekRow[] = weeks.map(week => {
      const scheduledHours = computeScheduledHours(student.id, week, allSchedules || [])
      const actualHours = computeActualHours(
        student.id,
        week,
        allCheckIns || [],
        todayStr,
        now,
      )
      return {
        monday: week.monday,
        label: week.label,
        shortLabel: week.shortLabel,
        scheduledHours: Math.round(scheduledHours * 10) / 10,
        actualHours,
        met16h: actualHours >= 16,
        adherencePct:
          scheduledHours > 0
            ? Math.min(100, Math.round((actualHours / scheduledHours) * 100))
            : null,
        isCurrent: week.isCurrent,
      }
    })

    const weeksWithSchedule = weekRows.filter(w => w.scheduledHours > 0)
    const avgActualHours =
      weeksWithSchedule.length > 0
        ? Math.round(
            (weeksWithSchedule.reduce((s, w) => s + w.actualHours, 0) /
              weeksWithSchedule.length) *
              10,
          ) / 10
        : 0

    studentHistories.push({
      id: student.id,
      full_name: student.full_name,
      coach_id: student.coach_id,
      coach_name: student.coach_id ? (coachMap[student.coach_id] ?? null) : null,
      class_code: student.class_code,
      cohort: student.cohort,
      weeks: weekRows,
      avgActualHours,
      weeksMet16h: weekRows.filter(w => w.met16h).length,
      totalWeeksWithSchedule: weeksWithSchedule.length,
    })
  }

  return (
    <AttendanceDashboard
      todayStudents={todayStudents}
      studentHistories={studentHistories}
      pendingLeaveCount={pendingLeave?.length ?? 0}
      pendingScheduleCount={pendingScheduleCount ?? 0}
      nowLabel={now.toLocaleDateString('nl-NL', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })}
    />
  )
}

// @ts-nocheck
import { requireVerzuim } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase/server'
import { AttendanceDashboard } from '@/components/verzuim/attendance-dashboard'

export const dynamic = 'force-dynamic'

// ---- Types (shared with client via props) ----
export type TodayStatus = 'aanwezig' | 'uitgecheck' | 'te-laat' | 'afwezig' | 'verlof' | 'verwacht'

export interface DayStudent {
  id: string
  full_name: string
  coach_name: string | null
  class_code: string | null
  scheduled_start: string
  scheduled_end: string
  scheduled_hours: number
  check_in_id: string | null
  check_in_time: string | null
  check_out_time: string | null
  actual_hours: number
  status: TodayStatus
}

export interface DayOverview {
  date: string
  dayLabel: string
  students: DayStudent[]
}

export interface WeekRow {
  monday: string
  label: string
  shortLabel: string
  isCurrent: boolean
  scheduledHours: number
  actualHoursInclLeave: number   // check-in hours + scheduled hours on leave days
  actualHoursOnSchedule: number  // overlap between check-in window and schedule block
  actualHoursExclLeave: number   // raw check-in hours only
  met16h: boolean                // actualHoursInclLeave >= 16
  adherencePct: number | null    // actualHoursOnSchedule / scheduledHours * 100
}

export interface StudentHistory {
  id: string
  full_name: string
  coach_id: string | null
  coach_name: string | null
  class_code: string | null
  cohort: string | null
  weeks: WeekRow[]
  avgInclLeave: number
  avgExclLeave: number
  avgOnSchedule: number
  avgScheduled: number
  weeksMet16h: number
  totalWeeksWithSchedule: number
}

interface WeekMeta {
  monday: string
  friday: string
  label: string
  shortLabel: string
  isCurrent: boolean
  days: string[]
}

// ---- Date helpers ----
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
    1 + Math.round(((tmp.getTime() - w1.getTime()) / 86400000 - 3 + ((w1.getDay() + 6) % 7)) / 7)
  )
}

function getLast8Weeks(now: Date): WeekMeta[] {
  const thisMonday = getMonday(now)
  return Array.from({ length: 8 }, (_, i) => {
    const monday = addDays(thisMonday, -(7 - i) * 7)
    const friday = addDays(monday, 4)
    return {
      monday: toDateStr(monday),
      friday: toDateStr(friday),
      label: `${monday.toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' })} – ${friday.toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' })}`,
      shortLabel: `W${isoWeekNumber(monday)}`,
      isCurrent: i === 7,
      days: Array.from({ length: 5 }, (_, j) => toDateStr(addDays(monday, j))),
    }
  })
}

// Returns last N working days (Mon-Fri), today first
function getLast5WorkDays(now: Date): Date[] {
  const result: Date[] = []
  const d = new Date(now)
  d.setHours(0, 0, 0, 0)
  while (result.length < 5) {
    const dow = d.getDay()
    if (dow !== 0 && dow !== 6) result.push(new Date(d))
    d.setDate(d.getDate() - 1)
  }
  return result
}

function timeDiffHours(start: string, end: string): number {
  const [sh, sm] = start.split(':').map(Number)
  const [eh, em] = end.split(':').map(Number)
  return (eh * 60 + em - (sh * 60 + sm)) / 60
}

// ---- Hour computation helpers ----
function computeScheduledHours(studentId: string, week: WeekMeta, schedules: any[]): number {
  let hours = 0
  for (let i = 0; i < 5; i++) {
    const dow = i + 1
    const dateStr = week.days[i]
    const s = schedules.find(
      s => s.user_id === studentId && s.day_of_week === dow && s.valid_from <= dateStr && s.valid_until >= dateStr,
    )
    if (s) hours += timeDiffHours(s.start_time, s.end_time)
  }
  return hours
}

function computeActualHoursExclLeave(
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
      hours += (new Date(ci.check_out_time).getTime() - new Date(ci.check_in_time).getTime()) / 3600000
    } else if (d === todayStr) {
      hours += (now.getTime() - new Date(ci.check_in_time).getTime()) / 3600000
    }
  }
  return Math.round(hours * 10) / 10
}

function computeLeaveHours(studentId: string, week: WeekMeta, schedules: any[], leave: any[]): number {
  let hours = 0
  for (let i = 0; i < 5; i++) {
    const dow = i + 1
    const dateStr = week.days[i]
    const onLeave = leave.some(l => l.user_id === studentId && l.date === dateStr)
    if (!onLeave) continue
    const s = schedules.find(
      s => s.user_id === studentId && s.day_of_week === dow && s.valid_from <= dateStr && s.valid_until >= dateStr,
    )
    if (s) hours += timeDiffHours(s.start_time, s.end_time)
  }
  return Math.round(hours * 10) / 10
}

function computeHoursOnSchedule(
  studentId: string,
  week: WeekMeta,
  schedules: any[],
  checkIns: any[],
  todayStr: string,
  now: Date,
): number {
  let hours = 0
  for (let i = 0; i < 5; i++) {
    const dow = i + 1
    const dateStr = week.days[i]
    const sched = schedules.find(
      s => s.user_id === studentId && s.day_of_week === dow && s.valid_from <= dateStr && s.valid_until >= dateStr,
    )
    if (!sched) continue
    const ci = checkIns.find(ci => ci.user_id === studentId && ci.check_in_time.startsWith(dateStr))
    if (!ci) continue

    const schedStart = new Date(dateStr + 'T' + sched.start_time).getTime()
    const schedEnd = new Date(dateStr + 'T' + sched.end_time).getTime()
    const ciStart = new Date(ci.check_in_time).getTime()
    const ciEnd = ci.check_out_time
      ? new Date(ci.check_out_time).getTime()
      : dateStr === todayStr
        ? now.getTime()
        : 0

    if (!ciEnd) continue
    const overlapStart = Math.max(ciStart, schedStart)
    const overlapEnd = Math.min(ciEnd, schedEnd)
    if (overlapEnd > overlapStart) hours += (overlapEnd - overlapStart) / 3600000
  }
  return Math.round(hours * 10) / 10
}

function avg(arr: number[]): number {
  return arr.length > 0 ? Math.round((arr.reduce((a, b) => a + b, 0) / arr.length) * 10) / 10 : 0
}

// ---- Build day overview ----
const STATUS_SORT: Record<TodayStatus, number> = {
  afwezig: 0, 'te-laat': 1, verwacht: 2, aanwezig: 3, uitgecheck: 4, verlof: 5,
}

function computeDayStudents(
  dateStr: string,
  isToday: boolean,
  students: any[],
  allSchedules: any[],
  allCheckIns: any[],
  allLeave: any[],
  coachMap: Record<string, string>,
  now: Date,
): DayStudent[] {
  const date = new Date(dateStr + 'T12:00:00')
  const dow = date.getDay() === 0 ? 7 : date.getDay()
  const result: DayStudent[] = []

  for (const student of students) {
    const sched = allSchedules.find(
      s => s.user_id === student.id && s.day_of_week === dow && s.valid_from <= dateStr && s.valid_until >= dateStr,
    )
    if (!sched) continue

    const onLeave = allLeave.some(l => l.user_id === student.id && l.date === dateStr)
    const ci = allCheckIns.find(ci => ci.user_id === student.id && ci.check_in_time.startsWith(dateStr))
    const scheduledHours = timeDiffHours(sched.start_time, sched.end_time)

    let actualHours = 0
    let status: TodayStatus

    if (onLeave) {
      status = 'verlof'
    } else if (ci) {
      if (ci.check_out_time) {
        actualHours =
          (new Date(ci.check_out_time).getTime() - new Date(ci.check_in_time).getTime()) / 3600000
        status = 'uitgecheck'
      } else {
        actualHours = isToday
          ? (now.getTime() - new Date(ci.check_in_time).getTime()) / 3600000
          : 0 // past day without checkout — show 0, edit to fix
        const schedStart = new Date(dateStr + 'T' + sched.start_time).getTime()
        status =
          new Date(ci.check_in_time).getTime() > schedStart + 15 * 60000 ? 'te-laat' : 'aanwezig'
      }
    } else {
      if (isToday) {
        const schedStart = new Date(dateStr + 'T' + sched.start_time).getTime()
        status = now.getTime() < schedStart ? 'verwacht' : 'afwezig'
      } else {
        status = 'afwezig'
      }
    }

    result.push({
      id: student.id,
      full_name: student.full_name,
      coach_name: student.coach_id ? (coachMap[student.coach_id] ?? null) : null,
      class_code: student.class_code,
      scheduled_start: sched.start_time,
      scheduled_end: sched.end_time,
      scheduled_hours: Math.round(scheduledHours * 10) / 10,
      check_in_id: ci?.id ?? null,
      check_in_time: ci?.check_in_time ?? null,
      check_out_time: ci?.check_out_time ?? null,
      actual_hours: Math.round(actualHours * 10) / 10,
      status,
    })
  }

  return result.sort(
    (a, b) => STATUS_SORT[a.status] - STATUS_SORT[b.status] || a.full_name.localeCompare(b.full_name, 'nl'),
  )
}

// ---- Page ----
export default async function VerzuimDashboard() {
  await requireVerzuim()
  const adminClient = createAdminClient()

  const now = new Date()
  const todayStr = toDateStr(now)

  const weeks = getLast8Weeks(now)
  const workDays = getLast5WorkDays(now)
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
      .select('id, user_id, check_in_time, check_out_time')
      .gte('check_in_time', earliest + 'T00:00:00')
      .lte('check_in_time', latest + 'T23:59:59'),
    adminClient
      .from('leave_requests')
      .select('user_id, date')
      .eq('status', 'approved')
      .gte('date', earliest)
      .lte('date', latest),
    adminClient.from('leave_requests').select('id').eq('status', 'pending'),
    adminClient.from('schedules').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
  ])

  const coachMap: Record<string, string> = {}
  for (const c of coaches || []) coachMap[c.id] = c.name

  // ---- Day overviews (last 5 working days) ----
  const dayLabels = (d: Date, i: number) => {
    const dateFormatted = d.toLocaleDateString('nl-NL', { weekday: 'short', day: 'numeric', month: 'short' })
    if (i === 0) return `Vandaag — ${dateFormatted}`
    if (i === 1) return `Gisteren — ${dateFormatted}`
    return dateFormatted.charAt(0).toUpperCase() + dateFormatted.slice(1)
  }

  const dayOverviews: DayOverview[] = workDays.map((d, i) => {
    const dateStr = toDateStr(d)
    return {
      date: dateStr,
      dayLabel: dayLabels(d, i),
      students: computeDayStudents(
        dateStr,
        i === 0,
        students || [],
        allSchedules || [],
        allCheckIns || [],
        allLeave || [],
        coachMap,
        now,
      ),
    }
  })

  // ---- Student history (8 weeks, 4 metrics) ----
  const studentHistories: StudentHistory[] = (students || []).map(student => {
    const weekRows: WeekRow[] = weeks.map(week => {
      const scheduledHours = computeScheduledHours(student.id, week, allSchedules || [])
      const exclLeave = computeActualHoursExclLeave(student.id, week, allCheckIns || [], todayStr, now)
      const leaveHours = computeLeaveHours(student.id, week, allSchedules || [], allLeave || [])
      const inclLeave = Math.round((exclLeave + leaveHours) * 10) / 10
      const onSchedule = computeHoursOnSchedule(student.id, week, allSchedules || [], allCheckIns || [], todayStr, now)
      return {
        monday: week.monday,
        label: week.label,
        shortLabel: week.shortLabel,
        isCurrent: week.isCurrent,
        scheduledHours: Math.round(scheduledHours * 10) / 10,
        actualHoursInclLeave: inclLeave,
        actualHoursOnSchedule: onSchedule,
        actualHoursExclLeave: exclLeave,
        met16h: inclLeave >= 16,
        adherencePct:
          scheduledHours > 0
            ? Math.min(100, Math.round((onSchedule / scheduledHours) * 100))
            : null,
      }
    })

    const withSched = weekRows.filter(w => w.scheduledHours > 0)
    return {
      id: student.id,
      full_name: student.full_name,
      coach_id: student.coach_id,
      coach_name: student.coach_id ? (coachMap[student.coach_id] ?? null) : null,
      class_code: student.class_code,
      cohort: student.cohort,
      weeks: weekRows,
      avgInclLeave: avg(withSched.map(w => w.actualHoursInclLeave)),
      avgExclLeave: avg(withSched.map(w => w.actualHoursExclLeave)),
      avgOnSchedule: avg(withSched.map(w => w.actualHoursOnSchedule)),
      avgScheduled: avg(withSched.map(w => w.scheduledHours)),
      weeksMet16h: weekRows.filter(w => w.met16h).length,
      totalWeeksWithSchedule: withSched.length,
    }
  })

  return (
    <AttendanceDashboard
      dayOverviews={dayOverviews}
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

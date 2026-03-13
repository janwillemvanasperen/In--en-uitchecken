// @ts-nocheck
import { requireStudent } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { getMonday } from '@/lib/date-utils'
import { WeekHistoryView } from '@/components/student/week-history-view'

function toDateStr(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export default async function HistoryPage({
  searchParams,
}: {
  searchParams: { week?: string }
}) {
  const user = await requireStudent()
  const supabase = await createClient()

  const raw = parseInt(searchParams?.week ?? '0')
  const weekOffset = Math.min(0, isNaN(raw) ? 0 : raw)

  // Determine the Monday of the target week
  const currentMonday = getMonday(new Date())
  const monday = new Date(currentMonday)
  monday.setDate(monday.getDate() + weekOffset * 7)

  const nextMonday = new Date(monday)
  nextMonday.setDate(nextMonday.getDate() + 7)

  const mondayStr = toDateStr(monday)
  const sundayStr = toDateStr(new Date(monday.getTime() + 6 * 86400000))

  // Fetch check-ins for the week
  const { data: checkIns } = await supabase
    .from('check_ins')
    .select('id, check_in_time, check_out_time, locations(name)')
    .eq('user_id', user.id)
    .gte('check_in_time', monday.toISOString())
    .lt('check_in_time', nextMonday.toISOString())
    .order('check_in_time', { ascending: true })

  // Fetch approved schedules valid for this week
  const { data: schedules } = await supabase
    .from('schedules')
    .select('day_of_week, start_time, end_time')
    .eq('user_id', user.id)
    .eq('status', 'approved')
    .lte('valid_from', sundayStr)
    .gte('valid_until', mondayStr)

  // Fetch approved leave requests for this week
  const { data: leaveRequests } = await supabase
    .from('leave_requests')
    .select('date, hours_counted, start_time, end_time')
    .eq('user_id', user.id)
    .eq('status', 'approved')
    .gte('date', mondayStr)
    .lte('date', sundayStr)

  // Build Mon–Fri day data
  const days = [1, 2, 3, 4, 5].map((dow) => {
    const date = new Date(monday)
    date.setDate(monday.getDate() + (dow - 1))
    const isoDate = toDateStr(date)

    const scheduled = schedules?.find(s => s.day_of_week === dow) ?? null
    const lr = leaveRequests?.find(lr => lr.date === isoDate) ?? null
    const approvedLeave = lr ? {
      hours_counted: lr.hours_counted,
      start_time: lr.start_time ?? null,
      end_time: lr.end_time ?? null,
    } : null

    const dayCheckIns = (checkIns ?? [])
      .filter(ci => toDateStr(new Date(ci.check_in_time)) === isoDate)
      .map(ci => ({
        id: ci.id,
        check_in_time: ci.check_in_time,
        check_out_time: ci.check_out_time,
        location_name: (ci.locations as any)?.name ?? 'Onbekend',
      }))

    return { isoDate, dayOfWeek: dow, scheduled, checkIns: dayCheckIns, approvedLeave }
  })

  return (
    <div className="max-w-2xl mx-auto">
      <WeekHistoryView
        weekOffset={weekOffset}
        mondayIso={monday.toISOString()}
        days={days}
      />
    </div>
  )
}

// @ts-nocheck
import { requireAdmin } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { MyStudentsList } from '@/components/admin/my-students-list'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { getMonday } from '@/lib/date-utils'

export const dynamic = 'force-dynamic'

export default async function MyStudentsPage() {
  await requireAdmin()
  const supabase = await createClient()

  const today = new Date()
  const dayOfWeek = today.getDay() || 7
  const todayStr = today.toISOString().split('T')[0]
  const monday = getMonday(today)
  const mondayStr = monday.toISOString().split('T')[0]

  const [
    { data: students },
    { data: coaches },
    { data: activeCheckIns },
    { data: todaySchedules },
    { data: weekCheckIns },
    { data: pendingLeave },
  ] = await Promise.all([
    // All students with coach info
    supabase
      .from('users')
      .select('id, full_name, email, coach_id, profile_photo_url, coaches!users_coach_id_fkey(name)')
      .eq('role', 'student')
      .order('full_name'),
    // Active coaches
    supabase
      .from('coaches')
      .select('*')
      .eq('active', true)
      .order('name'),
    // Currently active check-ins
    supabase
      .from('check_ins')
      .select('user_id, check_in_time, locations!check_ins_location_id_fkey(name)')
      .is('check_out_time', null),
    // Today's approved schedules for all students
    supabase
      .from('schedules')
      .select('user_id, start_time, end_time')
      .eq('day_of_week', dayOfWeek)
      .eq('status', 'approved')
      .lte('valid_from', todayStr)
      .gte('valid_until', todayStr),
    // This week's completed check-ins (for weekly hours calc)
    supabase
      .from('check_ins')
      .select('user_id, check_in_time, check_out_time')
      .gte('check_in_time', mondayStr + 'T00:00:00')
      .not('check_out_time', 'is', null),
    // Pending leave requests count per student
    supabase
      .from('leave_requests')
      .select('user_id')
      .eq('status', 'pending'),
  ])

  // Build active check-in map: userId -> { location, checkInTime }
  const activeCheckInMap: Record<string, { location: string; checkInTime: string }> = {}
  for (const ci of activeCheckIns || []) {
    activeCheckInMap[ci.user_id] = {
      location: ci.locations?.name || 'Onbekend',
      checkInTime: ci.check_in_time,
    }
  }

  // Build today schedule map: userId -> { start, end }
  const todayScheduleMap: Record<string, { start_time: string; end_time: string }> = {}
  for (const s of todaySchedules || []) {
    todayScheduleMap[s.user_id] = {
      start_time: s.start_time,
      end_time: s.end_time,
    }
  }

  // Build weekly hours map: userId -> hours
  const weeklyHoursMap: Record<string, number> = {}
  for (const ci of weekCheckIns || []) {
    if (ci.check_out_time) {
      const hours = (new Date(ci.check_out_time).getTime() - new Date(ci.check_in_time).getTime()) / (1000 * 60 * 60)
      weeklyHoursMap[ci.user_id] = (weeklyHoursMap[ci.user_id] || 0) + hours
    }
  }

  // Build pending leave count map
  const pendingLeaveMap: Record<string, number> = {}
  for (const lr of pendingLeave || []) {
    pendingLeaveMap[lr.user_id] = (pendingLeaveMap[lr.user_id] || 0) + 1
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex items-center gap-4">
          <Link href="/admin/dashboard">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Terug
            </Button>
          </Link>
          <h1 className="text-2xl font-bold">Mijn Studenten</h1>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <MyStudentsList
          students={students || []}
          coaches={coaches || []}
          activeCheckInMap={activeCheckInMap}
          todayScheduleMap={todayScheduleMap}
          weeklyHoursMap={weeklyHoursMap}
          pendingLeaveMap={pendingLeaveMap}
        />
      </main>
    </div>
  )
}

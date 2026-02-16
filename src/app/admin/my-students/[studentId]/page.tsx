// @ts-nocheck
import { requireAdmin } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { StudentDetailView } from '@/components/admin/student-detail-view'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { getMonday } from '@/lib/date-utils'
import { notFound } from 'next/navigation'

export const dynamic = 'force-dynamic'

export default async function StudentDetailPage({ params }: { params: { studentId: string } }) {
  await requireAdmin()
  const supabase = await createClient()
  const { studentId } = await params

  const today = new Date()
  const dayOfWeek = today.getDay() || 7
  const todayStr = today.toISOString().split('T')[0]
  const monday = getMonday(today)
  const mondayStr = monday.toISOString().split('T')[0]

  // Get student profile
  const { data: student } = await supabase
    .from('users')
    .select('id, full_name, email, coach_id, created_at, coaches!users_coach_id_fkey(name)')
    .eq('id', studentId)
    .eq('role', 'student')
    .single()

  if (!student) {
    notFound()
  }

  // Fetch all data in parallel
  const [
    { data: activeCheckIn },
    { data: todaySchedule },
    { data: weekCheckIns },
    { data: allSchedules },
    { data: recentCheckIns },
    { data: leaveRequests },
  ] = await Promise.all([
    // Active check-in
    supabase
      .from('check_ins')
      .select('*, locations!check_ins_location_id_fkey(*)')
      .eq('user_id', studentId)
      .is('check_out_time', null)
      .single(),
    // Today's schedule
    supabase
      .from('schedules')
      .select('*')
      .eq('user_id', studentId)
      .eq('day_of_week', dayOfWeek)
      .eq('status', 'approved')
      .lte('valid_from', todayStr)
      .gte('valid_until', todayStr)
      .single(),
    // This week's check-ins
    supabase
      .from('check_ins')
      .select('*, locations!check_ins_location_id_fkey(name)')
      .eq('user_id', studentId)
      .gte('check_in_time', mondayStr + 'T00:00:00')
      .order('check_in_time', { ascending: false }),
    // Current approved schedules (full week)
    supabase
      .from('schedules')
      .select('*')
      .eq('user_id', studentId)
      .eq('status', 'approved')
      .lte('valid_from', todayStr)
      .gte('valid_until', todayStr)
      .order('day_of_week', { ascending: true }),
    // Recent check-ins (last 30)
    supabase
      .from('check_ins')
      .select('*, locations!check_ins_location_id_fkey(name)')
      .eq('user_id', studentId)
      .order('check_in_time', { ascending: false })
      .limit(30),
    // Leave requests
    supabase
      .from('leave_requests')
      .select('*')
      .eq('user_id', studentId)
      .order('created_at', { ascending: false })
      .limit(20),
  ])

  // Calculate weekly hours from check-ins
  let weeklyHours = 0
  for (const ci of weekCheckIns || []) {
    if (ci.check_out_time) {
      weeklyHours += (new Date(ci.check_out_time).getTime() - new Date(ci.check_in_time).getTime()) / (1000 * 60 * 60)
    }
  }

  // Calculate scheduled weekly hours
  let scheduledWeeklyHours = 0
  for (const s of allSchedules || []) {
    const start = s.start_time.split(':').map(Number)
    const end = s.end_time.split(':').map(Number)
    scheduledWeeklyHours += (end[0] + end[1] / 60) - (start[0] + start[1] / 60)
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex items-center gap-4">
          <Link href="/admin/my-students">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Terug
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold">{student.full_name}</h1>
            <p className="text-sm text-muted-foreground">
              {student.email}
              {student.coaches?.name && ` — Coach: ${student.coaches.name}`}
            </p>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <StudentDetailView
          student={student}
          activeCheckIn={activeCheckIn}
          todaySchedule={todaySchedule}
          weekCheckIns={weekCheckIns || []}
          weeklyHours={weeklyHours}
          scheduledWeeklyHours={scheduledWeeklyHours}
          allSchedules={allSchedules || []}
          recentCheckIns={recentCheckIns || []}
          leaveRequests={leaveRequests || []}
        />
      </main>
    </div>
  )
}

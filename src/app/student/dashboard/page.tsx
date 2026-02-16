// @ts-nocheck
import { requireStudent } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { LogoutButton } from '@/components/logout-button'
import { TodayScheduleCard } from '@/components/student/today-schedule-card'
import { CurrentStatusCard } from '@/components/student/current-status-card'
import { WeeklyProgressCard } from '@/components/student/weekly-progress-card'
import { NextSessionCard } from '@/components/student/next-session-card'
import { PushNotificationToggle } from '@/components/student/push-notification-toggle'
import { getMonday } from '@/lib/date-utils'

export default async function StudentDashboard() {
  const user = await requireStudent()
  const supabase = await createClient()

  // Get coach name if assigned
  const { data: userProfile } = await supabase
    .from('users')
    .select('coach_id, coaches!users_coach_id_fkey(name)')
    .eq('id', user.id)
    .single()

  const coachName = (userProfile as any)?.coaches?.name || null

  // Get today's day of week (1 = Monday, 7 = Sunday)
  const today = new Date()
  const dayOfWeek = today.getDay() || 7

  // Get today's schedule
  const { data: todaySchedule } = await supabase
    .from('schedules')
    .select('*')
    .eq('user_id', user.id)
    .eq('day_of_week', dayOfWeek)
    .eq('status', 'approved')
    .lte('valid_from', today.toISOString().split('T')[0])
    .gte('valid_until', today.toISOString().split('T')[0])
    .single()

  // Get active check-in
  const { data: activeCheckIn } = await supabase
    .from('check_ins')
    .select('*, locations(*)')
    .eq('user_id', user.id)
    .is('check_out_time', null)
    .single()

  // Get weekly hours (current week starting Monday)
  const monday = getMonday(today)
  const { data: weeklyHours } = await supabase
    .rpc('get_weekly_hours', {
      student_id: user.id,
      week_start: monday.toISOString().split('T')[0],
    })

  // Get next scheduled session (after today)
  const { data: nextSession } = await supabase
    .from('schedules')
    .select('*')
    .eq('user_id', user.id)
    .eq('status', 'approved')
    .gt('day_of_week', dayOfWeek)
    .lte('valid_from', today.toISOString().split('T')[0])
    .gte('valid_until', today.toISOString().split('T')[0])
    .order('day_of_week', { ascending: true })
    .limit(1)
    .single()

  // Get recent check-ins
  const { data: checkIns } = await supabase
    .from('check_ins')
    .select('*, locations(*)')
    .eq('user_id', user.id)
    .order('check_in_time', { ascending: false })
    .limit(5)

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold">Student Dashboard</h1>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm text-muted-foreground">{user.full_name}</p>
              {coachName && (
                <p className="text-xs text-muted-foreground">Coach: {coachName}</p>
              )}
            </div>
            <LogoutButton />
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Top row: Status, Schedule, Progress */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-6">
          <CurrentStatusCard
            initialCheckIn={activeCheckIn}
            userId={user.id}
          />

          <TodayScheduleCard schedule={todaySchedule} />

          <WeeklyProgressCard weeklyHours={weeklyHours || 0} />
        </div>

        {/* Second row: Next session and quick actions */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-6">
          <NextSessionCard
            nextSession={nextSession}
            isCheckedIn={!!activeCheckIn}
          />

          <Card>
            <CardHeader>
              <CardTitle>Check in/uit</CardTitle>
              <CardDescription>
                Start of beëindig je sessie
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/student/check-in">
                <Button className="w-full">
                  Check in/uit
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Geschiedenis</CardTitle>
              <CardDescription>
                Bekijk al je check-ins
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/student/history">
                <Button variant="outline" className="w-full">
                  Bekijk geschiedenis
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Recente check-ins</CardTitle>
            <CardDescription>
              Je laatste 5 check-in sessies
            </CardDescription>
          </CardHeader>
          <CardContent>
            {checkIns && checkIns.length > 0 ? (
              <div className="space-y-4">
                {checkIns.map((checkIn: any) => (
                  <div key={checkIn.id} className="flex items-center justify-between border-b pb-2">
                    <div>
                      <p className="font-medium">{checkIn.locations?.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(checkIn.check_in_time).toLocaleString('nl-NL')}
                      </p>
                    </div>
                    <div className="text-right">
                      {checkIn.check_out_time ? (
                        <span className="text-green-600">Uitgecheckt</span>
                      ) : (
                        <span className="text-blue-600">Actief</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Nog geen check-ins</p>
            )}
          </CardContent>
        </Card>

        <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle>Rooster beheren</CardTitle>
              <CardDescription>Bekijk en bewerk je weekrooster</CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/student/schedule">
                <Button variant="outline" className="w-full">
                  Beheer rooster
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Verlofaanvragen</CardTitle>
              <CardDescription>Vraag verlof aan voor ziekte, te laat of afspraak</CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/student/leave-requests">
                <Button variant="outline" className="w-full">
                  Beheer verlof
                </Button>
              </Link>
            </CardContent>
          </Card>

          <PushNotificationToggle />
        </div>
      </main>
    </div>
  )
}

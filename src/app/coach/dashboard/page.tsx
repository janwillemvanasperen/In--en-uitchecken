// @ts-nocheck
import { requireCoach } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ViewSelector } from '@/components/coach/view-selector'
import { getCoachView, getStudentIdsForView } from '@/lib/coach-utils'
import Link from 'next/link'
import { Users, CheckCircle2, AlertTriangle, Clock, FileText, ArrowRight } from 'lucide-react'
import { getMonday, toLocalDateStr } from '@/lib/date-utils'

export const dynamic = 'force-dynamic'

export default async function CoachDashboard({ searchParams }: { searchParams: any }) {
  const user = await requireCoach()
  const supabase = await createClient()
  const view = getCoachView(searchParams)

  const today = new Date()
  const dayOfWeek = today.getDay() || 7
  const todayStr = toLocalDateStr(today)
  const monday = getMonday(today)
  const mondayStr = toLocalDateStr(monday)

  // Get filtered student IDs
  const studentIds = await getStudentIdsForView(user.id, view)

  // Build base query helper
  const studentFilter = (q: any) =>
    studentIds === null ? q : studentIds.length === 0 ? q.in('id', ['__none__']) : q.in('id', studentIds)

  // Fetch all students in view
  const { data: allStudents } = await studentFilter(
    supabase
      .from('users')
      .select('id, full_name, coach_id, class_code, coaches!users_coach_id_fkey(name, user_id)')
      .eq('role', 'student')
      .order('full_name')
  )

  const allStudentIds = (allStudents || []).map((s: any) => s.id)
  const totalStudents = allStudentIds.length

  // Count students per view for selector
  const [{ data: allCount }, { data: myStudentsRaw }, { data: myKlasRaw }] = await Promise.all([
    supabase.from('users').select('id', { count: 'exact', head: true }).eq('role', 'student'),
    supabase.from('users').select('id, coaches!users_coach_id_fkey(user_id)').eq('role', 'student'),
    supabase.from('users').select('id, class_code, coaches!users_coach_id_fkey(user_id)').eq('role', 'student'),
  ])

  const myStudentCount = (myStudentsRaw || []).filter((u: any) => u.coaches?.user_id === user.id).length
  const myClassCodes = [...new Set((myStudentsRaw || []).filter((u: any) => u.coaches?.user_id === user.id && (u as any).class_code).map((u: any) => (u as any).class_code))]
  const myKlasCount = (myKlasRaw || []).filter((u: any) => myClassCodes.includes(u.class_code)).length

  if (allStudentIds.length === 0) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold">Dashboard</h1>
          <ViewSelector currentView={view} counts={{ mijnStudenten: myStudentCount, mijnKlas: myKlasCount, alle: allCount || 0 }} />
        </div>
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground text-sm">
            Geen studenten gevonden voor deze weergave.
          </CardContent>
        </Card>
      </div>
    )
  }

  const [
    { data: activeCheckIns },
    { data: todaySchedules },
    { data: pendingLeave },
    { data: recentCheckIns },
    { data: weekCheckIns },
    { data: recentNotes },
  ] = await Promise.all([
    // Active check-ins now
    supabase
      .from('check_ins')
      .select('user_id, check_in_time, locations!check_ins_location_id_fkey(name)')
      .in('user_id', allStudentIds)
      .is('check_out_time', null),
    // Today's approved schedules
    supabase
      .from('schedules')
      .select('user_id, start_time, end_time')
      .in('user_id', allStudentIds)
      .eq('day_of_week', dayOfWeek)
      .eq('status', 'approved')
      .lte('valid_from', todayStr)
      .gte('valid_until', todayStr),
    // Pending leave requests
    supabase
      .from('leave_requests')
      .select('id, user_id, date, reason')
      .in('user_id', allStudentIds)
      .eq('status', 'pending')
      .order('created_at', { ascending: false }),
    // Recent check-ins (last 10)
    supabase
      .from('check_ins')
      .select('id, user_id, check_in_time, check_out_time, locations!check_ins_location_id_fkey(name)')
      .in('user_id', allStudentIds)
      .order('check_in_time', { ascending: false })
      .limit(10),
    // This week's check-ins for hours calc
    supabase
      .from('check_ins')
      .select('user_id, check_in_time, check_out_time')
      .in('user_id', allStudentIds)
      .gte('check_in_time', mondayStr + 'T00:00:00')
      .not('check_out_time', 'is', null),
    // Recent coach notes (last 5)
    supabase
      .from('coach_notes')
      .select('id, student_id, note_text, created_at, users!coach_notes_student_id_fkey(full_name)')
      .eq('coach_id', user.id)
      .in('student_id', allStudentIds)
      .order('created_at', { ascending: false })
      .limit(5),
  ])

  const checkedInIds = new Set((activeCheckIns || []).map((ci: any) => ci.user_id))
  const scheduledIds = new Set((todaySchedules || []).map((s: any) => s.user_id))
  const checkedInCount = checkedInIds.size
  const scheduledCount = scheduledIds.size
  const notCheckedInExpected = [...scheduledIds].filter((id) => !checkedInIds.has(id)).length

  // Weekly hours per student
  const weeklyHoursMap: Record<string, number> = {}
  for (const ci of weekCheckIns || []) {
    if (ci.check_out_time) {
      const h = (new Date(ci.check_out_time).getTime() - new Date(ci.check_in_time).getTime()) / 3600000
      weeklyHoursMap[ci.user_id] = (weeklyHoursMap[ci.user_id] || 0) + h
    }
  }
  const avgHours = totalStudents > 0
    ? Object.values(weeklyHoursMap).reduce((a, b) => a + b, 0) / totalStudents
    : 0

  const studentMap = Object.fromEntries((allStudents || []).map((s: any) => [s.id, s]))

  const viewLabel = view === 'mijn-studenten' ? 'Mijn Studenten' : view === 'mijn-klas' ? 'Mijn Klas' : 'Alle Studenten'

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <h1 className="text-xl font-bold">Dashboard</h1>
        <ViewSelector currentView={view} counts={{ mijnStudenten: myStudentCount, mijnKlas: myKlasCount, alle: allCount || 0 }} />
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card>
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-muted-foreground">Studenten</span>
              <Users className="h-4 w-4 text-muted-foreground" />
            </div>
            <p className="text-2xl font-bold">{totalStudents}</p>
            <p className="text-xs text-muted-foreground">{viewLabel}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-muted-foreground">Ingecheckt nu</span>
              <CheckCircle2 className="h-4 w-4 text-green-500" />
            </div>
            <p className="text-2xl font-bold text-green-600">{checkedInCount}</p>
            <p className="text-xs text-muted-foreground">van {scheduledCount} verwacht</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-muted-foreground">Open verlof</span>
              <AlertTriangle className="h-4 w-4 text-orange-500" />
            </div>
            <p className="text-2xl font-bold text-orange-500">{(pendingLeave || []).length}</p>
            <p className="text-xs text-muted-foreground">aanvragen</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-muted-foreground">Gem. uren/week</span>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </div>
            <p className="text-2xl font-bold">{avgHours.toFixed(1)}</p>
            <p className="text-xs text-muted-foreground">deze week</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {/* Vandaag overzicht */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center justify-between">
              <span>Vandaag — {viewLabel}</span>
              <Link href={`/coach/students?view=${view}`} className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1">
                Alle studenten <ArrowRight className="h-3 w-3" />
              </Link>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1.5">
            {notCheckedInExpected > 0 && (
              <div className="flex items-center gap-2 p-2 rounded bg-orange-50 text-orange-700 text-sm">
                <AlertTriangle className="h-4 w-4 shrink-0" />
                {notCheckedInExpected} student{notCheckedInExpected !== 1 ? 'en' : ''} nog niet ingecheckt (verwacht vandaag)
              </div>
            )}
            {checkedInCount === 0 && scheduledCount === 0 && (
              <p className="text-sm text-muted-foreground py-2">Geen studenten verwacht vandaag.</p>
            )}
            {(activeCheckIns || []).slice(0, 5).map((ci: any) => {
              const s = studentMap[ci.user_id]
              return s ? (
                <div key={ci.user_id} className="flex items-center justify-between text-sm py-1 border-b last:border-0">
                  <Link href={`/coach/students/${ci.user_id}?view=${view}`} className="font-medium hover:underline">
                    {s.full_name}
                  </Link>
                  <span className="text-xs text-green-600 flex items-center gap-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
                    {ci.locations?.name}
                  </span>
                </div>
              ) : null
            })}
          </CardContent>
        </Card>

        {/* Aandachtspunten */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Aandachtspunten</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {(pendingLeave || []).length === 0 && notCheckedInExpected === 0 ? (
              <p className="text-sm text-muted-foreground">Geen aandachtspunten.</p>
            ) : null}
            {(pendingLeave || []).slice(0, 5).map((lr: any) => {
              const s = studentMap[lr.user_id]
              const reasonLabel = lr.reason === 'sick' ? 'Ziek' : lr.reason === 'late' ? 'Te laat' : 'Afspraak'
              return s ? (
                <Link key={lr.id} href={`/coach/students/${lr.user_id}?tab=verlof&view=${view}`} className="flex items-center justify-between p-2 rounded hover:bg-muted text-sm">
                  <span className="font-medium">{s.full_name}</span>
                  <Badge variant="outline" className="text-xs">{reasonLabel} · {new Date(lr.date).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' })}</Badge>
                </Link>
              ) : null
            })}
          </CardContent>
        </Card>
      </div>

      {/* Recente activiteit */}
      <div className="grid md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center justify-between">
              <span>Recente check-ins</span>
              <Link href={`/coach/students?view=${view}`} className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1">
                Meer <ArrowRight className="h-3 w-3" />
              </Link>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              {(recentCheckIns || []).slice(0, 6).map((ci: any) => {
                const s = studentMap[ci.user_id]
                const time = new Date(ci.check_in_time).toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' })
                const date = new Date(ci.check_in_time).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' })
                return s ? (
                  <div key={ci.id} className="flex items-center justify-between text-sm py-1 border-b last:border-0">
                    <Link href={`/coach/students/${ci.user_id}?tab=aanwezigheid&view=${view}`} className="font-medium hover:underline truncate max-w-[140px]">
                      {s.full_name}
                    </Link>
                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                      {date} {time}
                      {!ci.check_out_time && <span className="text-green-600 ml-1">●</span>}
                    </span>
                  </div>
                ) : null
              })}
              {(recentCheckIns || []).length === 0 && (
                <p className="text-sm text-muted-foreground">Geen recente check-ins.</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center justify-between">
              <span>Recente notities</span>
              <Link href="/coach/notes" className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1">
                Alle <ArrowRight className="h-3 w-3" />
              </Link>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {(recentNotes || []).length === 0 && (
                <p className="text-sm text-muted-foreground">Geen recente notities.</p>
              )}
              {(recentNotes || []).map((note: any) => (
                <Link key={note.id} href={`/coach/students/${note.student_id}?tab=notities&view=${view}`} className="block p-2 rounded hover:bg-muted">
                  <p className="text-xs font-medium">{note.users?.full_name}</p>
                  <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">{note.note_text}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{new Date(note.created_at).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' })}</p>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

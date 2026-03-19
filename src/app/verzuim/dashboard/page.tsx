// @ts-nocheck
import { requireVerzuim } from '@/lib/auth'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { CheckCircle2, XCircle, Clock, CalendarOff, ArrowRight, UserCheck } from 'lucide-react'

export const dynamic = 'force-dynamic'

// Get Mon–Fri of the week containing `date`
function getWeekDays(date: Date) {
  const dow = date.getDay() // 0=Sun
  const monday = new Date(date)
  monday.setDate(date.getDate() - (dow === 0 ? 6 : dow - 1))
  monday.setHours(0, 0, 0, 0)
  return Array.from({ length: 5 }, (_, i) => {
    const d = new Date(monday)
    d.setDate(monday.getDate() + i)
    return {
      date: d.toISOString().split('T')[0],
      dayNum: i + 1, // 1=Mon
      label: d.toLocaleDateString('nl-NL', { weekday: 'short', day: 'numeric' }),
      isToday: d.toISOString().split('T')[0] === date.toISOString().split('T')[0],
      isFuture: d > date,
    }
  })
}

type DayStatus = 'aanwezig' | 'afwezig' | 'verlof' | 'ingepland' | 'vrij'

export default async function VerzuimDashboard() {
  await requireVerzuim()
  const supabase = await createClient()
  const adminClient = createAdminClient()

  const now = new Date()
  const todayStr = now.toISOString().split('T')[0]
  const todayDow = now.getDay() === 0 ? 7 : now.getDay() // 1=Mon, 7=Sun
  const weekDays = getWeekDays(now)
  const mondayStr = weekDays[0].date
  const fridayStr = weekDays[4].date

  const [
    { data: students },
    { data: coaches },
    { data: weekSchedules },
    { data: weekCheckIns },
    { data: weekLeave },
    { data: pendingLeave },
    { count: pendingScheduleCount },
  ] = await Promise.all([
    adminClient.from('users').select('id, full_name, coach_id').eq('role', 'student').order('full_name'),
    adminClient.from('coaches').select('id, name'),
    adminClient.from('schedules').select('user_id, day_of_week').eq('status', 'approved')
      .lte('valid_from', fridayStr).gte('valid_until', mondayStr),
    adminClient.from('check_ins').select('user_id, check_in_time, check_out_time')
      .gte('check_in_time', mondayStr + 'T00:00:00').lte('check_in_time', fridayStr + 'T23:59:59'),
    adminClient.from('leave_requests').select('user_id, date').eq('status', 'approved')
      .gte('date', mondayStr).lte('date', fridayStr),
    adminClient.from('leave_requests')
      .select('id, user_id, date, reason, description, created_at, users!leave_requests_user_id_fkey(full_name)')
      .eq('status', 'pending').order('created_at', { ascending: true }).limit(10),
    adminClient.from('schedules').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
  ])

  // Build lookups
  const coachMap: Record<string, string> = {}
  for (const c of coaches || []) coachMap[c.id] = c.name

  // Scheduled per day: date → Set<userId>
  const scheduledByDay: Record<string, Set<string>> = {}
  for (const wd of weekDays) {
    scheduledByDay[wd.date] = new Set()
    for (const s of weekSchedules || []) {
      if (s.day_of_week === wd.dayNum) scheduledByDay[wd.date].add(s.user_id)
    }
  }

  // Checked in per day: date → Set<userId>
  const checkedInByDay: Record<string, Set<string>> = {}
  for (const ci of weekCheckIns || []) {
    const d = ci.check_in_time.split('T')[0]
    if (!checkedInByDay[d]) checkedInByDay[d] = new Set()
    checkedInByDay[d].add(ci.user_id)
  }

  // Check-in details for today
  const todayCheckInMap: Record<string, { check_in_time: string; check_out_time: string | null }> = {}
  for (const ci of weekCheckIns || []) {
    const d = ci.check_in_time.split('T')[0]
    if (d === todayStr) todayCheckInMap[ci.user_id] = { check_in_time: ci.check_in_time, check_out_time: ci.check_out_time }
  }

  // Leave per day: date → Set<userId>
  const leaveByDay: Record<string, Set<string>> = {}
  for (const lr of weekLeave || []) {
    if (!leaveByDay[lr.date]) leaveByDay[lr.date] = new Set()
    leaveByDay[lr.date].add(lr.user_id)
  }

  // Today's stats
  const scheduledTodayIds = scheduledByDay[todayStr] || new Set<string>()
  const presentTodayIds = checkedInByDay[todayStr] || new Set<string>()
  const leaveTodayIds = leaveByDay[todayStr] || new Set<string>()
  const absentTodayCount = [...scheduledTodayIds].filter(
    id => !presentTodayIds.has(id) && !leaveTodayIds.has(id)
  ).length

  // Week bar chart data
  const weekBars = weekDays.map(wd => {
    const scheduled = scheduledByDay[wd.date]?.size ?? 0
    const present = checkedInByDay[wd.date]?.size ?? 0
    const pct = scheduled > 0 ? Math.round((present / scheduled) * 100) : null
    return { ...wd, scheduled, present, pct }
  })

  // Build week attendance grid: students who appear in at least one scheduled day this week
  const studentIdsThisWeek = new Set<string>()
  for (const wd of weekDays) {
    scheduledByDay[wd.date]?.forEach(id => studentIdsThisWeek.add(id))
  }
  const weekStudents = (students || []).filter(s => studentIdsThisWeek.has(s.id))

  function getStatus(studentId: string, day: typeof weekDays[0]): DayStatus {
    const scheduled = scheduledByDay[day.date]?.has(studentId) ?? false
    if (!scheduled) return 'vrij'
    if (leaveByDay[day.date]?.has(studentId)) return 'verlof'
    if (day.isFuture) return 'ingepland'
    if (checkedInByDay[day.date]?.has(studentId)) return 'aanwezig'
    return 'afwezig'
  }

  const STATUS_STYLE: Record<DayStatus, string> = {
    aanwezig: 'bg-green-100 text-green-800',
    afwezig: 'bg-red-100 text-red-800',
    verlof: 'bg-yellow-100 text-yellow-800',
    ingepland: 'bg-blue-50 text-blue-600',
    vrij: 'bg-muted/30 text-muted-foreground',
  }
  const STATUS_LABEL: Record<DayStatus, string> = {
    aanwezig: '✓',
    afwezig: '✗',
    verlof: '~',
    ingepland: '·',
    vrij: '—',
  }

  const REASON_LABEL: Record<string, string> = {
    sick: 'Ziek',
    late: 'Te laat',
    appointment: 'Afspraak',
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Verzuimoverzicht</h1>
        <p className="text-muted-foreground text-sm mt-0.5">
          {now.toLocaleDateString('nl-NL', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
        </p>
      </div>

      {/* Stats row */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-1"><CardDescription>Ingepland vandaag</CardDescription></CardHeader>
          <CardContent><p className="text-3xl font-bold">{scheduledTodayIds.size}</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-1"><CardDescription>Aanwezig</CardDescription></CardHeader>
          <CardContent><p className="text-3xl font-bold text-green-600">{presentTodayIds.size}</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-1"><CardDescription>Afwezig</CardDescription></CardHeader>
          <CardContent>
            <p className={`text-3xl font-bold ${absentTodayCount > 0 ? 'text-red-600' : ''}`}>{absentTodayCount}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-1"><CardDescription>Openstaande acties</CardDescription></CardHeader>
          <CardContent>
            <div className="flex gap-3 items-end">
              <div>
                <p className={`text-3xl font-bold ${(pendingLeave?.length ?? 0) > 0 ? 'text-orange-500' : ''}`}>
                  {(pendingLeave?.length ?? 0) + (pendingScheduleCount ?? 0)}
                </p>
              </div>
              <div className="text-xs text-muted-foreground pb-0.5">
                <p>{pendingLeave?.length ?? 0} verlof</p>
                <p>{pendingScheduleCount ?? 0} roosters</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Week attendance bars */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Aanwezigheid deze week</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-5 gap-3">
            {weekBars.map(day => (
              <div key={day.date} className="flex flex-col items-center gap-1.5">
                <div className="w-full bg-muted rounded-md h-20 flex flex-col justify-end overflow-hidden">
                  {day.scheduled > 0 && !day.isFuture && (
                    <div
                      className="bg-green-500 w-full transition-all rounded-b-md"
                      style={{ height: `${(day.present / day.scheduled) * 100}%` }}
                    />
                  )}
                  {day.isFuture && day.scheduled > 0 && (
                    <div className="bg-blue-200 w-full h-full rounded-md" />
                  )}
                </div>
                <p className={`text-xs font-medium ${day.isToday ? 'text-foreground' : 'text-muted-foreground'}`}>
                  {day.label}
                </p>
                <p className="text-xs text-muted-foreground">
                  {day.isFuture ? `${day.scheduled} ingep.` : `${day.present}/${day.scheduled}`}
                </p>
              </div>
            ))}
          </div>
          <div className="flex gap-4 mt-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1"><span className="inline-block w-3 h-3 rounded-sm bg-green-500" /> Aanwezig</span>
            <span className="flex items-center gap-1"><span className="inline-block w-3 h-3 rounded-sm bg-blue-200" /> Ingepland</span>
            <span className="flex items-center gap-1"><span className="inline-block w-3 h-3 rounded-sm bg-muted" /> Geen data</span>
          </div>
        </CardContent>
      </Card>

      {/* Today's attendance table */}
      <Card>
        <CardHeader className="pb-3 flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-base flex items-center gap-2">
              <UserCheck className="h-4 w-4" />
              Vandaag ingepland
            </CardTitle>
            <CardDescription className="text-xs">{scheduledTodayIds.size} studenten</CardDescription>
          </div>
          <Link href="/verzuim/check-ins">
            <Button variant="ghost" size="sm" className="text-xs gap-1">
              Alles <ArrowRight className="h-3 w-3" />
            </Button>
          </Link>
        </CardHeader>
        <CardContent className="p-0">
          {scheduledTodayIds.size === 0 ? (
            <p className="text-sm text-muted-foreground px-6 pb-4">Geen studenten ingepland.</p>
          ) : (
            <div className="divide-y">
              {(students || []).filter(s => scheduledTodayIds.has(s.id)).map(student => {
                const ci = todayCheckInMap[student.id]
                const onLeave = leaveTodayIds.has(student.id)
                return (
                  <div key={student.id} className="flex items-center justify-between px-6 py-2 text-sm">
                    <div>
                      <span className="font-medium">{student.full_name}</span>
                      {student.coach_id && (
                        <span className="text-muted-foreground text-xs"> · {coachMap[student.coach_id] ?? '—'}</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {onLeave ? (
                        <Badge variant="outline" className="text-yellow-700 border-yellow-400 text-xs">Verlof</Badge>
                      ) : ci ? (
                        <>
                          <span className="text-xs text-muted-foreground tabular-nums">
                            {new Date(ci.check_in_time).toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' })}
                            {ci.check_out_time && ` – ${new Date(ci.check_out_time).toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' })}`}
                          </span>
                          <Badge className="bg-green-100 text-green-800 hover:bg-green-100 text-xs">
                            {ci.check_out_time ? 'Uitgecheck' : 'Aanwezig'}
                          </Badge>
                        </>
                      ) : (
                        <Badge variant="outline" className="text-red-600 border-red-300 text-xs">Afwezig</Badge>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pending leave requests */}
      {(pendingLeave?.length ?? 0) > 0 && (
        <Card>
          <CardHeader className="pb-3 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base">Verlofaanvragen</CardTitle>
              <CardDescription className="text-xs">{pendingLeave!.length} wachten op verwerking</CardDescription>
            </div>
            <Link href="/verzuim/leave-requests">
              <Button variant="ghost" size="sm" className="text-xs gap-1">
                Alle aanvragen <ArrowRight className="h-3 w-3" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y">
              {pendingLeave!.map((lr: any) => (
                <div key={lr.id} className="flex items-center justify-between px-6 py-2 text-sm">
                  <div>
                    <span className="font-medium">{lr.users?.full_name ?? '—'}</span>
                    <span className="text-muted-foreground"> · </span>
                    <span className="text-muted-foreground">
                      {new Date(lr.date).toLocaleDateString('nl-NL', { weekday: 'short', day: 'numeric', month: 'short' })}
                    </span>
                    <span className="text-muted-foreground"> · {REASON_LABEL[lr.reason] ?? lr.reason}</span>
                  </div>
                  <Badge variant="outline" className="text-orange-600 border-orange-300 text-xs">Pending</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Week attendance grid */}
      {weekStudents.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Weekoverzicht — studenten</CardTitle>
          </CardHeader>
          <CardContent className="overflow-x-auto p-0">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="text-left px-4 py-2 font-medium sticky left-0 bg-muted/50 min-w-[160px]">Student</th>
                  <th className="text-left px-4 py-2 font-medium text-xs text-muted-foreground">Coach</th>
                  {weekDays.map(wd => (
                    <th key={wd.date} className={`px-3 py-2 font-medium text-xs text-center min-w-[70px] ${wd.isToday ? 'text-foreground' : 'text-muted-foreground'}`}>
                      {wd.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y">
                {weekStudents.map(student => (
                  <tr key={student.id}>
                    <td className="px-4 py-2 font-medium sticky left-0 bg-background">{student.full_name}</td>
                    <td className="px-4 py-2 text-xs text-muted-foreground">
                      {student.coach_id ? (coachMap[student.coach_id] ?? '—') : '—'}
                    </td>
                    {weekDays.map(wd => {
                      const status = getStatus(student.id, wd)
                      return (
                        <td key={wd.date} className="px-3 py-2 text-center">
                          <span className={`inline-block rounded px-1.5 py-0.5 text-xs font-mono ${STATUS_STYLE[status]}`}>
                            {STATUS_LABEL[status]}
                          </span>
                        </td>
                      )
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="flex gap-4 px-4 py-3 text-xs text-muted-foreground border-t flex-wrap">
              <span><span className="font-mono font-bold text-green-800">✓</span> Aanwezig</span>
              <span><span className="font-mono font-bold text-red-800">✗</span> Afwezig</span>
              <span><span className="font-mono font-bold text-yellow-800">~</span> Verlof</span>
              <span><span className="font-mono font-bold text-blue-600">·</span> Ingepland</span>
              <span><span className="font-mono font-bold text-muted-foreground">—</span> Vrij</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick links */}
      <div className="grid gap-3 sm:grid-cols-3">
        <Link href="/verzuim/schedules">
          <Card className="hover:border-foreground/30 transition-colors cursor-pointer">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center justify-between">
                Roosters
                {(pendingScheduleCount ?? 0) > 0 && (
                  <Badge variant="secondary" className="text-orange-600">{pendingScheduleCount}</Badge>
                )}
              </CardTitle>
              <CardDescription className="text-xs">Beoordeel ingediende roosters</CardDescription>
            </CardHeader>
          </Card>
        </Link>
        <Link href="/verzuim/leave-requests">
          <Card className="hover:border-foreground/30 transition-colors cursor-pointer">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center justify-between">
                Verlofaanvragen
                {(pendingLeave?.length ?? 0) > 0 && (
                  <Badge variant="secondary" className="text-orange-600">{pendingLeave!.length}</Badge>
                )}
              </CardTitle>
              <CardDescription className="text-xs">Verwerk verlofaanvragen</CardDescription>
            </CardHeader>
          </Card>
        </Link>
        <Link href="/verzuim/schedule-push">
          <Card className="hover:border-foreground/30 transition-colors cursor-pointer">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Roosterpush</CardTitle>
              <CardDescription className="text-xs">Stuur studenten een roosterverzoek</CardDescription>
            </CardHeader>
          </Card>
        </Link>
      </div>
    </div>
  )
}

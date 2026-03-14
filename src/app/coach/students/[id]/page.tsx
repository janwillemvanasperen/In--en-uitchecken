// @ts-nocheck
import { requireCoach } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { AvatarWithFallback } from '@/components/shared/avatar-with-fallback'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { NoteEditor } from '@/components/coach/note-editor'
import { getCoachView } from '@/lib/coach-utils'
import { ArrowLeft, Star, Clock, CalendarDays, FileText, CheckCircle2, XCircle, AlertTriangle, Briefcase } from 'lucide-react'
import { getMonday, toLocalDateStr } from '@/lib/date-utils'

export const dynamic = 'force-dynamic'

const DAYS = ['Ma', 'Di', 'Wo', 'Do', 'Vr', 'Za', 'Zo']
const REASON_LABELS: Record<string, string> = { sick: 'Ziek', late: 'Te laat', appointment: 'Afspraak' }
const STATUS_LABELS: Record<string, string> = { pending: 'In behandeling', approved: 'Goedgekeurd', rejected: 'Afgewezen' }

export default async function CoachStudentDetailPage({
  params,
  searchParams,
}: {
  params: { id: string }
  searchParams: any
}) {
  const coach = await requireCoach()
  const supabase = await createClient()
  const view = getCoachView(searchParams)
  const activeTab = searchParams?.tab || 'overzicht'

  // Fetch student
  const { data: student } = await supabase
    .from('users')
    .select('*, coaches!users_coach_id_fkey(name, user_id)')
    .eq('id', params.id)
    .eq('role', 'student')
    .single()

  if (!student) notFound()

  const isOwnStudent = student.coaches?.user_id === coach.id

  const today = new Date()
  const dayOfWeek = today.getDay() || 7
  const todayStr = toLocalDateStr(today)
  const monday = getMonday(today)
  const mondayStr = toLocalDateStr(monday)
  const sundayStr = toLocalDateStr(new Date(monday.getTime() + 6 * 86400000))

  // Load data for all tabs at once (server components can do this efficiently)
  const [
    { data: allSchedules },
    { data: recentCheckIns },
    { data: leaveRequests },
    { data: myNotes },
    { data: colleagueNotes },
    { data: weekCheckIns },
  ] = await Promise.all([
    supabase.from('schedules').select('*').eq('user_id', params.id).order('valid_from', { ascending: false }),
    supabase.from('check_ins').select('*, locations!check_ins_location_id_fkey(name)').eq('user_id', params.id).order('check_in_time', { ascending: false }).limit(50),
    supabase.from('leave_requests').select('*').eq('user_id', params.id).order('date', { ascending: false }),
    supabase.from('coach_notes').select('*, users!coach_notes_coach_id_fkey(full_name)').eq('coach_id', coach.id).eq('student_id', params.id).order('created_at', { ascending: false }),
    supabase.from('coach_notes').select('*, users!coach_notes_coach_id_fkey(full_name)').neq('coach_id', coach.id).eq('student_id', params.id).eq('visible_to_coaches', true).order('created_at', { ascending: false }),
    supabase.from('check_ins').select('*').eq('user_id', params.id).gte('check_in_time', mondayStr + 'T00:00:00').not('check_out_time', 'is', null),
  ])

  // Today's schedule
  const todaySchedule = (allSchedules || []).find(
    (s) => s.day_of_week === dayOfWeek && s.status === 'approved' && s.valid_from <= todayStr && s.valid_until >= todayStr
  )

  // Active check-in
  const { data: activeCheckIn } = await supabase
    .from('check_ins')
    .select('*, locations!check_ins_location_id_fkey(name)')
    .eq('user_id', params.id)
    .is('check_out_time', null)
    .single()

  // Weekly hours
  let weeklyHours = 0
  for (const ci of weekCheckIns || []) {
    if (ci.check_out_time) {
      weeklyHours += (new Date(ci.check_out_time).getTime() - new Date(ci.check_in_time).getTime()) / 3600000
    }
  }

  // Group schedules by submission group for rooster tab
  const approvedSchedules = (allSchedules || []).filter((s) => s.status === 'approved')
  const scheduleGroups = Object.values(
    approvedSchedules.reduce((acc: any, s: any) => {
      const k = s.submission_group || s.id
      if (!acc[k]) acc[k] = { group: k, valid_from: s.valid_from, valid_until: s.valid_until, entries: [] }
      acc[k].entries.push(s)
      return acc
    }, {})
  ).sort((a: any, b: any) => b.valid_from.localeCompare(a.valid_from))

  // Week history for weekoverzicht tab
  const weekHistoryMap: Record<string, number> = {}
  for (const ci of recentCheckIns || []) {
    if (ci.check_out_time) {
      const w = toLocalDateStr(getMonday(new Date(ci.check_in_time)))
      const h = (new Date(ci.check_out_time).getTime() - new Date(ci.check_in_time).getTime()) / 3600000
      weekHistoryMap[w] = (weekHistoryMap[w] || 0) + h
    }
  }
  const weekHistory = Object.entries(weekHistoryMap)
    .sort(([a], [b]) => b.localeCompare(a))
    .slice(0, 12)

  const tabs = [
    { id: 'overzicht', label: 'Overzicht' },
    { id: 'rooster', label: 'Rooster' },
    { id: 'aanwezigheid', label: 'Aanwezigheid' },
    { id: 'weekoverzicht', label: 'Weekoverzicht' },
    { id: 'verlof', label: 'Verlofaanvragen' },
    { id: 'notities', label: 'Notities' },
    { id: 'werk', label: 'Werk & Bewijsstukken' },
  ]

  const statusBadge = (status: string) => {
    const colors: Record<string, string> = {
      pending: 'bg-orange-100 text-orange-700',
      approved: 'bg-green-100 text-green-700',
      rejected: 'bg-red-100 text-red-700',
    }
    return (
      <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${colors[status] || 'bg-gray-100 text-gray-700'}`}>
        {STATUS_LABELS[status] || status}
      </span>
    )
  }

  return (
    <div className="space-y-4 max-w-4xl">
      {/* Back */}
      <Link href={`/coach/students?view=${view}`} className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-3.5 w-3.5" /> Terug naar studenten
      </Link>

      {/* Student header */}
      <div className="flex items-start gap-4 p-4 rounded-xl border bg-card">
        <AvatarWithFallback src={student.profile_photo_url} fullName={student.full_name} size="lg" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-xl font-bold">{student.full_name}</h1>
            {isOwnStudent && <Star className="h-4 w-4 fill-[#ffd100] text-[#ffd100]" />}
          </div>
          <div className="flex items-center gap-2 flex-wrap mt-1">
            {student.coaches?.name && <Badge variant="secondary">{student.coaches.name}</Badge>}
            {student.class_code && <Badge variant="outline">{student.class_code}</Badge>}
            {student.cohort && <Badge variant="outline">{student.cohort}</Badge>}
          </div>
          <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
            <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> {weeklyHours.toFixed(1)}u deze week</span>
            {activeCheckIn && (
              <span className="flex items-center gap-1 text-green-600">
                <span className="h-1.5 w-1.5 rounded-full bg-green-500" /> Ingecheckt · {activeCheckIn.locations?.name}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="overflow-x-auto -mx-4 px-4">
        <div className="flex gap-1 min-w-max border-b pb-0">
          {tabs.map((tab) => (
            <Link
              key={tab.id}
              href={`/coach/students/${params.id}?tab=${tab.id}&view=${view}`}
              className={`px-3 py-2 text-sm rounded-t-md whitespace-nowrap border-b-2 -mb-px transition-colors ${
                activeTab === tab.id
                  ? 'border-[#ffd100] font-medium text-foreground'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              {tab.label}
              {tab.id === 'werk' && (
                <span className="ml-1.5 inline-flex text-xs bg-[#ffd100]/20 text-[#ffd100] px-1 rounded">
                  Binnenkort
                </span>
              )}
            </Link>
          ))}
        </div>
      </div>

      {/* Tab content */}
      {activeTab === 'overzicht' && (
        <div className="grid md:grid-cols-2 gap-4">
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm">Vandaag</CardTitle></CardHeader>
            <CardContent className="space-y-2 text-sm">
              {todaySchedule ? (
                <div className="flex items-center justify-between">
                  <span>Rooster: {todaySchedule.start_time.slice(0,5)} – {todaySchedule.end_time.slice(0,5)}</span>
                  {activeCheckIn
                    ? <Badge className="bg-green-100 text-green-700 border-0">Ingecheckt</Badge>
                    : <Badge variant="outline">Niet ingecheckt</Badge>
                  }
                </div>
              ) : (
                <p className="text-muted-foreground">Geen rooster vandaag.</p>
              )}
              {activeCheckIn && (
                <p className="text-green-600">
                  Inchecktijd: {new Date(activeCheckIn.check_in_time).toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' })} · {activeCheckIn.locations?.name}
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm">Week</CardTitle></CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{weeklyHours.toFixed(1)}u</p>
              <p className="text-xs text-muted-foreground">ingecheckt deze week</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm">Laatste 5 check-ins</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-1.5 text-sm">
                {(recentCheckIns || []).slice(0, 5).map((ci: any) => (
                  <div key={ci.id} className="flex items-center justify-between">
                    <span className="text-muted-foreground">{new Date(ci.check_in_time).toLocaleDateString('nl-NL', { weekday: 'short', day: 'numeric', month: 'short' })}</span>
                    <span>
                      {new Date(ci.check_in_time).toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' })}
                      {ci.check_out_time ? ` – ${new Date(ci.check_out_time).toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' })}` : ' (actief)'}
                    </span>
                  </div>
                ))}
                {(recentCheckIns || []).length === 0 && <p className="text-muted-foreground">Geen check-ins.</p>}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm">Open verlofaanvragen</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-1.5 text-sm">
                {(leaveRequests || []).filter((l: any) => l.status === 'pending').slice(0, 3).map((lr: any) => (
                  <div key={lr.id} className="flex items-center justify-between">
                    <span>{new Date(lr.date).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' })}</span>
                    <Badge variant="outline">{REASON_LABELS[lr.reason]}</Badge>
                  </div>
                ))}
                {!(leaveRequests || []).some((l: any) => l.status === 'pending') && (
                  <p className="text-muted-foreground">Geen openstaande aanvragen.</p>
                )}
              </div>
            </CardContent>
          </Card>

          {(myNotes || []).length > 0 && (
            <Card className="md:col-span-2">
              <CardHeader className="pb-2"><CardTitle className="text-sm">Recente notities</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {(myNotes || []).slice(0, 2).map((n: any) => (
                    <div key={n.id} className="text-sm p-2 rounded bg-muted/50">
                      <p className="line-clamp-2">{n.note_text}</p>
                      <p className="text-xs text-muted-foreground mt-1">{new Date(n.created_at).toLocaleDateString('nl-NL')}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {activeTab === 'rooster' && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm text-muted-foreground p-2 rounded bg-muted/50">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            Read-only weergave — roosters kunnen niet worden aangepast vanuit de coach interface.
          </div>
          {scheduleGroups.length === 0 ? (
            <p className="text-muted-foreground text-sm">Geen goedgekeurde roosters.</p>
          ) : (
            scheduleGroups.map((group: any) => (
              <Card key={group.group}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center justify-between">
                    <span>Geldig {new Date(group.valid_from).toLocaleDateString('nl-NL', { day: 'numeric', month: 'long', year: 'numeric' })} t/m {new Date(group.valid_until).toLocaleDateString('nl-NL', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                    <Badge className="bg-green-100 text-green-700 border-0">Goedgekeurd</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {group.entries.sort((a: any, b: any) => a.day_of_week - b.day_of_week).map((entry: any) => (
                      <div key={entry.id} className="flex items-center justify-between p-2 rounded border text-sm">
                        <span className="font-medium w-8">{DAYS[entry.day_of_week - 1]}</span>
                        <span className="text-muted-foreground">{entry.start_time.slice(0,5)} – {entry.end_time.slice(0,5)}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))
          )}

          {/* Pending schedules */}
          {(allSchedules || []).filter((s: any) => s.status === 'pending').length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-orange-500" />
                  In afwachting van goedkeuring
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">Er zijn ingediende roosters die wachten op goedkeuring door een beheerder.</p>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {activeTab === 'aanwezigheid' && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm text-muted-foreground p-2 rounded bg-muted/50">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            Read-only weergave — tijden kunnen niet worden aangepast vanuit de coach interface.
          </div>
          <Card>
            <CardContent className="pt-4">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-muted-foreground text-xs">
                      <th className="text-left pb-2 font-medium">Datum</th>
                      <th className="text-left pb-2 font-medium">Inchecktijd</th>
                      <th className="text-left pb-2 font-medium">Uitchecktijd</th>
                      <th className="text-left pb-2 font-medium">Duur</th>
                      <th className="text-left pb-2 font-medium">Locatie</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(recentCheckIns || []).map((ci: any) => {
                      const dur = ci.check_out_time
                        ? ((new Date(ci.check_out_time).getTime() - new Date(ci.check_in_time).getTime()) / 3600000).toFixed(1) + 'u'
                        : '–'
                      return (
                        <tr key={ci.id} className="border-b last:border-0">
                          <td className="py-2">{new Date(ci.check_in_time).toLocaleDateString('nl-NL', { weekday: 'short', day: 'numeric', month: 'short' })}</td>
                          <td className="py-2">{new Date(ci.check_in_time).toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' })}</td>
                          <td className="py-2">{ci.check_out_time ? new Date(ci.check_out_time).toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' }) : <span className="text-green-600">Actief</span>}</td>
                          <td className="py-2">{dur}</td>
                          <td className="py-2 text-muted-foreground">{ci.locations?.name || '–'}</td>
                        </tr>
                      )
                    })}
                    {(recentCheckIns || []).length === 0 && (
                      <tr><td colSpan={5} className="py-4 text-center text-muted-foreground">Geen check-ins gevonden.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === 'weekoverzicht' && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm text-muted-foreground p-2 rounded bg-muted/50">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            Read-only weergave.
          </div>
          <Card>
            <CardContent className="pt-4">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-muted-foreground text-xs">
                    <th className="text-left pb-2 font-medium">Week</th>
                    <th className="text-right pb-2 font-medium">Uren</th>
                  </tr>
                </thead>
                <tbody>
                  {weekHistory.map(([week, hours]) => (
                    <tr key={week} className="border-b last:border-0">
                      <td className="py-2">Week van {new Date(week).toLocaleDateString('nl-NL', { day: 'numeric', month: 'long' })}</td>
                      <td className="py-2 text-right font-medium">{hours.toFixed(1)}u</td>
                    </tr>
                  ))}
                  {weekHistory.length === 0 && (
                    <tr><td colSpan={2} className="py-4 text-center text-muted-foreground">Geen data beschikbaar.</td></tr>
                  )}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === 'verlof' && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm text-muted-foreground p-2 rounded bg-muted/50">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            Read-only weergave — verlofaanvragen kunnen alleen worden goedgekeurd/afgekeurd door beheerders.
          </div>
          <Card>
            <CardContent className="pt-4">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-muted-foreground text-xs">
                      <th className="text-left pb-2 font-medium">Datum</th>
                      <th className="text-left pb-2 font-medium">Reden</th>
                      <th className="text-left pb-2 font-medium">Status</th>
                      <th className="text-left pb-2 font-medium">Uren</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(leaveRequests || []).map((lr: any) => (
                      <tr key={lr.id} className="border-b last:border-0">
                        <td className="py-2">{new Date(lr.date).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short', year: 'numeric' })}</td>
                        <td className="py-2">{REASON_LABELS[lr.reason] || lr.reason}</td>
                        <td className="py-2">{statusBadge(lr.status)}</td>
                        <td className="py-2">{lr.hours_counted ? `${lr.hours_counted}u` : '–'}</td>
                      </tr>
                    ))}
                    {(leaveRequests || []).length === 0 && (
                      <tr><td colSpan={4} className="py-4 text-center text-muted-foreground">Geen verlofaanvragen.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === 'notities' && (
        <NoteEditor
          studentId={params.id}
          currentCoachId={coach.id}
          myNotes={(myNotes || []).map((n: any) => ({ ...n, coach: n.users }))}
          colleagueNotes={(colleagueNotes || []).map((n: any) => ({ ...n, coach: n.users }))}
        />
      )}

      {activeTab === 'werk' && (
        <div className="space-y-4">
          <div className="rounded-xl border-2 border-dashed border-[#ffd100]/40 bg-[#ffd100]/5 p-8 text-center">
            <Briefcase className="h-10 w-10 mx-auto text-[#ffd100]/60 mb-3" />
            <h3 className="font-semibold text-base mb-1">Werk & Bewijsstukken</h3>
            <p className="text-sm text-muted-foreground max-w-sm mx-auto">
              Binnenkort kunnen studenten bewijsstukken indienen. Je kunt ze dan hier bekijken, reviewen en feedback geven.
            </p>
            <Badge className="mt-4 bg-[#ffd100]/20 text-[#ffd100] border-[#ffd100]/30">Binnenkort beschikbaar</Badge>
          </div>
          <Card className="opacity-60 pointer-events-none select-none">
            <CardHeader className="pb-2"><CardTitle className="text-sm">Statistieken (voorbeeld)</CardTitle></CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
                {['Totaal ingediend', 'Wacht op review', 'Gem. beoordeling', 'Laatste indiening'].map((label) => (
                  <div key={label} className="p-3 rounded border bg-muted/30">
                    <p className="text-xs text-muted-foreground">{label}</p>
                    <p className="text-xl font-bold mt-1">–</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}

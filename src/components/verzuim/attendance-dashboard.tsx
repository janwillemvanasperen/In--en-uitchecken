'use client'

import { useState, useMemo } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertCircle } from 'lucide-react'

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

interface Props {
  todayStudents: TodayStudent[]
  studentHistories: StudentHistory[]
  pendingLeaveCount: number
  pendingScheduleCount: number
  nowLabel: string
}

// ---- Helpers ----
const STATUS_LABEL: Record<TodayStatus, string> = {
  aanwezig: 'Aanwezig',
  uitgecheck: 'Uitgecheck',
  'te-laat': 'Te laat',
  afwezig: 'Afwezig',
  verlof: 'Verlof',
  verwacht: 'Verwacht',
}

const STATUS_BADGE: Record<TodayStatus, string> = {
  aanwezig: 'bg-green-100 text-green-800 hover:bg-green-100',
  uitgecheck: 'bg-slate-100 text-slate-600 hover:bg-slate-100',
  'te-laat': 'bg-orange-100 text-orange-800 hover:bg-orange-100',
  afwezig: 'bg-red-100 text-red-800 hover:bg-red-100',
  verlof: 'bg-yellow-100 text-yellow-700 hover:bg-yellow-100',
  verwacht: 'bg-blue-50 text-blue-600 hover:bg-blue-50',
}

function fmtTime(iso: string | null): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' })
}

function weekCellClass(w: WeekRow): string {
  if (w.scheduledHours === 0) return ''
  if (w.met16h) return 'bg-green-100 text-green-800'
  if (w.actualHours >= 12) return 'bg-yellow-100 text-yellow-800'
  if (w.actualHours > 0) return 'bg-red-100 text-red-800'
  return 'bg-red-50 text-red-500'
}

function groupCellClass(met: number, total: number): string {
  if (total === 0) return ''
  const pct = met / total
  if (pct >= 0.8) return 'bg-green-100 text-green-800'
  if (pct >= 0.5) return 'bg-yellow-100 text-yellow-800'
  return 'bg-red-100 text-red-800'
}

// ---- Sub-components ----
function StatCard({ label, value, color }: { label: string; value: number; color?: string }) {
  return (
    <Card>
      <CardHeader className="pb-1 pt-4 px-4">
        <p className="text-xs text-muted-foreground">{label}</p>
      </CardHeader>
      <CardContent className="px-4 pb-4 pt-0">
        <p className={`text-2xl font-bold tabular-nums ${color ?? ''}`}>{value}</p>
      </CardContent>
    </Card>
  )
}

function GroupTable({
  groups,
  weeks,
}: {
  groups: { key: string; label: string; students: StudentHistory[] }[]
  weeks: WeekRow[]
}) {
  if (groups.length === 0) {
    return <p className="text-sm text-muted-foreground py-4">Geen gegevens beschikbaar.</p>
  }
  return (
    <Card>
      <CardContent className="p-0 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="text-left px-4 py-2 font-medium min-w-[180px]">Groep</th>
              <th className="text-center px-3 py-2 text-xs font-medium text-muted-foreground">Studenten</th>
              {weeks.map(w => (
                <th
                  key={w.monday}
                  className={`px-2 py-2 text-center text-xs font-medium min-w-[80px] ${w.isCurrent ? 'text-foreground' : 'text-muted-foreground'}`}
                  title={w.label}
                >
                  {w.shortLabel}
                  {w.isCurrent && <span className="block text-[10px] font-normal">huidig</span>}
                </th>
              ))}
              <th className="px-3 py-2 text-center text-xs font-medium text-muted-foreground min-w-[70px]">
                Gem. uren
              </th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {groups.map(({ key, label, students }) => {
              const totalStudents = students.length
              const avgHours =
                totalStudents > 0
                  ? Math.round(
                      (students.reduce((s, st) => s + st.avgActualHours, 0) / totalStudents) * 10,
                    ) / 10
                  : 0

              return (
                <tr key={key} className="hover:bg-muted/20">
                  <td className="px-4 py-2 font-medium">{label}</td>
                  <td className="px-3 py-2 text-center text-xs text-muted-foreground">{totalStudents}</td>
                  {weeks.map((_, wi) => {
                    const withSchedule = students.filter(s => (s.weeks[wi]?.scheduledHours ?? 0) > 0)
                    const met16h = students.filter(s => s.weeks[wi]?.met16h).length
                    const total = withSchedule.length
                    if (total === 0) {
                      return (
                        <td key={wi} className="px-2 py-2 text-center text-xs text-muted-foreground">
                          —
                        </td>
                      )
                    }
                    return (
                      <td key={wi} className="px-2 py-2 text-center">
                        <span
                          className={`inline-block rounded px-1.5 py-0.5 text-xs tabular-nums ${groupCellClass(met16h, total)}`}
                          title={`${met16h} van ${total} studenten haalden 16u`}
                        >
                          {met16h}/{total}
                        </span>
                      </td>
                    )
                  })}
                  <td className="px-3 py-2 text-center text-xs tabular-nums font-medium">
                    {avgHours}u
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </CardContent>
    </Card>
  )
}

// ---- Main component ----
export function AttendanceDashboard({
  todayStudents,
  studentHistories,
  pendingLeaveCount,
  pendingScheduleCount,
  nowLabel,
}: Props) {
  const [search, setSearch] = useState('')
  const [filterCoach, setFilterCoach] = useState('all')
  const [filterClass, setFilterClass] = useState('all')

  const coaches = useMemo(() => {
    const map: Record<string, string> = {}
    for (const s of studentHistories) {
      if (s.coach_id && s.coach_name) map[s.coach_id] = s.coach_name
    }
    return Object.entries(map).sort(([, a], [, b]) => a.localeCompare(b, 'nl'))
  }, [studentHistories])

  const classes = useMemo(() => {
    const set = new Set<string>()
    for (const s of studentHistories) if (s.class_code) set.add(s.class_code)
    return [...set].sort()
  }, [studentHistories])

  const filteredStudents = useMemo(() => {
    return studentHistories.filter(s => {
      if (search && !s.full_name.toLowerCase().includes(search.toLowerCase())) return false
      if (filterCoach !== 'all' && s.coach_id !== filterCoach) return false
      if (filterClass !== 'all' && s.class_code !== filterClass) return false
      return true
    })
  }, [studentHistories, search, filterCoach, filterClass])

  const todayStats = useMemo(() => {
    const c = { ingepland: 0, aanwezig: 0, uitgecheck: 0, teLaat: 0, afwezig: 0, verlof: 0, verwacht: 0 }
    c.ingepland = todayStudents.length
    for (const s of todayStudents) {
      if (s.status === 'aanwezig') c.aanwezig++
      else if (s.status === 'uitgecheck') c.uitgecheck++
      else if (s.status === 'te-laat') c.teLaat++
      else if (s.status === 'afwezig') c.afwezig++
      else if (s.status === 'verlof') c.verlof++
      else if (s.status === 'verwacht') c.verwacht++
    }
    return c
  }, [todayStudents])

  const coachGroups = useMemo(() => {
    const map: Record<string, { coachName: string; students: StudentHistory[] }> = {}
    for (const s of studentHistories) {
      const key = s.coach_id ?? '__geen__'
      if (!map[key]) map[key] = { coachName: s.coach_name ?? 'Geen coach', students: [] }
      map[key].students.push(s)
    }
    return Object.entries(map)
      .sort(([, a], [, b]) => a.coachName.localeCompare(b.coachName, 'nl'))
      .map(([key, g]) => ({ key, label: g.coachName, students: g.students }))
  }, [studentHistories])

  const classGroups = useMemo(() => {
    const map: Record<string, StudentHistory[]> = {}
    for (const s of studentHistories) {
      const key = s.class_code ?? '__geen__'
      if (!map[key]) map[key] = []
      map[key].push(s)
    }
    return Object.entries(map)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, students]) => ({ key, label: key === '__geen__' ? 'Geen klas' : key, students }))
  }, [studentHistories])

  // Use week metadata from first student (all students share same week structure)
  const weeks: WeekRow[] = studentHistories[0]?.weeks ?? []

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Verzuimoverzicht</h1>
        <p className="text-sm text-muted-foreground mt-0.5">{nowLabel}</p>
      </div>

      <Tabs defaultValue="vandaag">
        <TabsList>
          <TabsTrigger value="vandaag">Vandaag</TabsTrigger>
          <TabsTrigger value="student">Per student</TabsTrigger>
          <TabsTrigger value="coach">Per coachgroep</TabsTrigger>
          <TabsTrigger value="klas">Per klas</TabsTrigger>
        </TabsList>

        {/* ── VANDAAG ── */}
        <TabsContent value="vandaag" className="space-y-4 mt-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <StatCard label="Ingepland" value={todayStats.ingepland} />
            <StatCard label="Aanwezig" value={todayStats.aanwezig} color="text-green-600" />
            <StatCard label="Uitgecheck" value={todayStats.uitgecheck} color="text-slate-500" />
            <StatCard
              label="Te laat"
              value={todayStats.teLaat}
              color={todayStats.teLaat > 0 ? 'text-orange-600' : undefined}
            />
            <StatCard
              label="Afwezig"
              value={todayStats.afwezig}
              color={todayStats.afwezig > 0 ? 'text-red-600' : undefined}
            />
            <StatCard label="Verlof" value={todayStats.verlof} />
          </div>

          {pendingLeaveCount + pendingScheduleCount > 0 && (
            <Card className="border-orange-200 bg-orange-50">
              <CardContent className="py-3 flex items-center gap-3">
                <AlertCircle className="h-4 w-4 text-orange-500 shrink-0" />
                <span className="text-sm text-orange-800">
                  {pendingLeaveCount > 0 && (
                    <span>
                      {pendingLeaveCount} verlofaanvraag{pendingLeaveCount !== 1 ? 'en' : ''}
                    </span>
                  )}
                  {pendingLeaveCount > 0 && pendingScheduleCount > 0 && ' en '}
                  {pendingScheduleCount > 0 && (
                    <span>
                      {pendingScheduleCount} rooster{pendingScheduleCount !== 1 ? 's' : ''}
                    </span>
                  )}
                  {' '}wachten op verwerking.
                </span>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">
                Studenten vandaag
                <span className="ml-2 text-sm font-normal text-muted-foreground">
                  ({todayStudents.length} ingepland)
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0 overflow-x-auto">
              {todayStudents.length === 0 ? (
                <p className="px-6 py-8 text-sm text-muted-foreground text-center">
                  Geen studenten ingepland vandaag.
                </p>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="text-left px-4 py-2 font-medium">Student</th>
                      <th className="text-left px-4 py-2 font-medium text-xs text-muted-foreground hidden sm:table-cell">
                        Coach
                      </th>
                      <th className="text-left px-4 py-2 font-medium text-xs text-muted-foreground hidden md:table-cell">
                        Klas
                      </th>
                      <th className="text-center px-3 py-2 font-medium text-xs text-muted-foreground">
                        Rooster
                      </th>
                      <th className="text-center px-3 py-2 font-medium text-xs text-muted-foreground">
                        Inchecktijd
                      </th>
                      <th className="text-center px-3 py-2 font-medium text-xs text-muted-foreground hidden sm:table-cell">
                        Uittijd
                      </th>
                      <th className="text-center px-3 py-2 font-medium text-xs text-muted-foreground">
                        Uren
                      </th>
                      <th className="text-center px-3 py-2 font-medium text-xs text-muted-foreground">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {todayStudents.map(s => (
                      <tr key={s.id} className="hover:bg-muted/20">
                        <td className="px-4 py-2 font-medium">{s.full_name}</td>
                        <td className="px-4 py-2 text-xs text-muted-foreground hidden sm:table-cell">
                          {s.coach_name ?? '—'}
                        </td>
                        <td className="px-4 py-2 text-xs text-muted-foreground hidden md:table-cell">
                          {s.class_code ?? '—'}
                        </td>
                        <td className="px-3 py-2 text-center text-xs tabular-nums text-muted-foreground">
                          {s.scheduled_start.substring(0, 5)}–{s.scheduled_end.substring(0, 5)}
                        </td>
                        <td className="px-3 py-2 text-center text-xs tabular-nums">
                          {fmtTime(s.check_in_time)}
                        </td>
                        <td className="px-3 py-2 text-center text-xs tabular-nums hidden sm:table-cell">
                          {fmtTime(s.check_out_time)}
                        </td>
                        <td className="px-3 py-2 text-center text-xs tabular-nums">
                          {s.actual_hours > 0 ? `${s.actual_hours.toFixed(1)}u` : '—'}
                        </td>
                        <td className="px-3 py-2 text-center">
                          <Badge className={`text-xs ${STATUS_BADGE[s.status]}`}>
                            {STATUS_LABEL[s.status]}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── PER STUDENT ── */}
        <TabsContent value="student" className="space-y-4 mt-4">
          <div className="flex flex-wrap gap-3">
            <Input
              placeholder="Zoek student..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="max-w-[220px]"
            />
            {coaches.length > 0 && (
              <Select value={filterCoach} onValueChange={setFilterCoach}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Alle coaches" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Alle coaches</SelectItem>
                  {coaches.map(([id, name]) => (
                    <SelectItem key={id} value={id}>
                      {name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            {classes.length > 0 && (
              <Select value={filterClass} onValueChange={setFilterClass}>
                <SelectTrigger className="w-[160px]">
                  <SelectValue placeholder="Alle klassen" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Alle klassen</SelectItem>
                  {classes.map(c => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          <Card>
            <CardContent className="p-0 overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="text-left px-4 py-2 font-medium sticky left-0 bg-muted/50 min-w-[180px]">
                      Student
                    </th>
                    <th className="text-left px-4 py-2 font-medium text-xs text-muted-foreground min-w-[120px] hidden sm:table-cell">
                      Coach
                    </th>
                    {weeks.map(w => (
                      <th
                        key={w.monday}
                        className={`px-2 py-2 text-center text-xs font-medium min-w-[68px] ${w.isCurrent ? 'text-foreground' : 'text-muted-foreground'}`}
                        title={w.label}
                      >
                        {w.shortLabel}
                        {w.isCurrent && (
                          <span className="block text-[10px] font-normal leading-tight">huidig</span>
                        )}
                      </th>
                    ))}
                    <th className="px-3 py-2 text-center text-xs font-medium text-muted-foreground min-w-[58px]">
                      Gem.
                    </th>
                    <th className="px-3 py-2 text-center text-xs font-medium text-muted-foreground min-w-[58px]">
                      16h ✓
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {filteredStudents.length === 0 ? (
                    <tr>
                      <td
                        colSpan={3 + weeks.length}
                        className="px-4 py-8 text-center text-sm text-muted-foreground"
                      >
                        Geen studenten gevonden.
                      </td>
                    </tr>
                  ) : (
                    filteredStudents.map(s => (
                      <tr key={s.id} className="hover:bg-muted/20">
                        <td className="px-4 py-2 font-medium sticky left-0 bg-background">
                          {s.full_name}
                        </td>
                        <td className="px-4 py-2 text-xs text-muted-foreground hidden sm:table-cell">
                          {s.coach_name ?? '—'}
                        </td>
                        {s.weeks.map(w => (
                          <td key={w.monday} className="px-2 py-2 text-center">
                            {w.scheduledHours === 0 ? (
                              <span className="text-xs text-muted-foreground">—</span>
                            ) : (
                              <span
                                className={`inline-block rounded px-1.5 py-0.5 text-xs font-mono tabular-nums ${weekCellClass(w)}`}
                                title={`Ingepland: ${w.scheduledHours}u | Actueel: ${w.actualHours}u${w.adherencePct !== null ? ` | ${w.adherencePct}%` : ''}`}
                              >
                                {w.actualHours}u
                              </span>
                            )}
                          </td>
                        ))}
                        <td className="px-3 py-2 text-center text-xs tabular-nums font-medium">
                          {s.totalWeeksWithSchedule > 0 ? `${s.avgActualHours}u` : '—'}
                        </td>
                        <td className="px-3 py-2 text-center text-xs">
                          {s.totalWeeksWithSchedule > 0 ? (
                            <span
                              className={
                                s.weeksMet16h === s.totalWeeksWithSchedule
                                  ? 'text-green-600 font-medium'
                                  : s.weeksMet16h === 0
                                    ? 'text-red-600'
                                    : 'text-orange-600'
                              }
                            >
                              {s.weeksMet16h}/{s.totalWeeksWithSchedule}
                            </span>
                          ) : (
                            '—'
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </CardContent>
          </Card>

          <div className="flex gap-4 text-xs text-muted-foreground flex-wrap">
            <span className="flex items-center gap-1.5">
              <span className="inline-block w-6 h-4 rounded bg-green-100 border border-green-200" />
              ≥ 16u
            </span>
            <span className="flex items-center gap-1.5">
              <span className="inline-block w-6 h-4 rounded bg-yellow-100 border border-yellow-200" />
              12–16u
            </span>
            <span className="flex items-center gap-1.5">
              <span className="inline-block w-6 h-4 rounded bg-red-100 border border-red-200" />
              &lt; 12u
            </span>
            <span className="flex items-center gap-1.5">
              <span className="inline-block w-6 h-4 rounded bg-red-50 border border-red-100" />
              Ingepland, 0u aanwezig
            </span>
          </div>
        </TabsContent>

        {/* ── PER COACHGROEP ── */}
        <TabsContent value="coach" className="mt-4 space-y-3">
          <p className="text-sm text-muted-foreground">
            Elke cel toont hoeveel studenten ≥ 16u haalden van het totaal ingeroosterde studenten in die week.
          </p>
          <GroupTable groups={coachGroups} weeks={weeks} />
        </TabsContent>

        {/* ── PER KLAS ── */}
        <TabsContent value="klas" className="mt-4 space-y-3">
          <p className="text-sm text-muted-foreground">
            Elke cel toont hoeveel studenten ≥ 16u haalden van het totaal ingeroosterde studenten in die week.
          </p>
          <GroupTable groups={classGroups} weeks={weeks} />
        </TabsContent>
      </Tabs>
    </div>
  )
}

'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { AvatarWithFallback } from '@/components/shared/avatar-with-fallback'
import { GoalPhaseCircle } from '@/components/shared/goal-phase-circle'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import {
  Star, ArrowUpDown, ArrowUp, ArrowDown, ChevronLeft, ChevronRight, ExternalLink,
} from 'lucide-react'
import type { CoachView } from '@/lib/coach-utils'

export interface StudentGoalRow {
  id: string
  full_name: string
  profile_photo_url: string | null
  coach_name: string | null
  class_code: string | null
  is_own_student: boolean
  goal_phases: [number, number, number, number, number, number]
  hours_this_week: number
  hours_last_week: number
  checked_in_today: boolean
  has_schedule_today: boolean
  pending_leave: number
}

export interface GoalNameRow {
  goal_number: number
  goal_name: string
  description: string | null
}

type SortKey =
  | 'full_name' | 'coach_name' | 'class_code'
  | 'g1' | 'g2' | 'g3' | 'g4' | 'g5' | 'g6'
  | 'this_week' | 'last_week'

function SortBtn({ label, sk, cur, onSort }: {
  label: string; sk: SortKey
  cur: { key: SortKey; dir: 'asc' | 'desc' } | null
  onSort: (k: SortKey) => void
}) {
  const active = cur?.key === sk
  return (
    <button
      className="flex items-center gap-0.5 font-medium text-xs text-muted-foreground hover:text-foreground transition-colors whitespace-nowrap"
      onClick={() => onSort(sk)}
    >
      {label}
      {active
        ? cur.dir === 'asc'
          ? <ArrowUp className="h-3 w-3" />
          : <ArrowDown className="h-3 w-3" />
        : <ArrowUpDown className="h-3 w-3 opacity-40" />}
    </button>
  )
}

function HoursCell({ actual, scheduled }: { actual: number; scheduled: number }) {
  const ok = scheduled === 0 || actual >= scheduled
  return (
    <div className={`text-sm font-medium whitespace-nowrap ${ok ? 'text-green-600' : 'text-red-500'}`}>
      {actual.toFixed(1)}
      <span className="text-muted-foreground font-normal text-xs">
        /{scheduled > 0 ? scheduled.toFixed(1) : '?'}u
      </span>
    </div>
  )
}

export function CoachDashboardTable({
  students,
  goalNames,
  view,
}: {
  students: StudentGoalRow[]
  goalNames: GoalNameRow[]
  view: CoachView
}) {
  const [search, setSearch] = useState('')
  const [attendance, setAttendance] = useState('all')
  const [sort, setSort] = useState<{ key: SortKey; dir: 'asc' | 'desc' } | null>(null)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState<25 | 50 | 100>(25)

  const showCoach = view === 'mijn-klas' || view === 'alle'
  const showClass = view === 'alle'

  const handleSort = (key: SortKey) => {
    setSort(p => p?.key === key ? { key, dir: p.dir === 'asc' ? 'desc' : 'asc' } : { key, dir: 'asc' })
    setPage(1)
  }

  const filtered = useMemo(() => {
    let rows = students
    if (search.trim()) {
      const q = search.toLowerCase()
      rows = rows.filter(r => r.full_name.toLowerCase().includes(q))
    }
    if (attendance === 'on_track') {
      rows = rows.filter(r => r.hours_this_week >= r.hours_last_week || r.hours_this_week > 0)
    } else if (attendance === 'below') {
      rows = rows.filter(r => r.hours_last_week > 0 && r.hours_this_week < r.hours_last_week * 0.7)
    } else if (attendance === 'absent_today') {
      rows = rows.filter(r => r.has_schedule_today && !r.checked_in_today)
    }
    return rows
  }, [students, search, attendance])

  const sorted = useMemo(() => {
    if (!sort) return filtered
    const { key, dir } = sort
    return [...filtered].sort((a, b) => {
      let av: number | string, bv: number | string
      switch (key) {
        case 'full_name':  av = a.full_name;        bv = b.full_name;        break
        case 'coach_name': av = a.coach_name || ''; bv = b.coach_name || ''; break
        case 'class_code': av = a.class_code || ''; bv = b.class_code || ''; break
        case 'this_week':  av = a.hours_this_week;  bv = b.hours_this_week;  break
        case 'last_week':  av = a.hours_last_week;  bv = b.hours_last_week;  break
        case 'g1': av = a.goal_phases[0]; bv = b.goal_phases[0]; break
        case 'g2': av = a.goal_phases[1]; bv = b.goal_phases[1]; break
        case 'g3': av = a.goal_phases[2]; bv = b.goal_phases[2]; break
        case 'g4': av = a.goal_phases[3]; bv = b.goal_phases[3]; break
        case 'g5': av = a.goal_phases[4]; bv = b.goal_phases[4]; break
        case 'g6': av = a.goal_phases[5]; bv = b.goal_phases[5]; break
        default:   av = 0; bv = 0
      }
      const cmp = av > bv ? 1 : av < bv ? -1 : 0
      return dir === 'asc' ? cmp : -cmp
    })
  }, [filtered, sort])

  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize))
  const paginated = sorted.slice((page - 1) * pageSize, page * pageSize)

  // Stats
  const checkedIn = students.filter(r => r.checked_in_today).length
  const absentToday = students.filter(r => r.has_schedule_today && !r.checked_in_today).length
  const pendingLeaveTotal = students.reduce((s, r) => s + r.pending_leave, 0)
  const avgHours = students.length > 0
    ? students.reduce((s, r) => s + r.hours_this_week, 0) / students.length
    : 0

  const GOAL_SORT_KEYS: SortKey[] = ['g1', 'g2', 'g3', 'g4', 'g5', 'g6']

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap gap-2 items-center">
        <Input
          placeholder="Zoeken op naam..."
          value={search}
          onChange={e => { setSearch(e.target.value); setPage(1) }}
          className="h-8 text-sm w-44"
        />
        <Select value={attendance} onValueChange={v => { setAttendance(v); setPage(1) }}>
          <SelectTrigger className="h-8 text-xs w-44">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Alle studenten</SelectItem>
            <SelectItem value="absent_today">Afwezig vandaag</SelectItem>
            <SelectItem value="below">Onder verwachting</SelectItem>
          </SelectContent>
        </Select>
        {(search || attendance !== 'all') && (
          <Button variant="ghost" size="sm" className="h-8 text-xs"
            onClick={() => { setSearch(''); setAttendance('all'); setPage(1) }}>
            Wis filters
          </Button>
        )}
        <span className="ml-auto text-xs text-muted-foreground">
          {filtered.length} van {students.length} studenten
        </span>
      </div>

      {/* Table */}
      <div className="border rounded-lg overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 border-b">
            <tr>
              <th className="text-left px-3 py-2.5 sticky left-0 bg-muted/50 min-w-[160px]">
                <SortBtn label="Student" sk="full_name" cur={sort} onSort={handleSort} />
              </th>
              {showCoach && (
                <th className="text-left px-3 py-2.5 min-w-[110px]">
                  <SortBtn label="Coach" sk="coach_name" cur={sort} onSort={handleSort} />
                </th>
              )}
              {showClass && (
                <th className="text-left px-3 py-2.5 min-w-[80px]">
                  <SortBtn label="Klas" sk="class_code" cur={sort} onSort={handleSort} />
                </th>
              )}
              {goalNames.map((gn, i) => (
                <th key={gn.goal_number} className="px-2 py-2.5 min-w-[52px]">
                  <SortBtn label={gn.goal_name} sk={GOAL_SORT_KEYS[i]} cur={sort} onSort={handleSort} />
                </th>
              ))}
              <th className="px-3 py-2.5 text-right min-w-[90px]">
                <SortBtn label="Deze week" sk="this_week" cur={sort} onSort={handleSort} />
              </th>
              <th className="px-3 py-2.5 text-right min-w-[90px]">
                <SortBtn label="Vorige week" sk="last_week" cur={sort} onSort={handleSort} />
              </th>
              <th className="px-3 py-2.5 text-right sticky right-0 bg-muted/50 min-w-[72px] font-medium text-xs text-muted-foreground">
                Acties
              </th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {paginated.length === 0 && (
              <tr>
                <td colSpan={99} className="px-4 py-8 text-center text-muted-foreground text-sm">
                  Geen studenten gevonden.
                </td>
              </tr>
            )}
            {paginated.map((row, idx) => {
              const rowBg = row.is_own_student
                ? 'bg-[#ffd100]/5'
                : idx % 2 === 0 ? 'bg-background' : 'bg-muted/20'
              const borderLeft = row.has_schedule_today && !row.checked_in_today
                ? 'border-l-2 border-l-red-400'
                : ''
              return (
                <tr key={row.id} className={`hover:bg-muted/30 transition-colors ${rowBg} ${borderLeft}`}>
                  {/* Student */}
                  <td className={`px-3 py-2 sticky left-0 ${rowBg}`}>
                    <Link
                      href={`/coach/students/${row.id}?view=${view}`}
                      className="flex items-center gap-2 hover:underline min-w-0"
                    >
                      <AvatarWithFallback src={row.profile_photo_url} fullName={row.full_name} size="sm" />
                      <span className="font-medium truncate max-w-[110px]">{row.full_name}</span>
                      {row.is_own_student && (
                        <Star className="h-3 w-3 fill-[#ffd100] text-[#ffd100] shrink-0" />
                      )}
                      {row.pending_leave > 0 && (
                        <span className="h-2 w-2 rounded-full bg-orange-400 shrink-0"
                          title={`${row.pending_leave} open verlofaanvraag`} />
                      )}
                    </Link>
                  </td>
                  {/* Coach */}
                  {showCoach && (
                    <td className="px-3 py-2">
                      {row.coach_name
                        ? <Badge variant="outline" className="text-xs font-normal">{row.coach_name}</Badge>
                        : <span className="text-muted-foreground text-xs">—</span>}
                    </td>
                  )}
                  {/* Class */}
                  {showClass && (
                    <td className="px-3 py-2">
                      {row.class_code
                        ? <Badge variant="secondary" className="text-xs">{row.class_code}</Badge>
                        : <span className="text-muted-foreground text-xs">—</span>}
                    </td>
                  )}
                  {/* Goals */}
                  {goalNames.map((gn, i) => (
                    <td key={gn.goal_number} className="px-2 py-2">
                      <div className="flex justify-center">
                        <GoalPhaseCircle
                          phase={row.goal_phases[i]}
                          goalName={gn.goal_name}
                          description={gn.description}
                        />
                      </div>
                    </td>
                  ))}
                  {/* Hours */}
                  <td className="px-3 py-2 text-right">
                    <HoursCell actual={row.hours_this_week} scheduled={0} />
                  </td>
                  <td className="px-3 py-2 text-right">
                    <HoursCell actual={row.hours_last_week} scheduled={0} />
                  </td>
                  {/* Actions */}
                  <td className={`px-3 py-2 text-right sticky right-0 ${rowBg}`}>
                    <Link href={`/coach/students/${row.id}?view=${view}`}>
                      <Button variant="ghost" size="sm" className="h-7 text-xs px-2">
                        <ExternalLink className="h-3 w-3 mr-1" />
                        Detail
                      </Button>
                    </Link>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {sorted.length > pageSize && (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Per pagina:</span>
            <Select
              value={String(pageSize)}
              onValueChange={v => { setPageSize(Number(v) as 25 | 50 | 100); setPage(1) }}
            >
              <SelectTrigger className="h-7 text-xs w-16">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="25">25</SelectItem>
                <SelectItem value="50">50</SelectItem>
                <SelectItem value="100">100</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-1">
            <span className="text-xs text-muted-foreground mr-2">
              {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, sorted.length)} van {sorted.length}
            </span>
            <Button variant="ghost" size="icon" className="h-7 w-7"
              onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-7 w-7"
              onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card>
          <CardContent className="pt-3 pb-3">
            <p className="text-xs text-muted-foreground">Studenten</p>
            <p className="text-xl font-bold">{students.length}</p>
            <p className="text-xs text-muted-foreground">{checkedIn} nu ingecheckt</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-3 pb-3">
            <p className="text-xs text-muted-foreground">Afwezig vandaag</p>
            <p className={`text-xl font-bold ${absentToday > 0 ? 'text-red-500' : ''}`}>{absentToday}</p>
            <p className="text-xs text-muted-foreground">hebben rooster</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-3 pb-3">
            <p className="text-xs text-muted-foreground">Gem. uren deze week</p>
            <p className="text-xl font-bold">{avgHours.toFixed(1)}u</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-3 pb-3">
            <p className="text-xs text-muted-foreground">Open verlof</p>
            <p className={`text-xl font-bold ${pendingLeaveTotal > 0 ? 'text-orange-500' : ''}`}>
              {pendingLeaveTotal}
            </p>
            <p className="text-xs text-muted-foreground">aanvragen</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

// @ts-nocheck
import { requireCoach } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { ViewSelector } from '@/components/coach/view-selector'
import { getCoachView, getStudentIdsForView } from '@/lib/coach-utils'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import { AvatarWithFallback } from '@/components/shared/avatar-with-fallback'
import { getMonday, toLocalDateStr } from '@/lib/date-utils'
import { Star } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function CoachComparePage({ searchParams }: { searchParams: any }) {
  const user = await requireCoach()
  const supabase = await createClient()
  const view = getCoachView(searchParams)

  const monday = getMonday(new Date())
  const mondayStr = toLocalDateStr(monday)

  const studentIds = await getStudentIdsForView(user.id, view)
  const studentFilter = (q: any) =>
    studentIds === null ? q : studentIds.length === 0 ? q.in('id', ['__none__']) : q.in('id', studentIds)

  const { data: students } = await studentFilter(
    supabase.from('users').select('id, full_name, profile_photo_url, class_code, coaches!users_coach_id_fkey(name, user_id)').eq('role', 'student').order('full_name')
  )

  const allIds = (students || []).map((s: any) => s.id)

  if (allIds.length === 0) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold">Vergelijken</h1>
          <ViewSelector currentView={view} />
        </div>
        <p className="text-muted-foreground text-sm">Geen studenten gevonden.</p>
      </div>
    )
  }

  const [{ data: weekCheckIns }, { data: leaveRequests }, { data: pendingLeave }] = await Promise.all([
    supabase.from('check_ins').select('user_id, check_in_time, check_out_time').in('user_id', allIds).gte('check_in_time', mondayStr + 'T00:00:00').not('check_out_time', 'is', null),
    supabase.from('leave_requests').select('user_id, status, hours_counted').in('user_id', allIds),
    supabase.from('leave_requests').select('user_id').in('user_id', allIds).eq('status', 'pending'),
  ])

  const weeklyHoursMap: Record<string, number> = {}
  for (const ci of weekCheckIns || []) {
    const h = (new Date(ci.check_out_time).getTime() - new Date(ci.check_in_time).getTime()) / 3600000
    weeklyHoursMap[ci.user_id] = (weeklyHoursMap[ci.user_id] || 0) + h
  }

  const totalLeaveMap: Record<string, number> = {}
  const approvedLeaveHoursMap: Record<string, number> = {}
  for (const lr of leaveRequests || []) {
    totalLeaveMap[lr.user_id] = (totalLeaveMap[lr.user_id] || 0) + 1
    if (lr.status === 'approved') approvedLeaveHoursMap[lr.user_id] = (approvedLeaveHoursMap[lr.user_id] || 0) + (lr.hours_counted || 0)
  }
  const pendingLeaveMap: Record<string, number> = {}
  for (const lr of pendingLeave || []) pendingLeaveMap[lr.user_id] = (pendingLeaveMap[lr.user_id] || 0) + 1

  const sorted = [...(students || [])].sort((a: any, b: any) =>
    (weeklyHoursMap[b.id] || 0) - (weeklyHoursMap[a.id] || 0)
  )

  const maxHours = Math.max(...sorted.map((s: any) => weeklyHoursMap[s.id] || 0), 1)

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <h1 className="text-xl font-bold">Vergelijken</h1>
        <ViewSelector currentView={view} />
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Uren deze week — ranglijst</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {sorted.map((student: any, index: number) => {
              const hours = weeklyHoursMap[student.id] || 0
              const pct = (hours / maxHours) * 100
              const isOwn = student.coaches?.user_id === user.id
              return (
                <div key={student.id} className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground w-5 shrink-0">{index + 1}</span>
                    <Link href={`/coach/students/${student.id}?view=${view}`} className="flex items-center gap-2 flex-1 min-w-0 hover:underline">
                      <AvatarWithFallback src={student.profile_photo_url} fullName={student.full_name} size="sm" />
                      <span className="text-sm font-medium truncate">{student.full_name}</span>
                      {isOwn && <Star className="h-3 w-3 fill-[#ffd100] text-[#ffd100] shrink-0" />}
                      {student.class_code && <Badge variant="outline" className="text-xs px-1 py-0 h-4 shrink-0">{student.class_code}</Badge>}
                    </Link>
                    <span className="text-sm font-medium shrink-0">{hours.toFixed(1)}u</span>
                    {pendingLeaveMap[student.id] ? (
                      <Badge variant="outline" className="text-xs text-orange-500 border-orange-200 shrink-0">{pendingLeaveMap[student.id]} verlof</Badge>
                    ) : null}
                  </div>
                  <div className="ml-7 h-1.5 rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full rounded-full bg-[#ffd100] transition-all"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      <div className="grid sm:grid-cols-3 gap-3 text-sm">
        <Card>
          <CardContent className="pt-4 pb-3">
            <p className="text-xs text-muted-foreground mb-1">Gemiddeld uren/week</p>
            <p className="text-2xl font-bold">
              {sorted.length > 0
                ? (Object.values(weeklyHoursMap).reduce((a, b) => a + b, 0) / sorted.length).toFixed(1)
                : '0'}u
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3">
            <p className="text-xs text-muted-foreground mb-1">Meeste uren</p>
            <p className="text-2xl font-bold">{Math.max(...Object.values(weeklyHoursMap), 0).toFixed(1)}u</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3">
            <p className="text-xs text-muted-foreground mb-1">Open verlofaanvragen</p>
            <p className="text-2xl font-bold text-orange-500">{(pendingLeave || []).length}</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

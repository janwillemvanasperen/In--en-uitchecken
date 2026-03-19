// @ts-nocheck
import { requireVerzuim } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase/server'
import { SchedulePushForm } from '@/components/admin/schedule-push-form'
import { AutoApplyButton } from '@/components/admin/auto-apply-button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Send, CheckCircle2, Clock } from 'lucide-react'

export const dynamic = 'force-dynamic'

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString('nl-NL', { day: 'numeric', month: 'long', year: 'numeric' })
}

export default async function VerzuimSchedulePushPage() {
  await requireVerzuim()
  const adminClient = createAdminClient()

  const [{ data: students }, { data: pushRequests }] = await Promise.all([
    adminClient
      .from('users')
      .select('id, full_name, email, coach_id, coaches!users_coach_id_fkey(name)')
      .eq('role', 'student')
      .order('full_name'),
    adminClient
      .from('schedule_push_requests')
      .select('id, valid_from, valid_until, message, created_at, users!schedule_push_requests_created_by_fkey(full_name)')
      .order('created_at', { ascending: false })
      .limit(20),
  ])

  const pushIds = (pushRequests || []).map((p: any) => p.id)
  const { data: recipientStats } = pushIds.length > 0
    ? await adminClient.from('schedule_push_recipients').select('push_request_id, responded').in('push_request_id', pushIds)
    : { data: [] }

  const statsMap: Record<string, { total: number; responded: number }> = {}
  for (const r of recipientStats || []) {
    if (!statsMap[r.push_request_id]) statsMap[r.push_request_id] = { total: 0, responded: 0 }
    statsMap[r.push_request_id].total++
    if (r.responded) statsMap[r.push_request_id].responded++
  }

  const studentsForForm = (students || []).map((s: any) => ({
    id: s.id, full_name: s.full_name, email: s.email, coach_name: s.coaches?.name ?? null,
  }))

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Roosterpush</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Stuur studenten een verzoek om hun rooster in te vullen voor een bepaalde periode.
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-2 items-start">
        <SchedulePushForm students={studentsForForm} />

        <div className="space-y-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Send className="h-4 w-4" />
            Verstuurde pushes
          </h2>
          {(pushRequests || []).length === 0 && (
            <Card>
              <CardContent className="py-8 text-center text-sm text-muted-foreground">
                Nog geen pushes verstuurd.
              </CardContent>
            </Card>
          )}
          {(pushRequests || []).map((p: any) => {
            const stats = statsMap[p.id] ?? { total: 0, responded: 0 }
            const allDone = stats.total > 0 && stats.responded === stats.total
            return (
              <Card key={p.id}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    {allDone ? <CheckCircle2 className="h-4 w-4 text-green-600" /> : <Clock className="h-4 w-4 text-orange-500" />}
                    {fmtDate(p.valid_from)} — {fmtDate(p.valid_until)}
                    <Badge variant={allDone ? 'default' : 'secondary'} className={allDone ? 'bg-green-100 text-green-800 ml-auto' : 'ml-auto'}>
                      {stats.responded}/{stats.total} ingediend
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0 space-y-2">
                  {p.message && <p className="text-sm text-muted-foreground italic">&quot;{p.message}&quot;</p>}
                  <p className="text-xs text-muted-foreground">
                    Verstuurd door {p.users?.full_name ?? '—'} op{' '}
                    {new Date(p.created_at).toLocaleDateString('nl-NL', { day: 'numeric', month: 'long' })}
                  </p>
                  <AutoApplyButton pushRequestId={p.id} notRespondedCount={stats.total - stats.responded} />
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>
    </div>
  )
}

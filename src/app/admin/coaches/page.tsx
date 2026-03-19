// @ts-nocheck
import { requireAdmin } from '@/lib/auth'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { CoachList } from '@/components/admin/coach-list'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function AdminCoachesPage() {
  await requireAdmin()
  const supabase = await createClient()
  const adminClient = createAdminClient()

  const [{ data: coaches }, { data: coachUsers }, { data: studentUsers }, { data: scheduleRows }] = await Promise.all([
    supabase.from('coaches').select('*').order('name'),
    supabase.from('users').select('id, full_name').contains('roles', ['coach']).order('full_name'),
    supabase.from('users').select('coach_id').eq('role', 'student').not('coach_id', 'is', null),
    adminClient.from('coach_schedules').select('coach_id, day_of_week, start_time, end_time'),
  ])

  const studentCounts: Record<string, number> = {}
  for (const u of studentUsers || []) {
    if (u.coach_id) {
      studentCounts[u.coach_id] = (studentCounts[u.coach_id] || 0) + 1
    }
  }

  const coachSchedules: Record<string, { day_of_week: number; start_time: string; end_time: string }[]> = {}
  for (const row of scheduleRows || []) {
    if (!coachSchedules[row.coach_id]) coachSchedules[row.coach_id] = []
    coachSchedules[row.coach_id].push({ day_of_week: row.day_of_week, start_time: row.start_time, end_time: row.end_time })
  }

  return (
    <>
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex items-center gap-4">
          <Link href="/admin/dashboard">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Terug
            </Button>
          </Link>
          <h1 className="text-2xl font-bold">Coaches</h1>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <CoachList coaches={coaches || []} studentCounts={studentCounts} coachUsers={coachUsers || []} coachSchedules={coachSchedules} />
      </main>
</>
  )
}

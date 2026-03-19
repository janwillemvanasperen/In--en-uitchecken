// @ts-nocheck
import { requireVerzuim } from '@/lib/auth'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { CheckInList } from '@/components/admin/check-in-list'

export const dynamic = 'force-dynamic'

export default async function VerzuimCheckInsPage() {
  await requireVerzuim()
  const supabase = await createClient()
  const adminClient = createAdminClient()

  const [{ data: checkIns }, { data: coaches }, { data: usersData }] = await Promise.all([
    adminClient.from('check_ins').select('*, users!check_ins_user_id_fkey(full_name), locations!check_ins_location_id_fkey(name)').order('check_in_time', { ascending: false }).limit(500),
    supabase.from('coaches').select('*').eq('active', true).order('name'),
    supabase.from('users').select('id, coach_id').eq('role', 'student'),
  ])

  const userCoachMap: Record<string, string | null> = {}
  for (const u of usersData || []) {
    userCoachMap[u.id] = u.coach_id || null
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold">Aanwezigheid</h1>
      <CheckInList checkIns={checkIns || []} coaches={coaches || []} userCoachMap={userCoachMap} />
    </div>
  )
}

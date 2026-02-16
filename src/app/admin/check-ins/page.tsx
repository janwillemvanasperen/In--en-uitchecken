// @ts-nocheck
import { requireAdmin } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { CheckInList } from '@/components/admin/check-in-list'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function AdminCheckInsPage() {
  await requireAdmin()
  const supabase = await createClient()

  const [{ data: checkIns }, { data: coaches }, { data: usersData }] = await Promise.all([
    supabase.from('check_ins').select('*, users!check_ins_user_id_fkey(full_name), locations!check_ins_location_id_fkey(name)').order('check_in_time', { ascending: false }).limit(500),
    supabase.from('coaches').select('*').eq('active', true).order('name'),
    supabase.from('users').select('id, coach_id').eq('role', 'student'),
  ])

  const userCoachMap: Record<string, string | null> = {}
  for (const u of usersData || []) {
    userCoachMap[u.id] = u.coach_id || null
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex items-center gap-4">
          <Link href="/admin/dashboard">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Terug
            </Button>
          </Link>
          <h1 className="text-2xl font-bold">Aanwezigheid</h1>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <CheckInList checkIns={checkIns || []} coaches={coaches || []} userCoachMap={userCoachMap} />
      </main>
    </div>
  )
}

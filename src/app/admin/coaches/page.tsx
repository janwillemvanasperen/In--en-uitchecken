// @ts-nocheck
import { requireAdmin } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { CoachList } from '@/components/admin/coach-list'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function AdminCoachesPage() {
  await requireAdmin()
  const supabase = await createClient()

  const { data: coaches } = await supabase
    .from('coaches')
    .select('*')
    .order('name')

  // Count students per coach
  const { data: users } = await supabase
    .from('users')
    .select('coach_id')
    .eq('role', 'student')
    .not('coach_id', 'is', null)

  const studentCounts: Record<string, number> = {}
  for (const u of users || []) {
    if (u.coach_id) {
      studentCounts[u.coach_id] = (studentCounts[u.coach_id] || 0) + 1
    }
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
          <h1 className="text-2xl font-bold">Coaches</h1>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <CoachList coaches={coaches || []} studentCounts={studentCounts} />
      </main>
    </div>
  )
}

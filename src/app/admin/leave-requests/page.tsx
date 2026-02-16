// @ts-nocheck
import { requireAdmin } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { LeaveRequestList } from '@/components/admin/leave-request-list'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function AdminLeaveRequestsPage() {
  await requireAdmin()
  const supabase = await createClient()

  const { data: leaveRequests } = await supabase
    .from('leave_requests')
    .select('*, users!leave_requests_user_id_fkey(full_name)')
    .order('created_at', { ascending: false })

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
          <h1 className="text-2xl font-bold">Verlofaanvragen</h1>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <LeaveRequestList leaveRequests={leaveRequests || []} />
      </main>
    </div>
  )
}

import { requireStudent } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { LeaveRequestForm } from '@/components/student/leave-request-form'
import { LeaveRequestsList } from '@/components/student/leave-requests-list'

export default async function LeaveRequestsPage() {
  const user = await requireStudent()
  const supabase = await createClient()

  // Fetch all leave requests for this student
  const { data: leaveRequests } = await supabase
    .from('leave_requests')
    .select('*')
    .eq('user_id', user.id)
    .order('date', { ascending: false })

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4">
          <h1 className="text-2xl font-bold">Verlofaanvragen</h1>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Form to create new leave request */}
          <div>
            <LeaveRequestForm />
          </div>

          {/* List of existing leave requests */}
          <div>
            <LeaveRequestsList requests={leaveRequests || []} />
          </div>
        </div>
      </main>
    </div>
  )
}

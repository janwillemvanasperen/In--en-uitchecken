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
    <div className="max-w-4xl mx-auto">
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
    </div>
  )
}

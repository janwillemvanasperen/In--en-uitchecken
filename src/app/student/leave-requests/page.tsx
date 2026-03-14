import { requireStudent } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { LeaveRequestForm } from '@/components/student/leave-request-form'
import { LeaveRequestsList } from '@/components/student/leave-requests-list'

export default async function LeaveRequestsPage() {
  const user = await requireStudent()
  const supabase = await createClient()

  const [{ data: leaveRequests }, { data: schedules }] = await Promise.all([
    supabase
      .from('leave_requests')
      .select('*')
      .eq('user_id', user.id)
      .order('date', { ascending: false }),
    supabase
      .from('schedules')
      .select('day_of_week, start_time, end_time, valid_from, valid_until')
      .eq('user_id', user.id)
      .eq('status', 'approved')
      .order('valid_from', { ascending: false }),
  ])

  return (
    <div className="max-w-4xl mx-auto">
      <div className="grid gap-6 lg:grid-cols-2">
        <div>
          <LeaveRequestForm schedules={schedules || []} />
        </div>
        <div>
          <LeaveRequestsList requests={leaveRequests || []} />
        </div>
      </div>
    </div>
  )
}

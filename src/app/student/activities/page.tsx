// @ts-nocheck
import { requireStudent } from '@/lib/auth'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { StudentActivitiesView } from '@/components/activities/student-activities-view'
import { signUpForActivity, cancelActivitySignup } from './actions'
import type { Activity } from '@/components/calendar/types'

export const dynamic = 'force-dynamic'

export default async function StudentActivitiesPage() {
  const user = await requireStudent()
  const supabase = await createClient()
  const adminSupabase = createAdminClient()

  // Fetch all active activities
  const { data: activitiesRaw } = await adminSupabase
    .from('activities')
    .select('*')
    .eq('status', 'active')
    .order('activity_date', { ascending: true })

  // Fetch this student's signups
  const { data: mySignups } = await supabase
    .from('activity_signups')
    .select('activity_id')

  const mySignupSet = new Set((mySignups ?? []).map((s: any) => s.activity_id))

  // Fetch signup counts per activity (using admin client)
  const activityIds = (activitiesRaw ?? []).map((a: any) => a.id)
  let countsByActivity: Record<string, number> = {}

  if (activityIds.length > 0) {
    const { data: countsRaw } = await adminSupabase
      .from('activity_signups')
      .select('activity_id')
      .in('activity_id', activityIds)

    for (const row of (countsRaw ?? [])) {
      countsByActivity[row.activity_id] = (countsByActivity[row.activity_id] ?? 0) + 1
    }
  }

  const activities: Activity[] = (activitiesRaw ?? []).map((a: any) => ({
    ...a,
    signup_count: countsByActivity[a.id] ?? 0,
    is_signed_up: mySignupSet.has(a.id),
  }))

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Activiteiten</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Schrijf je in voor activiteiten. Inschrijvingen verschijnen automatisch in je agenda.
        </p>
      </div>
      <StudentActivitiesView
        activities={activities}
        onSignUp={signUpForActivity}
        onCancel={cancelActivitySignup}
      />
    </div>
  )
}

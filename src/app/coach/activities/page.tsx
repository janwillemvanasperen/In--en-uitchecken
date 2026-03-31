// @ts-nocheck
import { requireCoach } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase/server'
import { CoachActivitiesView } from '@/components/activities/coach-activities-view'
import { createActivity, deleteActivity, cancelActivity } from './actions'

export const dynamic = 'force-dynamic'

export default async function CoachActivitiesPage() {
  await requireCoach()
  const adminSupabase = createAdminClient()

  const { data: activitiesRaw } = await adminSupabase
    .from('activities')
    .select('*')
    .order('activity_date', { ascending: false })

  const activityIds = (activitiesRaw ?? []).map((a: any) => a.id)

  let signupsByActivity: Record<string, { student_id: string; full_name: string; signed_up_at: string }[]> = {}

  if (activityIds.length > 0) {
    const { data: signupsRaw } = await adminSupabase
      .from('activity_signups')
      .select('activity_id, student_id, signed_up_at')
      .in('activity_id', activityIds)
      .order('signed_up_at', { ascending: true })

    const studentIds = [...new Set((signupsRaw ?? []).map((s: any) => s.student_id))]
    const { data: studentsRaw } = studentIds.length > 0
      ? await adminSupabase.from('users').select('id, full_name').in('id', studentIds)
      : { data: [] }

    const studentNameMap: Record<string, string> = Object.fromEntries(
      (studentsRaw ?? []).map((u: any) => [u.id, u.full_name])
    )

    for (const signup of (signupsRaw ?? [])) {
      if (!signupsByActivity[signup.activity_id]) signupsByActivity[signup.activity_id] = []
      signupsByActivity[signup.activity_id].push({
        student_id: signup.student_id,
        full_name: studentNameMap[signup.student_id] ?? 'Onbekend',
        signed_up_at: signup.signed_up_at,
      })
    }
  }

  const activities = (activitiesRaw ?? []).map((a: any) => ({
    ...a,
    signup_count: (signupsByActivity[a.id] ?? []).length,
    signups: signupsByActivity[a.id] ?? [],
  }))

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Activiteiten</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Beheer activiteiten en bekijk inschrijvingen van alle studenten.
        </p>
      </div>
      <CoachActivitiesView
        activities={activities}
        onCreateActivity={createActivity}
        onDeleteActivity={deleteActivity}
        onCancelActivity={cancelActivity}
      />
    </div>
  )
}

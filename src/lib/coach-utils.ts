// @ts-nocheck
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/server'

export type CoachView = 'mijn-studenten' | 'mijn-klas' | 'alle'

export function getCoachView(searchParams: { view?: string } | undefined): CoachView {
  const v = searchParams?.view
  if (v === 'mijn-klas' || v === 'alle') return v
  return 'mijn-studenten'
}

/**
 * Returns the coaches.id (entity ID) for a given auth user ID.
 * Uses admin client to bypass RLS on coaches table.
 */
export async function getCoachEntityId(authUserId: string): Promise<string | null> {
  const adminClient = createAdminClient()
  const { data } = await adminClient
    .from('coaches')
    .select('id')
    .eq('user_id', authUserId)
    .single()
  return data?.id || null
}

/**
 * Returns the student IDs visible to a coach based on their view level.
 * null = no filter (all students)
 * [] = no students found
 */
export async function getStudentIdsForView(
  coachUserId: string,
  view: CoachView
): Promise<string[] | null> {
  if (view === 'alle') return null

  const coachEntityId = await getCoachEntityId(coachUserId)
  if (!coachEntityId) return []

  const supabase = await createClient()

  if (view === 'mijn-studenten') {
    const { data: students } = await supabase
      .from('users')
      .select('id')
      .eq('role', 'student')
      .eq('coach_id', coachEntityId)
    return (students || []).map((s: any) => s.id)
  }

  if (view === 'mijn-klas') {
    const { data: myStudents } = await supabase
      .from('users')
      .select('class_code')
      .eq('role', 'student')
      .eq('coach_id', coachEntityId)
      .not('class_code', 'is', null)

    const myClassCodes = Array.from(new Set((myStudents || []).map((s: any) => s.class_code as string)))
    if (myClassCodes.length === 0) return []

    const { data: allStudents } = await supabase
      .from('users')
      .select('id')
      .eq('role', 'student')
      .in('class_code', myClassCodes)
    return (allStudents || []).map((s: any) => s.id)
  }

  return []
}

import { createClient } from '@/lib/supabase/server'

export type CoachView = 'mijn-studenten' | 'mijn-klas' | 'alle'

export function getCoachView(searchParams: { view?: string } | undefined): CoachView {
  const v = searchParams?.view
  if (v === 'mijn-klas' || v === 'alle') return v
  return 'mijn-studenten'
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
  const supabase = await createClient()

  if (view === 'alle') return null

  // Fetch all students with their coach's user_id
  const { data: students } = await supabase
    .from('users')
    .select('id, class_code, coaches!users_coach_id_fkey(user_id)')
    .eq('role', 'student')

  if (!students) return []

  if (view === 'mijn-studenten') {
    return students
      .filter((u: any) => u.coaches?.user_id === coachUserId)
      .map((u: any) => u.id)
  }

  if (view === 'mijn-klas') {
    const myClassCodes = [
      ...new Set(
        students
          .filter((u: any) => u.coaches?.user_id === coachUserId && u.class_code)
          .map((u: any) => u.class_code as string)
      ),
    ]
    if (myClassCodes.length === 0) return []
    return students
      .filter((u: any) => myClassCodes.includes(u.class_code))
      .map((u: any) => u.id)
  }

  return []
}

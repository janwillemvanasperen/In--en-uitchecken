// @ts-nocheck
import { requireAdmin } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { StudentGoalsEditor } from '@/components/admin/student-goals-editor'
import { GoalNamesEditor } from '@/components/admin/goal-names-editor'

export const dynamic = 'force-dynamic'

export default async function AdminDevelopmentGoalsPage() {
  await requireAdmin()
  const adminClient = createAdminClient()

  const [{ data: students }, { data: goalNames }, { data: devGoals }] = await Promise.all([
    adminClient
      .from('users')
      .select('id, full_name, class_code, coach_id')
      .eq('role', 'student')
      .order('full_name'),
    adminClient
      .from('development_goal_names')
      .select('goal_number, goal_name, description, active')
      .order('goal_number'),
    adminClient
      .from('student_development_goals')
      .select('student_id, goal_1_phase, goal_2_phase, goal_3_phase, goal_4_phase, goal_5_phase, goal_6_phase'),
  ])

  const goalNamesWithDefaults = Array.from({ length: 6 }, (_, i) => {
    const found = (goalNames || []).find((gn: any) => gn.goal_number === i + 1)
    return found || { goal_number: i + 1, goal_name: `Doel ${i + 1}`, description: null, active: true }
  })

  const devGoalsMap: Record<string, any> = {}
  for (const dg of devGoals || []) {
    devGoalsMap[dg.student_id] = dg
  }

  const studentsWithGoals = (students || []).map((s: any) => {
    const dg = devGoalsMap[s.id]
    return {
      ...s,
      goal_phases: [
        dg?.goal_1_phase ?? 0,
        dg?.goal_2_phase ?? 0,
        dg?.goal_3_phase ?? 0,
        dg?.goal_4_phase ?? 0,
        dg?.goal_5_phase ?? 0,
        dg?.goal_6_phase ?? 0,
      ] as [number, number, number, number, number, number],
    }
  })

  return (
    <div className="container mx-auto px-4 py-6 space-y-6 max-w-6xl">
      <h1 className="text-xl font-bold">Ontwikkeldoelen beheren</h1>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Doelnamen</CardTitle>
        </CardHeader>
        <CardContent>
          <GoalNamesEditor goalNames={goalNamesWithDefaults} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Studentdoelen — {studentsWithGoals.length} studenten</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <StudentGoalsEditor students={studentsWithGoals} goalNames={goalNamesWithDefaults} />
        </CardContent>
      </Card>
    </div>
  )
}

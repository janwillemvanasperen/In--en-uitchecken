import { GoalPhaseCircle } from '@/components/shared/goal-phase-circle'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

const PHASE_LABELS = ['Onbekend', 'Oriëntatie', 'Ontwikkeling', 'Beheersing', 'Expert']

interface GoalName {
  goal_number: number
  goal_name: string
  description: string | null
}

interface Props {
  goalPhases: [number, number, number, number, number, number]
  goalNames: GoalName[]
}

export function DevelopmentGoalsCard({ goalPhases, goalNames }: Props) {
  const hasAnyGoal = goalPhases.some(p => p > 0)

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm">Mijn Ontwikkeling</CardTitle>
      </CardHeader>
      <CardContent>
        {!hasAnyGoal ? (
          <p className="text-sm text-muted-foreground">Nog geen doelen ingesteld door je coach.</p>
        ) : (
          <div className="space-y-3">
            {goalNames.map((gn, i) => (
              <div key={gn.goal_number} className="flex items-center gap-3">
                <GoalPhaseCircle phase={goalPhases[i]} goalName={gn.goal_name} description={gn.description} size="md" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{gn.goal_name}</p>
                  <p className="text-xs text-muted-foreground">{PHASE_LABELS[goalPhases[i]]}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

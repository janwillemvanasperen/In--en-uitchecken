import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { TrendingUp } from 'lucide-react'

interface WeeklyProgressCardProps {
  weeklyHours: number
  targetHours?: number
}

export function WeeklyProgressCard({ weeklyHours, targetHours = 16 }: WeeklyProgressCardProps) {
  const percentage = Math.min((weeklyHours / targetHours) * 100, 100)

  // Determine color based on percentage
  let progressColor = 'bg-red-500'
  if (percentage >= 80) {
    progressColor = 'bg-green-500'
  } else if (percentage >= 50) {
    progressColor = 'bg-yellow-500'
  }

  let textColor = 'text-red-600'
  if (percentage >= 80) {
    textColor = 'text-green-600'
  } else if (percentage >= 50) {
    textColor = 'text-yellow-600'
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          Weekvoortgang
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="flex items-baseline gap-2">
            <span className={`text-3xl font-bold ${textColor}`}>
              {weeklyHours.toFixed(1)}
            </span>
            <span className="text-muted-foreground">van {targetHours} uur</span>
          </div>

          <Progress
            value={percentage}
            className="h-3"
            indicatorClassName={progressColor}
          />

          <p className="text-xs text-muted-foreground">
            {percentage >= 100 ? (
              <span className="text-green-600 font-medium">
                🎉 Doelbereikt! Je hebt deze week voldoende uren gemaakt.
              </span>
            ) : percentage >= 80 ? (
              <span className="text-green-600 font-medium">
                Bijna daar! Nog {(targetHours - weeklyHours).toFixed(1)} uur te gaan.
              </span>
            ) : percentage >= 50 ? (
              <span className="text-yellow-600 font-medium">
                Op schema. Nog {(targetHours - weeklyHours).toFixed(1)} uur te gaan.
              </span>
            ) : (
              <span className="text-red-600 font-medium">
                Let op! Nog {(targetHours - weeklyHours).toFixed(1)} uur te gaan om je doel te halen.
              </span>
            )}
          </p>
        </div>
      </CardContent>
    </Card>
  )
}

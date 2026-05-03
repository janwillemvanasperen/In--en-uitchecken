import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { MessageSquare, TrendingUp } from 'lucide-react'
import Link from 'next/link'

const PHASE_LABELS = ['Nog niet begonnen', 'Fase 1', 'Fase 2', 'Fase 3', 'Afgerond']

interface FeedbackRow {
  id: string
  feedback_text: string
  created_at: string
  portfolio_items: {
    title: string
    goal_number: number
  } | null
}

interface AssessmentRow {
  id: string
  goal_number: number
  phase_assessed: number
  result: string
  created_at: string
  goal_name?: string
}

interface Props {
  recentFeedback: FeedbackRow[]
  recentAssessments: AssessmentRow[]
}

const resultColors: Record<string, string> = {
  onvoldoende: 'bg-red-100 text-red-700',
  voldoende: 'bg-green-100 text-green-700',
  goed: 'bg-blue-100 text-blue-700',
}

const resultLabels: Record<string, string> = {
  onvoldoende: 'Onvoldoende',
  voldoende: 'Voldoende',
  goed: 'Goed',
}

export function PortfolioActivityCard({ recentFeedback, recentAssessments }: Props) {
  const hasFeedback = recentFeedback.length > 0
  const hasAssessments = recentAssessments.length > 0

  if (!hasFeedback && !hasAssessments) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Portfolio activiteit</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Nog geen feedback of beoordelingen.{' '}
            <Link href="/student/portfolio" className="text-primary underline underline-offset-2">Voeg bewijs toe</Link>{' '}
            om feedback te ontvangen.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="grid md:grid-cols-2 gap-4">
      {/* Feedback */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
              Recente feedback
            </CardTitle>
            <Link href="/student/portfolio" className="text-xs text-primary hover:underline">
              Bekijk portfolio
            </Link>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {hasFeedback ? (
            recentFeedback.map((fb) => (
              <div key={fb.id} className="space-y-1">
                <p className="text-xs text-muted-foreground">
                  Doel {fb.portfolio_items?.goal_number} · {fb.portfolio_items?.title}
                </p>
                <p className="text-sm line-clamp-2">{fb.feedback_text}</p>
                <p className="text-xs text-muted-foreground">
                  {new Date(fb.created_at).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' })}
                </p>
                <div className="border-b last:border-0 pb-2 last:pb-0" />
              </div>
            ))
          ) : (
            <p className="text-sm text-muted-foreground">Nog geen feedback ontvangen.</p>
          )}
        </CardContent>
      </Card>

      {/* Assessments */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
              Beoordelingen
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {hasAssessments ? (
            recentAssessments.map((a) => (
              <div key={a.id} className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{a.goal_name ?? `Doel ${a.goal_number}`}</p>
                  <p className="text-xs text-muted-foreground">
                    Fase {a.phase_assessed}: {PHASE_LABELS[a.phase_assessed] ?? '–'} ·{' '}
                    {new Date(a.created_at).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' })}
                  </p>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded font-medium shrink-0 ${resultColors[a.result] ?? 'bg-gray-100 text-gray-700'}`}>
                  {resultLabels[a.result] ?? a.result}
                </span>
              </div>
            ))
          ) : (
            <p className="text-sm text-muted-foreground">Nog geen beoordelingen ontvangen.</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

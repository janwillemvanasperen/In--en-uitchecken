'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { MessageSquare, Star, ChevronDown, ChevronUp, ExternalLink, ClipboardCheck } from 'lucide-react'
import { GoalPhaseCircle } from '@/components/shared/goal-phase-circle'
import { PortfolioFeedbackModal } from './portfolio-feedback-modal'
import { PortfolioAssessModal } from './portfolio-assess-modal'

const PHASE_LABELS = ['Onbekend', 'Oriëntatie', 'Ontwikkeling', 'Beheersing', 'Expert']

interface FeedbackItem {
  id: string
  feedback_text: string
  created_at: string
}

interface PortfolioItem {
  id: string
  title: string
  description: string | null
  link_url: string | null
  created_at: string
  portfolio_feedback: FeedbackItem[]
}

interface GoalData {
  goal_number: number
  goal_name: string
  description: string | null
  phase: number
  items: PortfolioItem[]
}

interface Props {
  goals: GoalData[]
  onFeedback: (itemId: string, feedbackText: string) => Promise<{ error?: string }>
  onAssess: (
    goalNumber: number,
    phaseAssessed: number,
    result: 'onvoldoende' | 'voldoende' | 'goed',
    notes?: string
  ) => Promise<{ error?: string }>
}

function PortfolioItemRow({
  item,
  onFeedback,
}: {
  item: PortfolioItem
  onFeedback: (itemId: string, feedbackText: string) => Promise<{ error?: string }>
}) {
  const [expanded, setExpanded] = useState(false)
  const [feedbackOpen, setFeedbackOpen] = useState(false)

  const date = new Date(item.created_at).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' })

  return (
    <Card className="border-l-4 border-l-muted">
      <CardContent className="p-3 space-y-2">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="text-sm font-medium truncate">{item.title}</p>
              {item.portfolio_feedback.length > 0 && (
                <Badge variant="secondary" className="text-xs shrink-0">
                  <MessageSquare className="h-3 w-3 mr-1" />
                  {item.portfolio_feedback.length} feedback
                </Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground">{date}</p>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            {item.link_url && (
              <a href={item.link_url} target="_blank" rel="noopener noreferrer">
                <Button variant="ghost" size="icon" className="h-7 w-7">
                  <ExternalLink className="h-3.5 w-3.5" />
                </Button>
              </a>
            )}
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setExpanded(!expanded)}>
              {expanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-7 text-xs gap-1"
              onClick={() => setFeedbackOpen(true)}
            >
              <MessageSquare className="h-3 w-3" />
              Feedback
            </Button>
          </div>
        </div>

        {expanded && (
          <div className="space-y-3 pt-1 border-t">
            {item.description && (
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">{item.description}</p>
            )}
            {item.portfolio_feedback.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Eerder gegeven feedback</p>
                {item.portfolio_feedback.map((fb) => (
                  <div key={fb.id} className="rounded-md bg-muted px-3 py-2">
                    <p className="text-sm">{fb.feedback_text}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {new Date(fb.created_at).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </CardContent>

      <PortfolioFeedbackModal
        open={feedbackOpen}
        onClose={() => setFeedbackOpen(false)}
        itemTitle={item.title}
        onSubmit={(text) => onFeedback(item.id, text)}
      />
    </Card>
  )
}

function GoalSection({
  goal,
  onFeedback,
  onAssess,
}: {
  goal: GoalData
  onFeedback: (itemId: string, feedbackText: string) => Promise<{ error?: string }>
  onAssess: Props['onAssess']
}) {
  const [assessOpen, setAssessOpen] = useState(false)
  const phase = goal.phase
  const phaseLabel = PHASE_LABELS[phase] ?? 'Onbekend'
  const canAdvance = phase < 4

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <GoalPhaseCircle phase={phase} goalName={goal.goal_name} description={goal.description} size="md" />
            <div className="min-w-0">
              <p className="font-medium truncate">{goal.goal_name}</p>
              <Badge variant="outline" className="text-xs mt-0.5">{phaseLabel}</Badge>
            </div>
          </div>
          {canAdvance && goal.items.length > 0 && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => setAssessOpen(true)}
              className="shrink-0 gap-1"
            >
              <ClipboardCheck className="h-4 w-4" />
              Beoordelen
            </Button>
          )}
        </div>
      </CardHeader>

      {goal.items.length > 0 ? (
        <CardContent className="pt-0 space-y-2">
          {goal.items.map((item) => (
            <PortfolioItemRow key={item.id} item={item} onFeedback={onFeedback} />
          ))}
        </CardContent>
      ) : (
        <CardContent className="pt-0">
          <p className="text-sm text-muted-foreground">Nog geen bewijs ingediend.</p>
        </CardContent>
      )}

      <PortfolioAssessModal
        open={assessOpen}
        onClose={() => setAssessOpen(false)}
        goalName={goal.goal_name}
        goalNumber={goal.goal_number}
        currentPhase={phase}
        phaseLabel={phaseLabel}
        onSubmit={(goalNumber, phaseAssessed, result, notes) =>
          onAssess(goalNumber, phaseAssessed, result, notes)
        }
      />
    </Card>
  )
}

export function PortfolioTab({ goals, onFeedback, onAssess }: Props) {
  const totalItems = goals.reduce((sum, g) => sum + g.items.length, 0)
  const itemsWithoutFeedback = goals
    .flatMap((g) => g.items)
    .filter((i) => i.portfolio_feedback.length === 0).length

  return (
    <div className="space-y-4">
      {totalItems > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <div className="p-3 rounded-lg border bg-card text-sm">
            <p className="text-xs text-muted-foreground">Totaal bewijs</p>
            <p className="text-2xl font-bold mt-1">{totalItems}</p>
          </div>
          <div className="p-3 rounded-lg border bg-card text-sm">
            <p className="text-xs text-muted-foreground">Wacht op feedback</p>
            <p className={`text-2xl font-bold mt-1 ${itemsWithoutFeedback > 0 ? 'text-orange-600' : ''}`}>
              {itemsWithoutFeedback}
            </p>
          </div>
          <div className="p-3 rounded-lg border bg-card text-sm">
            <p className="text-xs text-muted-foreground">Doelen actief</p>
            <p className="text-2xl font-bold mt-1">{goals.filter((g) => g.items.length > 0).length}</p>
          </div>
        </div>
      )}

      {goals.map((goal) => (
        <GoalSection key={goal.goal_number} goal={goal} onFeedback={onFeedback} onAssess={onAssess} />
      ))}
    </div>
  )
}

'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { MessageSquare, ChevronDown, ChevronUp, ExternalLink, ClipboardCheck, CheckCircle2, CalendarClock } from 'lucide-react'
import { GoalPhaseCircle } from '@/components/shared/goal-phase-circle'
import { PortfolioFeedbackModal } from './portfolio-feedback-modal'
import { PortfolioAssessModal } from './portfolio-assess-modal'

type Score = 'onvoldoende' | 'voldoende' | 'goed'

interface RubricCriterion {
  id: string
  goal_number: number
  phase: number
  criterion_text: string
  description_insufficient: string
  description_sufficient: string
  description_good: string
  sort_order: number
}

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
  phase: number
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

interface ReviewRequest {
  id: string
  student_notes: string | null
  self_scores: { criterion_id: string; score: Score }[]
  slot: { date: string; start_time: string; duration_minutes: number } | null
}

interface Props {
  goals: GoalData[]
  rubricCriteria: RubricCriterion[]
  reviewRequestsByKey: Record<string, ReviewRequest>
  onFeedback: (itemId: string, feedbackText: string) => Promise<{ error?: string }>
  onAssess: (
    goalNumber: number,
    phaseAssessed: number,
    scores: { criterion_id: string; score: Score }[],
    notes?: string,
    reviewRequestId?: string
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

  const date = new Date(item.created_at).toLocaleDateString('nl-NL', {
    day: 'numeric',
    month: 'short',
  })

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
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => setExpanded(!expanded)}
            >
              {expanded ? (
                <ChevronUp className="h-3.5 w-3.5" />
              ) : (
                <ChevronDown className="h-3.5 w-3.5" />
              )}
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
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Eerder gegeven feedback
                </p>
                {item.portfolio_feedback.map((fb) => (
                  <div key={fb.id} className="rounded-md bg-muted px-3 py-2">
                    <p className="text-sm">{fb.feedback_text}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {new Date(fb.created_at).toLocaleDateString('nl-NL', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
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

function PhaseSection({
  phaseNum,
  items,
  isPassed,
  isNext,
  criteria,
  reviewRequest,
  goalNumber,
  goalName,
  onFeedback,
  onAssess,
}: {
  phaseNum: number
  items: PortfolioItem[]
  isPassed: boolean
  isNext: boolean
  criteria: RubricCriterion[]
  reviewRequest: ReviewRequest | null
  goalNumber: number
  goalName: string
  onFeedback: Props['onFeedback']
  onAssess: Props['onAssess']
}) {
  const [open, setOpen] = useState(isNext || !!reviewRequest || (isPassed && items.length > 0))
  const [assessOpen, setAssessOpen] = useState(false)

  const canAssess = isNext && items.length > 0 && criteria.length > 0

  return (
    <div
      className={`rounded-lg border ${
        isPassed ? 'border-green-200 bg-green-50/40' : isNext ? 'border-primary/40 bg-primary/5' : 'border-border'
      }`}
    >
      <button
        type="button"
        className="w-full flex items-center justify-between px-4 py-3 text-left"
        onClick={() => setOpen(!open)}
      >
        <div className="flex items-center gap-3 min-w-0">
          {isPassed ? (
            <CheckCircle2 className="h-5 w-5 text-green-600 shrink-0" />
          ) : (
            <GoalPhaseCircle phase={isNext ? phaseNum : 0} size="sm" />
          )}
          <span className={`text-sm font-medium ${isPassed ? 'text-green-700' : ''}`}>
            Fase {phaseNum}{isPassed ? ' — beoordeeld' : ''}
          </span>
          {items.length > 0 && (
            <span className="text-xs text-muted-foreground shrink-0">({items.length})</span>
          )}
          {reviewRequest && (
            <Badge className="text-[10px] bg-[#ffd100] text-black shrink-0">
              <CalendarClock className="h-3 w-3 mr-1" />
              Gesprek aangevraagd
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {canAssess && (
            <Button
              size="sm"
              variant="outline"
              onClick={(e) => {
                e.stopPropagation()
                setAssessOpen(true)
              }}
              className="h-7 text-xs gap-1"
            >
              <ClipboardCheck className="h-3.5 w-3.5" />
              Beoordelen
            </Button>
          )}
          {open ? (
            <ChevronUp className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          )}
        </div>
      </button>

      {open && (
        <div className="px-4 pb-4 space-y-2">
          {items.length > 0 ? (
            items.map((item) => (
              <PortfolioItemRow key={item.id} item={item} onFeedback={onFeedback} />
            ))
          ) : (
            <p className="text-sm text-muted-foreground">Nog geen bewijs voor fase {phaseNum}.</p>
          )}
        </div>
      )}

      <PortfolioAssessModal
        open={assessOpen}
        onClose={() => setAssessOpen(false)}
        goalName={goalName}
        goalNumber={goalNumber}
        phaseToAssess={phaseNum}
        criteria={criteria}
        reviewRequest={reviewRequest}
        onSubmit={(goalNum, phase, scores, notes, reviewRequestId) =>
          onAssess(goalNum, phase, scores, notes, reviewRequestId)
        }
      />
    </div>
  )
}

function GoalSection({
  goal,
  rubricCriteria,
  reviewRequestsByKey,
  onFeedback,
  onAssess,
}: {
  goal: GoalData
  rubricCriteria: RubricCriterion[]
  reviewRequestsByKey: Record<string, ReviewRequest>
  onFeedback: Props['onFeedback']
  onAssess: Props['onAssess']
}) {
  const phase = goal.phase

  // Group items by phase
  const itemsByPhase: Record<number, PortfolioItem[]> = {}
  for (const item of goal.items) {
    const p = item.phase || 1
    if (!itemsByPhase[p]) itemsByPhase[p] = []
    itemsByPhase[p].push(item)
  }

  const statusText =
    phase === 0
      ? 'Nog niet begonnen'
      : phase === 4
      ? 'Afgerond'
      : `Fase ${phase + 1} actief`

  const nextPhase = phase < 4 ? phase + 1 : null

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center gap-3 min-w-0">
          <GoalPhaseCircle phase={phase} goalName={goal.goal_name} description={goal.description} size="md" />
          <div className="min-w-0">
            <p className="font-medium truncate">{goal.goal_name}</p>
            <p className="text-xs text-muted-foreground">{statusText}</p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0 space-y-2">
        {[1, 2, 3, 4].map((phaseNum) => {
          const phaseCriteria = rubricCriteria.filter(
            (rc) => rc.goal_number === goal.goal_number && rc.phase === phaseNum
          )
          return (
            <PhaseSection
              key={phaseNum}
              phaseNum={phaseNum}
              items={itemsByPhase[phaseNum] || []}
              isPassed={phaseNum <= phase}
              isNext={phaseNum === nextPhase}
              criteria={phaseCriteria}
              reviewRequest={reviewRequestsByKey[`${goal.goal_number}-${phaseNum}`] || null}
              goalNumber={goal.goal_number}
              goalName={goal.goal_name}
              onFeedback={onFeedback}
              onAssess={onAssess}
            />
          )
        })}
      </CardContent>
    </Card>
  )
}

export function PortfolioTab({ goals, rubricCriteria, reviewRequestsByKey, onFeedback, onAssess }: Props) {
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
        <GoalSection
          key={goal.goal_number}
          goal={goal}
          rubricCriteria={rubricCriteria}
          reviewRequestsByKey={reviewRequestsByKey}
          onFeedback={onFeedback}
          onAssess={onAssess}
        />
      ))}
    </div>
  )
}

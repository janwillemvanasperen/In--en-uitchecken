'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Plus, ChevronDown, ChevronUp, CheckCircle2, ClipboardList, X, CalendarClock } from 'lucide-react'
import { GoalPhaseCircle } from '@/components/shared/goal-phase-circle'
import { PortfolioItemCard } from './portfolio-item-card'
import { PortfolioUploadModal } from './portfolio-upload-modal'
import { PhaseReviewModal } from './phase-review-modal'

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

interface Slot {
  id: string
  date: string
  start_time: string
  duration_minutes: number
  max_bookings: number
}

interface FeedbackRequest {
  id: string
  item_id: string
  request_type: 'coach' | 'student' | 'external'
  target_name: string | null
  target_email: string | null
  token: string | null
  status: 'pending' | 'completed'
  response_text: string | null
  responded_by_name: string | null
  responded_at: string | null
}

interface Classmate {
  id: string
  full_name: string
}

interface Props {
  goalNumber: number
  goalName: string
  goalDescription: string | null
  currentPhase: number
  phaseDescriptions: Record<number, string>
  itemsByPhase: Record<number, any[]>
  reviewRequests: Record<string, any>
  feedbackRequestsByItem: Record<string, FeedbackRequest[]>
  classmates: Classmate[]
  availableSlots: Slot[]
  allCriteria: RubricCriterion[]
  onAdd: (data: {
    goal_number: number
    phase: number
    title: string
    description?: string
    link_url?: string
    file_url?: string
  }) => Promise<{ error?: string }>
  onDelete: (id: string) => Promise<{ error?: string }>
  onSubmitReview: (data: {
    goal_number: number
    phase: number
    slot_id: string
    self_scores: { criterion_id: string; score: Score }[]
    notes?: string
  }) => Promise<{ error?: string }>
  onCancelReview: (requestId: string) => Promise<{ error?: string }>
  onRequestFeedback: (
    itemId: string,
    data: {
      request_type: 'coach' | 'student' | 'external'
      target_user_id?: string
      target_name?: string
      target_email?: string
    }
  ) => Promise<{ error?: string; token?: string }>
}

function formatSlotShort(slot: any) {
  const d = new Date(`${slot.date}T${slot.start_time}`)
  const end = new Date(d.getTime() + (slot.duration_minutes || 30) * 60000)
  return `${d.toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' })} · ${d.toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' })}–${end.toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' })}`
}

function PhaseSection({
  phaseNum,
  phaseDescription,
  items,
  isActive,
  isPassed,
  reviewRequest,
  availableSlots,
  criteria,
  goalNumber,
  goalName,
  feedbackRequestsByItem,
  classmates,
  onAdd,
  onDelete,
  onSubmitReview,
  onCancelReview,
  onRequestFeedback,
}: {
  phaseNum: number
  phaseDescription: string
  items: any[]
  isActive: boolean
  isPassed: boolean
  reviewRequest: any | null
  availableSlots: Slot[]
  criteria: RubricCriterion[]
  goalNumber: number
  goalName: string
  feedbackRequestsByItem: Record<string, FeedbackRequest[]>
  classmates: Classmate[]
  onAdd: Props['onAdd']
  onDelete: Props['onDelete']
  onSubmitReview: Props['onSubmitReview']
  onCancelReview: Props['onCancelReview']
  onRequestFeedback: Props['onRequestFeedback']
}) {
  const [open, setOpen] = useState(isActive)
  const [uploadOpen, setUploadOpen] = useState(false)
  const [reviewOpen, setReviewOpen] = useState(false)
  const [cancelling, setCancelling] = useState(false)

  const hasReview = !!reviewRequest

  async function handleCancel() {
    if (!confirm('Aanvraag annuleren?')) return
    setCancelling(true)
    await onCancelReview(reviewRequest.id)
    setCancelling(false)
  }

  const borderColor = isPassed
    ? 'border-green-200 bg-green-50/40'
    : isActive
    ? 'border-primary/40 bg-primary/5'
    : 'border-border'

  const slot = reviewRequest?.progress_meeting_slots

  return (
    <div className={`rounded-lg border ${borderColor}`}>
      <button
        type="button"
        className="w-full flex items-center justify-between px-4 py-3 text-left"
        onClick={() => setOpen(!open)}
      >
        <div className="flex items-center gap-3 min-w-0">
          {isPassed ? (
            <CheckCircle2 className="h-5 w-5 text-green-600 shrink-0" />
          ) : (
            <GoalPhaseCircle phase={isActive ? phaseNum : 0} size="sm" />
          )}
          <div className="min-w-0">
            <span className={`text-sm font-medium ${isPassed ? 'text-green-700' : ''}`}>
              Fase {phaseNum}{isPassed ? ' — beoordeeld' : ''}
            </span>
            {phaseDescription && (
              <span className="text-xs text-muted-foreground ml-2 hidden sm:inline">
                — {phaseDescription}
              </span>
            )}
          </div>
          {items.length > 0 && !hasReview && (
            <span className="text-xs text-muted-foreground shrink-0">({items.length})</span>
          )}
          {hasReview && (
            <Badge className="text-[10px] bg-[#ffd100] text-black shrink-0">
              <CalendarClock className="h-3 w-3 mr-1" />
              {slot ? formatSlotShort(slot) : 'Beoordeling aangevraagd'}
            </Badge>
          )}
        </div>
        {open ? (
          <ChevronUp className="h-4 w-4 text-muted-foreground shrink-0" />
        ) : (
          <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
        )}
      </button>

      {open && (
        <div className="px-4 pb-4 space-y-3">
          {phaseDescription && (
            <p className="text-xs text-muted-foreground italic sm:hidden">{phaseDescription}</p>
          )}
          {items.length > 0 ? (
            <div className="space-y-2">
              {items.map((item) => (
                <PortfolioItemCard
                  key={item.id}
                  item={item}
                  feedbackRequests={feedbackRequestsByItem[item.id] || []}
                  classmates={classmates}
                  onDelete={onDelete}
                  onRequestFeedback={onRequestFeedback}
                />
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Nog geen bewijs voor fase {phaseNum}.</p>
          )}

          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              variant={isActive ? 'default' : 'outline'}
              onClick={() => setUploadOpen(true)}
              className="gap-1"
            >
              <Plus className="h-4 w-4" />
              Bewijs toevoegen
            </Button>

            {!isPassed && items.length > 0 && !hasReview && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => setReviewOpen(true)}
                className="gap-1 border-[#ffd100] text-foreground hover:bg-[#ffd100]/10"
              >
                <ClipboardList className="h-4 w-4" />
                Gereed voor beoordeling
              </Button>
            )}

            {hasReview && (
              <Button
                size="sm"
                variant="ghost"
                onClick={handleCancel}
                disabled={cancelling}
                className="gap-1 text-muted-foreground hover:text-destructive"
              >
                <X className="h-4 w-4" />
                Aanvraag annuleren
              </Button>
            )}
          </div>
        </div>
      )}

      <PortfolioUploadModal
        open={uploadOpen}
        onClose={() => setUploadOpen(false)}
        goalName={goalName}
        goalNumber={goalNumber}
        phase={phaseNum}
        onAdd={onAdd}
      />

      <PhaseReviewModal
        open={reviewOpen}
        onClose={() => setReviewOpen(false)}
        goalName={goalName}
        goalNumber={goalNumber}
        phase={phaseNum}
        criteria={criteria}
        availableSlots={availableSlots}
        onSubmit={onSubmitReview}
      />
    </div>
  )
}

export function PortfolioGoalSection({
  goalNumber,
  goalName,
  goalDescription,
  currentPhase,
  phaseDescriptions,
  itemsByPhase,
  reviewRequests,
  feedbackRequestsByItem,
  classmates,
  availableSlots,
  allCriteria,
  onAdd,
  onDelete,
  onSubmitReview,
  onCancelReview,
  onRequestFeedback,
}: Props) {
  const statusText =
    currentPhase === 0
      ? 'Nog niet begonnen'
      : currentPhase === 4
      ? 'Afgerond'
      : `Fase ${currentPhase + 1} actief`

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center gap-3 min-w-0">
          <GoalPhaseCircle
            phase={currentPhase}
            goalName={goalName}
            description={goalDescription}
            size="md"
          />
          <div className="min-w-0">
            <p className="font-medium truncate">{goalName}</p>
            <p className="text-xs text-muted-foreground">{statusText}</p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0 space-y-2">
        {[1, 2, 3, 4].map((phaseNum) => {
          const phaseCriteria = allCriteria.filter((c) => c.phase === phaseNum)
          return (
            <PhaseSection
              key={phaseNum}
              phaseNum={phaseNum}
              phaseDescription={phaseDescriptions[phaseNum] || ''}
              items={itemsByPhase[phaseNum] || []}
              isActive={currentPhase < 4 && phaseNum === currentPhase + 1}
              isPassed={phaseNum <= currentPhase}
              reviewRequest={reviewRequests[`${goalNumber}-${phaseNum}`] || null}
              availableSlots={availableSlots}
              criteria={phaseCriteria}
              goalNumber={goalNumber}
              goalName={goalName}
              feedbackRequestsByItem={feedbackRequestsByItem}
              classmates={classmates}
              onAdd={onAdd}
              onDelete={onDelete}
              onSubmitReview={onSubmitReview}
              onCancelReview={onCancelReview}
              onRequestFeedback={onRequestFeedback}
            />
          )
        })}
      </CardContent>
    </Card>
  )
}

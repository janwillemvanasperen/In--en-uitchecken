'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Loader2, AlertTriangle, TrendingUp, CalendarClock, User } from 'lucide-react'

type Score = 'onvoldoende' | 'voldoende' | 'goed'

const SCORE_VALUE: Record<Score, number> = { onvoldoende: 0, voldoende: 1, goed: 2 }

const SCORE_STYLES: Record<Score, string> = {
  onvoldoende: 'border-red-300 bg-red-50 text-red-700 ring-red-400',
  voldoende: 'border-yellow-300 bg-yellow-50 text-yellow-700 ring-yellow-400',
  goed: 'border-green-300 bg-green-50 text-green-700 ring-green-400',
}

const SCORE_BADGE_CLASS: Record<Score, string> = {
  onvoldoende: 'bg-red-100 text-red-700 border-red-200',
  voldoende: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  goed: 'bg-green-100 text-green-700 border-green-200',
}

interface RubricCriterion {
  id: string
  criterion_text: string
  description_insufficient: string
  description_sufficient: string
  description_good: string
  sort_order: number
}

interface ReviewRequest {
  id: string
  student_notes: string | null
  self_scores: { criterion_id: string; score: Score }[]
  slot: { date: string; start_time: string; duration_minutes: number } | null
}

interface Props {
  open: boolean
  onClose: () => void
  goalName: string
  goalNumber: number
  phaseToAssess: number
  criteria: RubricCriterion[]
  reviewRequest?: ReviewRequest | null
  onSubmit: (
    goalNumber: number,
    phaseAssessed: number,
    scores: { criterion_id: string; score: Score }[],
    notes?: string,
    reviewRequestId?: string
  ) => Promise<{ error?: string }>
}

function formatSlot(slot: ReviewRequest['slot']) {
  if (!slot) return null
  const d = new Date(`${slot.date}T${slot.start_time}`)
  const end = new Date(d.getTime() + (slot.duration_minutes || 30) * 60000)
  return `${d.toLocaleDateString('nl-NL', { weekday: 'long', day: 'numeric', month: 'long' })} · ${d.toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' })}–${end.toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' })}`
}

export function PortfolioAssessModal({
  open, onClose, goalName, goalNumber, phaseToAssess, criteria, reviewRequest, onSubmit,
}: Props) {
  const [scores, setScores] = useState<Record<string, Score>>({})
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const scoredCount = Object.keys(scores).length
  const allScored = criteria.length > 0 && scoredCount === criteria.length

  const total = Object.values(scores).reduce((sum, s) => sum + SCORE_VALUE[s], 0)
  const maxPossible = criteria.length * 2
  const pct = maxPossible > 0 ? Math.round((total / maxPossible) * 100) : 0
  const hasAnyOnvoldoende = Object.values(scores).some((s) => s === 'onvoldoende')
  const projectedResult: Score = hasAnyOnvoldoende ? 'onvoldoende' : pct >= 80 ? 'goed' : pct >= 50 ? 'voldoende' : 'onvoldoende'

  // Build self-score lookup
  const selfScoreMap: Record<string, Score> = {}
  for (const ss of reviewRequest?.self_scores || []) {
    selfScoreMap[ss.criterion_id] = ss.score
  }

  function setScore(criterionId: string, score: Score) {
    setScores((prev) => ({ ...prev, [criterionId]: score }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!allScored) return
    setLoading(true)
    setError(null)

    const scoresList = criteria.map((c) => ({
      criterion_id: c.id,
      score: scores[c.id],
    }))

    const res = await onSubmit(
      goalNumber,
      phaseToAssess,
      scoresList,
      notes || undefined,
      reviewRequest?.id
    )
    if (res.error) {
      setError(res.error)
      setLoading(false)
      return
    }

    setScores({})
    setNotes('')
    setLoading(false)
    onClose()
  }

  function handleClose() {
    if (loading) return
    setScores({})
    setNotes('')
    setError(null)
    onClose()
  }

  const willAdvance = allScored && (projectedResult === 'voldoende' || projectedResult === 'goed')

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Fase {phaseToAssess} beoordelen</DialogTitle>
          <p className="text-sm text-muted-foreground truncate">{goalName}</p>
        </DialogHeader>

        {/* Review request info */}
        {reviewRequest && (
          <div className="space-y-2 p-3 rounded-lg bg-[#ffd100]/10 border border-[#ffd100]/30">
            <div className="flex items-center gap-2 text-sm font-medium">
              <CalendarClock className="h-4 w-4 text-[#ffd100]" />
              <span>Voortgangsgesprek aangevraagd</span>
            </div>
            {reviewRequest.slot && (
              <p className="text-sm text-muted-foreground">{formatSlot(reviewRequest.slot)}</p>
            )}
            {reviewRequest.student_notes && (
              <div className="flex items-start gap-2 text-sm">
                <User className="h-3.5 w-3.5 mt-0.5 text-muted-foreground shrink-0" />
                <p className="text-muted-foreground italic">&ldquo;{reviewRequest.student_notes}&rdquo;</p>
              </div>
            )}
          </div>
        )}

        {criteria.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4">
            Geen beoordelingscriteria gevonden voor deze fase.
          </p>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Show self-assessment column headers if available */}
            {reviewRequest?.self_scores && reviewRequest.self_scores.length > 0 && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <User className="h-3.5 w-3.5" />
                <span>Zelfbeoordeling student is zichtbaar per criterium</span>
              </div>
            )}

            <div className="space-y-3">
              {criteria.map((c, idx) => {
                const selfScore = selfScoreMap[c.id]
                return (
                  <div key={c.id} className="border rounded-lg p-3 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-medium flex-1">
                        <span className="text-muted-foreground mr-2">{idx + 1}.</span>
                        {c.criterion_text}
                      </p>
                      {selfScore && (
                        <div className="flex items-center gap-1 shrink-0">
                          <User className="h-3 w-3 text-muted-foreground" />
                          <Badge
                            variant="outline"
                            className={`text-[10px] px-1.5 py-0 h-5 capitalize ${SCORE_BADGE_CLASS[selfScore]}`}
                          >
                            {selfScore}
                          </Badge>
                        </div>
                      )}
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      {(['onvoldoende', 'voldoende', 'goed'] as Score[]).map((s) => {
                        const isSelected = scores[c.id] === s
                        const desc =
                          s === 'onvoldoende'
                            ? c.description_insufficient
                            : s === 'voldoende'
                            ? c.description_sufficient
                            : c.description_good
                        return (
                          <button
                            key={s}
                            type="button"
                            onClick={() => setScore(c.id, s)}
                            disabled={loading}
                            className={`text-left p-2 rounded-md border-2 transition-all text-xs ${
                              isSelected
                                ? SCORE_STYLES[s] + ' ring-2 ring-offset-1'
                                : 'border-border bg-card hover:bg-muted/50'
                            }`}
                          >
                            <p className="font-semibold capitalize">{s}</p>
                            <p className="text-[10px] text-muted-foreground mt-0.5 leading-snug line-clamp-3">
                              {desc}
                            </p>
                          </button>
                        )
                      })}
                    </div>
                  </div>
                )
              })}
            </div>

            {scoredCount > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50 text-sm">
                  <span className="text-muted-foreground">
                    Score: {total}/{maxPossible} ({pct}%)
                  </span>
                  {allScored && (
                    <span
                      className={`font-medium capitalize ${
                        projectedResult === 'goed'
                          ? 'text-green-600'
                          : projectedResult === 'voldoende'
                          ? 'text-yellow-600'
                          : 'text-red-600'
                      }`}
                    >
                      → {projectedResult}
                    </span>
                  )}
                </div>
                {hasAnyOnvoldoende && (
                  <div className="flex items-start gap-2 text-xs p-2.5 rounded-md bg-red-50 text-red-700 border border-red-200">
                    <AlertTriangle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                    <span>
                      Eén of meer criteria zijn onvoldoende — de fase is daarmee onvoldoende, ook als het puntentotaal hoog is.
                    </span>
                  </div>
                )}
              </div>
            )}

            {willAdvance && (
              <div className="flex items-center gap-2 text-sm p-3 rounded-lg bg-green-50 text-green-700 border border-green-200">
                <TrendingUp className="h-4 w-4 shrink-0" />
                <span>Student gaat naar de volgende fase</span>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="notes">Notitie (optioneel)</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Toelichting bij de beoordeling..."
                rows={2}
                disabled={loading}
              />
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="flex gap-2 justify-end">
              <Button type="button" variant="outline" onClick={handleClose} disabled={loading}>
                Annuleren
              </Button>
              <Button type="submit" disabled={loading || !allScored}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Opslaan...
                  </>
                ) : (
                  `Beoordeling opslaan (${scoredCount}/${criteria.length})`
                )}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}

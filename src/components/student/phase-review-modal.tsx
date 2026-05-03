'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, AlertTriangle, ChevronRight, CalendarClock, ClipboardCheck } from 'lucide-react'

type Score = 'onvoldoende' | 'voldoende' | 'goed'
const SCORE_VALUE: Record<Score, number> = { onvoldoende: 0, voldoende: 1, goed: 2 }
const SCORE_STYLES: Record<Score, string> = {
  onvoldoende: 'border-red-300 bg-red-50 text-red-700 ring-red-400',
  voldoende: 'border-yellow-300 bg-yellow-50 text-yellow-700 ring-yellow-400',
  goed: 'border-green-300 bg-green-50 text-green-700 ring-green-400',
}

interface RubricCriterion {
  id: string
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
}

interface Props {
  open: boolean
  onClose: () => void
  goalName: string
  goalNumber: number
  phase: number
  criteria: RubricCriterion[]
  availableSlots: Slot[]
  onSubmit: (data: {
    goal_number: number
    phase: number
    slot_id: string
    self_scores: { criterion_id: string; score: Score }[]
    notes?: string
  }) => Promise<{ error?: string }>
}

function formatSlot(slot: Slot) {
  const d = new Date(`${slot.date}T${slot.start_time}`)
  const end = new Date(d.getTime() + slot.duration_minutes * 60000)
  const dateStr = d.toLocaleDateString('nl-NL', { weekday: 'long', day: 'numeric', month: 'long' })
  const startStr = d.toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' })
  const endStr = end.toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' })
  return `${dateStr} · ${startStr}–${endStr}`
}

export function PhaseReviewModal({
  open, onClose, goalName, goalNumber, phase, criteria, availableSlots, onSubmit,
}: Props) {
  const [step, setStep] = useState<1 | 2>(1)
  const [scores, setScores] = useState<Record<string, Score>>({})
  const [selectedSlot, setSelectedSlot] = useState<string>('')
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const allScored = criteria.length > 0 && Object.keys(scores).length === criteria.length
  const total = Object.values(scores).reduce((sum, s) => sum + SCORE_VALUE[s], 0)
  const maxPossible = criteria.length * 2
  const pct = maxPossible > 0 ? Math.round((total / maxPossible) * 100) : 0
  const projectedResult: Score = pct >= 80 ? 'goed' : pct >= 50 ? 'voldoende' : 'onvoldoende'

  function handleClose() {
    if (loading) return
    setStep(1)
    setScores({})
    setSelectedSlot('')
    setNotes('')
    setError(null)
    onClose()
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedSlot || !allScored) return
    setLoading(true)
    setError(null)

    const result = await onSubmit({
      goal_number: goalNumber,
      phase,
      slot_id: selectedSlot,
      self_scores: criteria.map((c) => ({ criterion_id: c.id, score: scores[c.id] })),
      notes: notes || undefined,
    })

    if (result.error) {
      setError(result.error)
      setLoading(false)
      return
    }

    handleClose()
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Fase {phase} gereed melden</DialogTitle>
          <p className="text-sm text-muted-foreground truncate">{goalName}</p>
        </DialogHeader>

        <div className="flex gap-4 text-xs mb-2">
          {[
            { n: 1, label: 'Zelfbeoordeling', icon: ClipboardCheck },
            { n: 2, label: 'Datum & tijd', icon: CalendarClock },
          ].map(({ n, label, icon: Icon }) => (
            <div
              key={n}
              className={`flex items-center gap-1.5 ${step === n ? 'text-primary font-medium' : 'text-muted-foreground'}`}
            >
              <span className={`h-5 w-5 rounded-full flex items-center justify-center text-[10px] border ${step === n ? 'border-primary bg-primary text-primary-foreground' : step > n ? 'border-green-500 bg-green-500 text-white' : 'border-muted-foreground'}`}>
                {n}
              </span>
              <Icon className="h-3.5 w-3.5" />
              {label}
              {n < 2 && <ChevronRight className="h-3 w-3 text-muted-foreground" />}
            </div>
          ))}
        </div>

        {step === 1 && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Beoordeel jezelf eerlijk voor elk criterium van fase {phase}.
            </p>

            {criteria.length === 0 ? (
              <p className="text-sm text-muted-foreground italic">Geen criteria gevonden voor deze fase.</p>
            ) : (
              criteria.map((c, idx) => {
                const selected = scores[c.id]
                return (
                  <div key={c.id} className="border rounded-lg p-3 space-y-2">
                    <p className="text-sm font-medium">
                      <span className="text-muted-foreground mr-2">{idx + 1}.</span>
                      {c.criterion_text}
                    </p>
                    <div className="grid grid-cols-3 gap-2">
                      {(['onvoldoende', 'voldoende', 'goed'] as Score[]).map((s) => {
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
                            onClick={() => setScores((prev) => ({ ...prev, [c.id]: s }))}
                            className={`text-left p-2 rounded-md border-2 transition-all text-xs ${
                              selected === s
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
              })
            )}

            {Object.keys(scores).length > 0 && (
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50 text-sm">
                <span className="text-muted-foreground">
                  Jouw score: {total}/{maxPossible} ({pct}%)
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
                    {projectedResult}
                  </span>
                )}
              </div>
            )}

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={handleClose}>
                Annuleren
              </Button>
              <Button
                type="button"
                onClick={() => setStep(2)}
                disabled={!allScored && criteria.length > 0}
                className="gap-1"
              >
                Volgende
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {step === 2 && (
          <form onSubmit={handleSubmit} className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Kies een tijdslot voor het voortgangsgesprek met je coach (30 minuten).
            </p>

            {availableSlots.length === 0 ? (
              <Alert>
                <AlertDescription>
                  Er zijn momenteel geen beschikbare tijdsloten. Vraag je coach om tijdsloten toe te voegen.
                </AlertDescription>
              </Alert>
            ) : (
              <div className="space-y-2">
                {availableSlots.map((slot) => (
                  <button
                    key={slot.id}
                    type="button"
                    onClick={() => setSelectedSlot(slot.id)}
                    className={`w-full text-left p-3 rounded-lg border-2 transition-all text-sm ${
                      selectedSlot === slot.id
                        ? 'border-primary bg-primary/5 font-medium'
                        : 'border-border hover:bg-muted/50'
                    }`}
                  >
                    <CalendarClock className={`inline h-4 w-4 mr-2 ${selectedSlot === slot.id ? 'text-primary' : 'text-muted-foreground'}`} />
                    {formatSlot(slot)}
                  </button>
                ))}
              </div>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="notes">Notitie voor je coach (optioneel)</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Bijv. waar je trots op bent of waar je nog twijfels over hebt..."
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

            <div className="flex justify-between gap-2">
              <Button type="button" variant="outline" onClick={() => setStep(1)} disabled={loading}>
                Terug
              </Button>
              <div className="flex gap-2">
                <Button type="button" variant="outline" onClick={handleClose} disabled={loading}>
                  Annuleren
                </Button>
                <Button
                  type="submit"
                  disabled={loading || !selectedSlot || availableSlots.length === 0}
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Indienen...
                    </>
                  ) : (
                    'Aanmelden voor beoordeling'
                  )}
                </Button>
              </div>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}

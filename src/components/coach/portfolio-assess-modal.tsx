'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, AlertTriangle, TrendingUp } from 'lucide-react'

interface Props {
  open: boolean
  onClose: () => void
  goalName: string
  goalNumber: number
  currentPhase: number
  phaseLabel: string
  onSubmit: (
    goalNumber: number,
    phaseAssessed: number,
    result: 'onvoldoende' | 'voldoende' | 'goed',
    notes?: string
  ) => Promise<{ error?: string }>
}

const RESULTS: { value: 'onvoldoende' | 'voldoende' | 'goed'; label: string; description: string; color: string }[] = [
  { value: 'onvoldoende', label: 'Onvoldoende', description: 'Student is nog niet klaar voor de volgende fase', color: 'border-red-200 bg-red-50 text-red-700 hover:bg-red-100' },
  { value: 'voldoende', label: 'Voldoende', description: 'Student gaat één fase vooruit', color: 'border-green-200 bg-green-50 text-green-700 hover:bg-green-100' },
  { value: 'goed', label: 'Goed', description: 'Student gaat één fase vooruit', color: 'border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100' },
]

export function PortfolioAssessModal({
  open, onClose, goalName, goalNumber, currentPhase, phaseLabel, onSubmit,
}: Props) {
  const [result, setResult] = useState<'onvoldoende' | 'voldoende' | 'goed' | null>(null)
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!result) return
    setLoading(true)
    setError(null)
    const res = await onSubmit(goalNumber, currentPhase, result, notes || undefined)
    if (res.error) {
      setError(res.error)
      setLoading(false)
      return
    }
    setResult(null)
    setNotes('')
    setLoading(false)
    onClose()
  }

  function handleClose() {
    if (loading) return
    setResult(null)
    setNotes('')
    setError(null)
    onClose()
  }

  const willAdvance = result === 'voldoende' || result === 'goed'

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Fase beoordelen</DialogTitle>
          <p className="text-sm text-muted-foreground truncate">{goalName}</p>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex items-center gap-2 text-sm p-3 rounded-lg bg-muted/50">
            <span className="text-muted-foreground">Huidige fase:</span>
            <span className="font-medium">{phaseLabel}</span>
          </div>

          <div className="space-y-2">
            <Label>Beoordeling <span className="text-destructive">*</span></Label>
            <div className="space-y-2">
              {RESULTS.map((r) => (
                <button
                  key={r.value}
                  type="button"
                  onClick={() => setResult(r.value)}
                  disabled={loading}
                  className={`w-full text-left p-3 rounded-lg border-2 transition-all ${
                    result === r.value ? r.color + ' ring-2 ring-offset-1 ring-current' : 'border-border bg-card hover:bg-muted/50'
                  }`}
                >
                  <p className="font-medium text-sm">{r.label}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{r.description}</p>
                </button>
              ))}
            </div>
          </div>

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
            <Button type="submit" disabled={loading || !result}>
              {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Opslaan...</> : 'Beoordeling opslaan'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

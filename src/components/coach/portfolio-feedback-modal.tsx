'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, AlertTriangle } from 'lucide-react'

interface Props {
  open: boolean
  onClose: () => void
  itemTitle: string
  onSubmit: (feedbackText: string) => Promise<{ error?: string }>
}

export function PortfolioFeedbackModal({ open, onClose, itemTitle, onSubmit }: Props) {
  const [text, setText] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const result = await onSubmit(text)
    if (result.error) {
      setError(result.error)
      setLoading(false)
      return
    }
    setText('')
    setLoading(false)
    onClose()
  }

  function handleClose() {
    if (loading) return
    setText('')
    setError(null)
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Feedback geven</DialogTitle>
          <p className="text-sm text-muted-foreground truncate">{itemTitle}</p>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="feedback">Feedback <span className="text-destructive">*</span></Label>
            <Textarea
              id="feedback"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Schrijf hier je feedback voor de student..."
              rows={4}
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
            <Button type="submit" disabled={loading || !text.trim()}>
              {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Opslaan...</> : 'Feedback opslaan'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

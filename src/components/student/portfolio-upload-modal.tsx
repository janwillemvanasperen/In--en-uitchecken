'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, AlertTriangle } from 'lucide-react'

interface Props {
  open: boolean
  onClose: () => void
  goalName: string
  goalNumber: number
  onAdd: (data: {
    goal_number: number
    title: string
    description?: string
    link_url?: string
  }) => Promise<{ error?: string }>
}

export function PortfolioUploadModal({ open, onClose, goalName, goalNumber, onAdd }: Props) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [linkUrl, setLinkUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const result = await onAdd({
      goal_number: goalNumber,
      title,
      description: description || undefined,
      link_url: linkUrl || undefined,
    })

    if (result.error) {
      setError(result.error)
      setLoading(false)
      return
    }

    setTitle('')
    setDescription('')
    setLinkUrl('')
    setLoading(false)
    onClose()
  }

  function handleClose() {
    if (loading) return
    setTitle('')
    setDescription('')
    setLinkUrl('')
    setError(null)
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Bewijs toevoegen</DialogTitle>
          <p className="text-sm text-muted-foreground">{goalName}</p>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Titel <span className="text-destructive">*</span></Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="bijv. Projectplan dagstart week 12"
              required
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Reflectie</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Dit laat zien dat ik… omdat…"
              rows={3}
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="link">Link</Label>
            <Input
              id="link"
              type="url"
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
              placeholder="https://..."
              disabled={loading}
            />
            <p className="text-xs text-muted-foreground">
              Link naar GitHub, Google Drive, Figma, video, etc.
            </p>
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
            <Button type="submit" disabled={loading || !title.trim()}>
              {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Opslaan...</> : 'Opslaan'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

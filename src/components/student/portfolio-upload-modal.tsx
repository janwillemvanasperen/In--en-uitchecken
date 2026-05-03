'use client'

import { useRef, useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, AlertTriangle, Upload, X, FileText } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface Props {
  open: boolean
  onClose: () => void
  goalName: string
  goalNumber: number
  phase: number
  onAdd: (data: {
    goal_number: number
    phase: number
    title: string
    description?: string
    link_url?: string
    file_url?: string
  }) => Promise<{ error?: string }>
}

const MAX_FILE_MB = 10
const ALLOWED_TYPES = [
  'image/jpeg', 'image/png', 'image/gif', 'image/webp',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'video/mp4', 'video/quicktime',
  'audio/mpeg', 'audio/mp4',
  'text/plain',
]

export function PortfolioUploadModal({ open, onClose, goalName, goalNumber, phase, onAdd }: Props) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [linkUrl, setLinkUrl] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [fileError, setFileError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0] || null
    setFileError(null)
    if (!f) { setFile(null); return }
    if (!ALLOWED_TYPES.includes(f.type)) {
      setFileError('Bestandstype niet toegestaan')
      setFile(null)
      return
    }
    if (f.size > MAX_FILE_MB * 1024 * 1024) {
      setFileError(`Bestand mag maximaal ${MAX_FILE_MB} MB zijn`)
      setFile(null)
      return
    }
    setFile(f)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    let fileUrl: string | undefined

    // Upload file to Supabase Storage if selected
    if (file) {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setError('Niet ingelogd'); setLoading(false); return }

      const ext = file.name.split('.').pop()
      const path = `${user.id}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
      const { error: uploadError } = await supabase.storage
        .from('portfolio-files')
        .upload(path, file)

      if (uploadError) { setError(`Upload mislukt: ${uploadError.message}`); setLoading(false); return }

      const { data: urlData } = supabase.storage.from('portfolio-files').getPublicUrl(path)
      fileUrl = urlData.publicUrl
    }

    const result = await onAdd({
      goal_number: goalNumber,
      phase,
      title,
      description: description || undefined,
      link_url: linkUrl || undefined,
      file_url: fileUrl,
    })

    if (result.error) {
      setError(result.error)
      setLoading(false)
      return
    }

    resetForm()
    onClose()
  }

  function resetForm() {
    setTitle('')
    setDescription('')
    setLinkUrl('')
    setFile(null)
    setFileError(null)
    setError(null)
    setLoading(false)
    if (fileRef.current) fileRef.current.value = ''
  }

  function handleClose() {
    if (loading) return
    resetForm()
    onClose()
  }

  const hasContent = description.trim() || linkUrl.trim() || !!file

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Bewijs toevoegen — Fase {phase}</DialogTitle>
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

          {/* File upload */}
          <div className="space-y-2">
            <Label>Bestand uploaden</Label>
            {file ? (
              <div className="flex items-center gap-2 p-3 rounded-lg border bg-muted/50">
                <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
                <span className="text-sm flex-1 truncate">{file.name}</span>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 shrink-0"
                  onClick={() => { setFile(null); if (fileRef.current) fileRef.current.value = '' }}
                  disabled={loading}
                >
                  <X className="h-3.5 w-3.5" />
                </Button>
              </div>
            ) : (
              <label className={`flex flex-col items-center justify-center gap-1 px-4 py-5 rounded-lg border-2 border-dashed cursor-pointer transition-colors ${loading ? 'opacity-50 cursor-not-allowed' : 'hover:border-primary/60 hover:bg-primary/5'}`}>
                <Upload className="h-5 w-5 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Klik om een bestand te kiezen</span>
                <span className="text-xs text-muted-foreground/70">PDF, Word, Excel, afbeelding, video — max {MAX_FILE_MB} MB</span>
                <input
                  ref={fileRef}
                  type="file"
                  className="sr-only"
                  onChange={handleFileChange}
                  disabled={loading}
                  accept={ALLOWED_TYPES.join(',')}
                />
              </label>
            )}
            {fileError && <p className="text-xs text-destructive">{fileError}</p>}
          </div>

          {/* Link */}
          <div className="space-y-2">
            <Label htmlFor="link">Of link</Label>
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
            <Button type="submit" disabled={loading || !title.trim() || !hasContent}>
              {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />{file ? 'Uploaden…' : 'Opslaan…'}</> : 'Opslaan'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

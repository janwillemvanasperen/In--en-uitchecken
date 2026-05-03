'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Loader2, AlertTriangle, GraduationCap, Users, Globe, CheckCircle2, Copy, Check } from 'lucide-react'

interface Classmate {
  id: string
  full_name: string
}

interface Props {
  open: boolean
  onClose: () => void
  itemTitle: string
  classmates: Classmate[]
  onSubmit: (data: {
    request_type: 'coach' | 'student' | 'external'
    target_user_id?: string
    target_name?: string
    target_email?: string
  }) => Promise<{ error?: string; token?: string }>
}

type FeedbackType = 'coach' | 'student' | 'external'

const TYPE_OPTIONS: { type: FeedbackType; label: string; sub: string; icon: typeof GraduationCap }[] = [
  { type: 'coach', label: 'Coach', sub: 'Vraag feedback aan je coach', icon: GraduationCap },
  { type: 'student', label: 'Medestudent', sub: 'Vraag een klasgenoot om feedback', icon: Users },
  { type: 'external', label: 'Externe', sub: 'Deel een link met iemand buiten school', icon: Globe },
]

export function FeedbackRequestModal({ open, onClose, itemTitle, classmates, onSubmit }: Props) {
  const [type, setType] = useState<FeedbackType | null>(null)
  const [targetUserId, setTargetUserId] = useState('')
  const [targetEmail, setTargetEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [doneToken, setDoneToken] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  const shareUrl =
    doneToken && typeof window !== 'undefined'
      ? `${window.location.origin}/feedback/${doneToken}`
      : null

  async function handleSubmit() {
    if (!type) return
    if (type === 'student' && !targetUserId) {
      setError('Kies een medestudent')
      return
    }

    setLoading(true)
    setError(null)

    const chosenClassmate = classmates.find((c) => c.id === targetUserId)
    const res = await onSubmit({
      request_type: type,
      target_user_id: type === 'student' ? targetUserId : undefined,
      target_name:
        type === 'student' ? chosenClassmate?.full_name : undefined,
      target_email: type === 'external' ? targetEmail || undefined : undefined,
    })

    setLoading(false)

    if (res.error) {
      setError(res.error)
      return
    }

    if (type === 'external' && res.token) {
      setDoneToken(res.token)
    } else {
      handleClose()
    }
  }

  function handleCopy() {
    if (!shareUrl) return
    navigator.clipboard.writeText(shareUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  function handleClose() {
    if (loading) return
    setType(null)
    setTargetUserId('')
    setTargetEmail('')
    setError(null)
    setDoneToken(null)
    setCopied(false)
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Feedback aanvragen</DialogTitle>
          <p className="text-sm text-muted-foreground truncate">{itemTitle}</p>
        </DialogHeader>

        {doneToken ? (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm text-green-700">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              <span>Aanvraag aangemaakt. Deel de link hieronder.</span>
            </div>
            <div className="space-y-2">
              <Label>Deel-link</Label>
              <div className="flex gap-2">
                <Input value={shareUrl || ''} readOnly className="text-xs" />
                <Button size="icon" variant="outline" onClick={handleCopy} className="shrink-0">
                  {copied ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Iedereen met deze link kan feedback geven, ook zonder account.
              </p>
            </div>
            <Button className="w-full" onClick={handleClose}>Sluiten</Button>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Type selector */}
            <div className="space-y-2">
              {TYPE_OPTIONS.map(({ type: t, label, sub, icon: Icon }) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => { setType(t); setError(null) }}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg border-2 text-left transition-colors ${
                    type === t
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-muted-foreground/40'
                  }`}
                >
                  <Icon className="h-5 w-5 shrink-0 text-muted-foreground" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{label}</p>
                    <p className="text-xs text-muted-foreground">{sub}</p>
                  </div>
                  {type === t && (
                    <Badge className="bg-primary text-primary-foreground text-xs shrink-0">
                      Gekozen
                    </Badge>
                  )}
                </button>
              ))}
            </div>

            {/* Extra inputs per type */}
            {type === 'student' && (
              <div className="space-y-2">
                <Label htmlFor="classmate">Medestudent</Label>
                {classmates.length > 0 ? (
                  <select
                    id="classmate"
                    value={targetUserId}
                    onChange={(e) => setTargetUserId(e.target.value)}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                    disabled={loading}
                  >
                    <option value="">Kies een medestudent…</option>
                    {classmates.map((c) => (
                      <option key={c.id} value={c.id}>{c.full_name}</option>
                    ))}
                  </select>
                ) : (
                  <p className="text-sm text-muted-foreground">Geen medestudenten gevonden.</p>
                )}
              </div>
            )}

            {type === 'external' && (
              <div className="space-y-2">
                <Label htmlFor="email">E-mailadres (optioneel)</Label>
                <Input
                  id="email"
                  type="email"
                  value={targetEmail}
                  onChange={(e) => setTargetEmail(e.target.value)}
                  placeholder="naam@voorbeeld.nl"
                  disabled={loading}
                />
                <p className="text-xs text-muted-foreground">
                  Je ontvangt een link die je zelf kunt doorsturen.
                </p>
              </div>
            )}

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
              <Button onClick={handleSubmit} disabled={loading || !type}>
                {loading ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Versturen…</>
                ) : (
                  'Feedback aanvragen'
                )}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

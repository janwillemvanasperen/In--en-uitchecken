'use client'

import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Copy, Check, RefreshCw, Loader2 } from 'lucide-react'
import { regenerateIcalToken } from '@/app/student/profile/actions'

interface Props {
  icalToken: string
  origin: string
}

export function IcalTokenCard({ icalToken, origin }: Props) {
  const [token, setToken] = useState(icalToken)
  const [copied, setCopied] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const icalUrl = `${origin}/api/calendar/${token}`

  function handleCopy() {
    navigator.clipboard.writeText(icalUrl).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  function handleRegenerate() {
    setError(null)
    startTransition(async () => {
      const result = await regenerateIcalToken()
      if (result.error) {
        setError(result.error)
      } else if (result.token) {
        setToken(result.token)
      }
    })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Privéagenda koppeling</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-muted-foreground">
          Gebruik deze link om je agenda te koppelen aan Google Agenda, Apple Agenda of Outlook.
          Houd de link privé — iedereen met de link kan je agenda inzien.
        </p>
        <div className="flex gap-2">
          <Input
            readOnly
            value={icalUrl}
            className="text-xs font-mono"
            onClick={(e) => (e.target as HTMLInputElement).select()}
          />
          <Button size="sm" variant="outline" onClick={handleCopy} className="shrink-0">
            {copied
              ? <><Check className="h-4 w-4 mr-1 text-green-600" />Gekopieerd</>
              : <><Copy className="h-4 w-4 mr-1" />Kopieer</>
            }
          </Button>
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={handleRegenerate}
            disabled={isPending}
            className="text-xs text-orange-600 border-orange-300 hover:text-orange-700"
          >
            {isPending
              ? <><Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />Vernieuwen...</>
              : <><RefreshCw className="h-3.5 w-3.5 mr-1" />Nieuwe link genereren</>
            }
          </Button>
          <p className="text-xs text-muted-foreground">
            Oude link wordt dan ongeldig.
          </p>
        </div>
        {error && <p className="text-sm text-destructive">{error}</p>}
      </CardContent>
    </Card>
  )
}

'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { autoApplyExistingSchedules } from '@/app/admin/actions'
import { Loader2, CopyCheck } from 'lucide-react'

interface AutoApplyButtonProps {
  pushRequestId: string
  notRespondedCount: number
}

export function AutoApplyButton({ pushRequestId, notRespondedCount }: AutoApplyButtonProps) {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<string | null>(null)

  if (notRespondedCount === 0 || result !== null) {
    return result ? (
      <p className="text-xs text-green-600">{result}</p>
    ) : null
  }

  const handleClick = async () => {
    setLoading(true)
    const res = await autoApplyExistingSchedules(pushRequestId)
    if (res.error) {
      setResult(`Fout: ${res.error}`)
    } else if (res.count === 0) {
      setResult('Geen studenten met een huidig rooster gevonden.')
    } else {
      setResult(`Rooster overgenomen voor ${res.count} student${res.count === 1 ? '' : 'en'}.`)
    }
    setLoading(false)
  }

  return (
    <Button
      variant="outline"
      size="sm"
      className="h-7 text-xs gap-1"
      onClick={handleClick}
      disabled={loading}
    >
      {loading ? (
        <Loader2 className="h-3 w-3 animate-spin" />
      ) : (
        <CopyCheck className="h-3 w-3" />
      )}
      Rooster overnemen ({notRespondedCount})
    </Button>
  )
}

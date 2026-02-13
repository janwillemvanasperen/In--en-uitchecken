'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { History, ChevronDown, ChevronUp } from 'lucide-react'
import type { Schedule } from '@/types'

const DAY_NAMES: Record<number, string> = {
  1: 'Ma', 2: 'Di', 3: 'Wo', 4: 'Do', 5: 'Vr', 6: 'Za', 7: 'Zo',
}

const STATUS_CONFIG: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' }> = {
  approved: { label: 'Goedgekeurd', variant: 'default' },
  pending: { label: 'In afwachting', variant: 'secondary' },
  rejected: { label: 'Afgewezen', variant: 'destructive' },
}

interface ScheduleGroup {
  submissionGroup: string
  validFrom: string
  validUntil: string
  status: string
  entries: Schedule[]
}

interface ScheduleHistoryProps {
  history: ScheduleGroup[]
}

function HistoryItem({ group }: { group: ScheduleGroup }) {
  const [expanded, setExpanded] = useState(false)
  const statusConfig = STATUS_CONFIG[group.status] || STATUS_CONFIG.pending

  const totalHours = group.entries.reduce((sum, s) => {
    const [sh, sm] = s.start_time.split(':').map(Number)
    const [eh, em] = s.end_time.split(':').map(Number)
    return sum + Math.max(0, (eh + em / 60) - (sh + sm / 60))
  }, 0)

  return (
    <div className="rounded-lg border">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-center justify-between p-4 text-left hover:bg-muted/50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <Badge variant={statusConfig.variant}>{statusConfig.label}</Badge>
          <span className="text-sm">
            {new Date(group.validFrom).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' })}
            {' — '}
            {new Date(group.validUntil).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short', year: 'numeric' })}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-muted-foreground">{totalHours.toFixed(1)}u/week</span>
          {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </div>
      </button>

      {expanded && (
        <div className="border-t px-4 py-3">
          <div className="space-y-1">
            {[1, 2, 3, 4, 5, 6, 7].map(day => {
              const entry = group.entries.find(e => e.day_of_week === day)
              if (!entry) return null
              return (
                <div key={day} className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground w-[30px]">{DAY_NAMES[day]}</span>
                  <span>{entry.start_time.slice(0, 5)} — {entry.end_time.slice(0, 5)}</span>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

export function ScheduleHistory({ history }: ScheduleHistoryProps) {
  if (history.length === 0) {
    return null
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <History className="h-4 w-4" />
          Rooster geschiedenis
        </CardTitle>
        <CardDescription>Eerdere roosters</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {history.map((group) => (
            <HistoryItem key={group.submissionGroup} group={group} />
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

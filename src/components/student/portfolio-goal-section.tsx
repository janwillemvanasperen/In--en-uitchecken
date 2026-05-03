'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Plus, ChevronDown, ChevronUp, CheckCircle2 } from 'lucide-react'
import { GoalPhaseCircle } from '@/components/shared/goal-phase-circle'
import { PortfolioItemCard } from './portfolio-item-card'
import { PortfolioUploadModal } from './portfolio-upload-modal'

interface Props {
  goalNumber: number
  goalName: string
  goalDescription: string | null
  currentPhase: number
  phaseDescriptions: Record<number, string>
  itemsByPhase: Record<number, any[]>
  onAdd: (data: {
    goal_number: number
    phase: number
    title: string
    description?: string
    link_url?: string
  }) => Promise<{ error?: string }>
  onDelete: (id: string) => Promise<{ error?: string }>
}

function PhaseSection({
  phaseNum,
  phaseDescription,
  items,
  isActive,
  isPassed,
  goalNumber,
  goalName,
  onAdd,
  onDelete,
}: {
  phaseNum: number
  phaseDescription: string
  items: any[]
  isActive: boolean
  isPassed: boolean
  goalNumber: number
  goalName: string
  onAdd: Props['onAdd']
  onDelete: Props['onDelete']
}) {
  const [open, setOpen] = useState(isActive)
  const [uploadOpen, setUploadOpen] = useState(false)

  const borderColor = isPassed
    ? 'border-green-200 bg-green-50/40'
    : isActive
    ? 'border-primary/40 bg-primary/5'
    : 'border-border'

  return (
    <div className={`rounded-lg border ${borderColor}`}>
      <button
        type="button"
        className="w-full flex items-center justify-between px-4 py-3 text-left"
        onClick={() => setOpen(!open)}
      >
        <div className="flex items-center gap-3 min-w-0">
          {isPassed ? (
            <CheckCircle2 className="h-5 w-5 text-green-600 shrink-0" />
          ) : (
            <GoalPhaseCircle phase={isActive ? phaseNum : 0} size="sm" />
          )}
          <div className="min-w-0">
            <span className={`text-sm font-medium ${isPassed ? 'text-green-700' : ''}`}>
              Fase {phaseNum}{isPassed ? ' — beoordeeld' : ''}
            </span>
            {phaseDescription && (
              <span className="text-xs text-muted-foreground ml-2 hidden sm:inline">
                — {phaseDescription}
              </span>
            )}
          </div>
          {items.length > 0 && (
            <span className="text-xs text-muted-foreground shrink-0">({items.length})</span>
          )}
        </div>
        {open ? (
          <ChevronUp className="h-4 w-4 text-muted-foreground shrink-0" />
        ) : (
          <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
        )}
      </button>

      {open && (
        <div className="px-4 pb-4 space-y-3">
          {phaseDescription && (
            <p className="text-xs text-muted-foreground italic sm:hidden">{phaseDescription}</p>
          )}
          {items.length > 0 ? (
            <div className="space-y-2">
              {items.map((item) => (
                <PortfolioItemCard key={item.id} item={item} onDelete={onDelete} />
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Nog geen bewijs voor fase {phaseNum}.</p>
          )}
          <Button
            size="sm"
            variant={isActive ? 'default' : 'outline'}
            onClick={() => setUploadOpen(true)}
            className="gap-1"
          >
            <Plus className="h-4 w-4" />
            Bewijs toevoegen
          </Button>
        </div>
      )}

      <PortfolioUploadModal
        open={uploadOpen}
        onClose={() => setUploadOpen(false)}
        goalName={goalName}
        goalNumber={goalNumber}
        phase={phaseNum}
        onAdd={onAdd}
      />
    </div>
  )
}

export function PortfolioGoalSection({
  goalNumber,
  goalName,
  goalDescription,
  currentPhase,
  phaseDescriptions,
  itemsByPhase,
  onAdd,
  onDelete,
}: Props) {
  const statusText =
    currentPhase === 0
      ? 'Nog niet begonnen'
      : currentPhase === 4
      ? 'Afgerond'
      : `Fase ${currentPhase + 1} actief`

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center gap-3 min-w-0">
          <GoalPhaseCircle
            phase={currentPhase}
            goalName={goalName}
            description={goalDescription}
            size="md"
          />
          <div className="min-w-0">
            <p className="font-medium truncate">{goalName}</p>
            <p className="text-xs text-muted-foreground">{statusText}</p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0 space-y-2">
        {[1, 2, 3, 4].map((phaseNum) => (
          <PhaseSection
            key={phaseNum}
            phaseNum={phaseNum}
            phaseDescription={phaseDescriptions[phaseNum] || ''}
            items={itemsByPhase[phaseNum] || []}
            isActive={currentPhase < 4 && phaseNum === currentPhase + 1}
            isPassed={phaseNum <= currentPhase}
            goalNumber={goalNumber}
            goalName={goalName}
            onAdd={onAdd}
            onDelete={onDelete}
          />
        ))}
      </CardContent>
    </Card>
  )
}

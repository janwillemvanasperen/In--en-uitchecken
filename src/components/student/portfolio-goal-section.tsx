'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Plus } from 'lucide-react'
import { GoalPhaseCircle } from '@/components/shared/goal-phase-circle'
import { PortfolioItemCard } from './portfolio-item-card'
import { PortfolioUploadModal } from './portfolio-upload-modal'

interface Props {
  goalNumber: number
  goalName: string
  goalDescription: string | null
  phase: number
  phaseLabel: string
  items: any[]
  onAdd: (data: {
    goal_number: number
    title: string
    description?: string
    link_url?: string
  }) => Promise<{ error?: string }>
  onDelete: (id: string) => Promise<{ error?: string }>
}

export function PortfolioGoalSection({
  goalNumber, goalName, goalDescription, phase, phaseLabel, items, onAdd, onDelete,
}: Props) {
  const [modalOpen, setModalOpen] = useState(false)

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <GoalPhaseCircle phase={phase} goalName={goalName} description={goalDescription} size="md" />
            <div className="min-w-0">
              <p className="font-medium truncate">{goalName}</p>
              <Badge variant="outline" className="text-xs mt-0.5">{phaseLabel}</Badge>
            </div>
          </div>
          <Button size="sm" variant="outline" onClick={() => setModalOpen(true)} className="shrink-0">
            <Plus className="h-4 w-4 mr-1" />
            Bewijs
          </Button>
        </div>
      </CardHeader>

      {items.length > 0 && (
        <CardContent className="pt-0 space-y-2">
          {items.map((item) => (
            <PortfolioItemCard key={item.id} item={item} onDelete={onDelete} />
          ))}
        </CardContent>
      )}

      {items.length === 0 && (
        <CardContent className="pt-0">
          <p className="text-sm text-muted-foreground">
            Nog geen bewijs toegevoegd.
          </p>
        </CardContent>
      )}

      <PortfolioUploadModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        goalName={goalName}
        goalNumber={goalNumber}
        onAdd={onAdd}
      />
    </Card>
  )
}

'use client'

import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ExternalLink, Trash2, MessageSquare, ChevronDown, ChevronUp } from 'lucide-react'

interface Feedback {
  id: string
  feedback_text: string
  created_at: string
}

interface Props {
  item: {
    id: string
    title: string
    description: string | null
    link_url: string | null
    created_at: string
    portfolio_feedback: Feedback[]
  }
  onDelete: (id: string) => Promise<{ error?: string }>
}

export function PortfolioItemCard({ item, onDelete }: Props) {
  const [expanded, setExpanded] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const hasFeedback = item.portfolio_feedback.length > 0
  const hasNewFeedback = hasFeedback

  async function handleDelete() {
    if (!confirm('Bewijs item verwijderen?')) return
    setDeleting(true)
    await onDelete(item.id)
    setDeleting(false)
  }

  const date = new Date(item.created_at).toLocaleDateString('nl-NL', {
    day: 'numeric', month: 'short',
  })

  return (
    <Card className="border-l-4 border-l-primary/30">
      <CardContent className="p-3 space-y-2">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="text-sm font-medium truncate">{item.title}</p>
              {hasNewFeedback && (
                <Badge variant="secondary" className="text-xs shrink-0">
                  <MessageSquare className="h-3 w-3 mr-1" />
                  {item.portfolio_feedback.length} feedback
                </Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground">{date}</p>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            {item.link_url && (
              <a href={item.link_url} target="_blank" rel="noopener noreferrer">
                <Button variant="ghost" size="icon" className="h-7 w-7">
                  <ExternalLink className="h-3.5 w-3.5" />
                </Button>
              </a>
            )}
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => setExpanded(!expanded)}
            >
              {expanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-destructive hover:text-destructive"
              onClick={handleDelete}
              disabled={deleting}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>

        {expanded && (
          <div className="space-y-3 pt-1 border-t">
            {item.description && (
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">{item.description}</p>
            )}

            {hasFeedback && (
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Feedback coach
                </p>
                {item.portfolio_feedback.map((fb) => (
                  <div key={fb.id} className="rounded-md bg-muted px-3 py-2">
                    <p className="text-sm">{fb.feedback_text}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {new Date(fb.created_at).toLocaleDateString('nl-NL', {
                        day: 'numeric', month: 'short', year: 'numeric',
                      })}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

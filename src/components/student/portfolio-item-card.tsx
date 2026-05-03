'use client'

import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  ExternalLink, Trash2, MessageSquare, ChevronDown, ChevronUp,
  GraduationCap, Users, Globe, Clock, FileText, Plus,
} from 'lucide-react'
import { FeedbackRequestModal } from './feedback-request-modal'

interface CoachFeedback {
  id: string
  feedback_text: string
  created_at: string
}

interface FeedbackRequest {
  id: string
  request_type: 'coach' | 'student' | 'external'
  target_name: string | null
  target_email: string | null
  token: string | null
  status: 'pending' | 'completed'
  response_text: string | null
  responded_by_name: string | null
  responded_at: string | null
}

interface Classmate {
  id: string
  full_name: string
}

interface Props {
  item: {
    id: string
    title: string
    description: string | null
    link_url: string | null
    file_url: string | null
    created_at: string
    portfolio_feedback: CoachFeedback[]
  }
  feedbackRequests: FeedbackRequest[]
  classmates: Classmate[]
  onDelete: (id: string) => Promise<{ error?: string }>
  onRequestFeedback: (
    itemId: string,
    data: {
      request_type: 'coach' | 'student' | 'external'
      target_user_id?: string
      target_name?: string
      target_email?: string
    }
  ) => Promise<{ error?: string; token?: string }>
}

const TYPE_ICON = {
  coach: GraduationCap,
  student: Users,
  external: Globe,
}

const TYPE_LABEL = {
  coach: 'Coach',
  student: 'Medestudent',
  external: 'Externe',
}

export function PortfolioItemCard({ item, feedbackRequests, classmates, onDelete, onRequestFeedback }: Props) {
  const [expanded, setExpanded] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [requestOpen, setRequestOpen] = useState(false)

  const coachFeedback = item.portfolio_feedback
  const pendingRequests = feedbackRequests.filter((r) => r.status === 'pending')
  const completedResponses = feedbackRequests.filter((r) => r.status === 'completed')

  const totalFeedbackCount = coachFeedback.length + completedResponses.length
  const hasPending = pendingRequests.length > 0

  async function handleDelete() {
    if (!confirm('Bewijs item verwijderen?')) return
    setDeleting(true)
    await onDelete(item.id)
    setDeleting(false)
  }

  const date = new Date(item.created_at).toLocaleDateString('nl-NL', {
    day: 'numeric', month: 'short',
  })

  const isFile = item.file_url && !item.link_url
  const hasExternalLink = !!item.link_url

  return (
    <Card className="border-l-4 border-l-primary/30">
      <CardContent className="p-3 space-y-2">
        {/* Header row */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              {isFile && <FileText className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />}
              <p className="text-sm font-medium truncate">{item.title}</p>
              {totalFeedbackCount > 0 && (
                <Badge variant="secondary" className="text-xs shrink-0">
                  <MessageSquare className="h-3 w-3 mr-1" />
                  {totalFeedbackCount} feedback
                </Badge>
              )}
              {hasPending && (
                <Badge variant="outline" className="text-xs shrink-0 border-[#ffd100] text-[#ffd100]">
                  <Clock className="h-3 w-3 mr-1" />
                  {pendingRequests.length} wacht
                </Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground">{date}</p>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            {hasExternalLink && (
              <a href={item.link_url!} target="_blank" rel="noopener noreferrer">
                <Button variant="ghost" size="icon" className="h-7 w-7">
                  <ExternalLink className="h-3.5 w-3.5" />
                </Button>
              </a>
            )}
            {item.file_url && !hasExternalLink && (
              <a href={item.file_url} target="_blank" rel="noopener noreferrer">
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

        {/* Expanded section */}
        {expanded && (
          <div className="space-y-3 pt-1 border-t">
            {item.description && (
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">{item.description}</p>
            )}

            {/* Coach feedback */}
            {coachFeedback.length > 0 && (
              <FeedbackSection label="Feedback coach" icon={GraduationCap}>
                {coachFeedback.map((fb) => (
                  <FeedbackBubble
                    key={fb.id}
                    text={fb.feedback_text}
                    date={fb.created_at}
                    name="Coach"
                  />
                ))}
              </FeedbackSection>
            )}

            {/* Responses from requests */}
            {completedResponses.map((req) => {
              const Icon = TYPE_ICON[req.request_type]
              return (
                <FeedbackSection key={req.id} label={`Feedback ${TYPE_LABEL[req.request_type]}`} icon={Icon}>
                  <FeedbackBubble
                    text={req.response_text || ''}
                    date={req.responded_at || req.responded_at || ''}
                    name={req.responded_by_name || req.target_name || TYPE_LABEL[req.request_type]}
                  />
                </FeedbackSection>
              )
            })}

            {/* Pending requests */}
            {pendingRequests.length > 0 && (
              <div className="space-y-1">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Wacht op feedback
                </p>
                {pendingRequests.map((req) => {
                  const Icon = TYPE_ICON[req.request_type]
                  return (
                    <div key={req.id} className="flex items-center gap-2 text-xs text-muted-foreground py-1 px-2 rounded-md bg-muted/50">
                      <Icon className="h-3.5 w-3.5 shrink-0" />
                      <span className="flex-1">
                        {TYPE_LABEL[req.request_type]}
                        {req.target_name && `: ${req.target_name}`}
                        {req.target_email && `: ${req.target_email}`}
                      </span>
                      <Clock className="h-3 w-3 shrink-0" />
                    </div>
                  )
                })}
              </div>
            )}

            {/* Request feedback button */}
            <Button
              size="sm"
              variant="outline"
              className="gap-1.5 h-7 text-xs"
              onClick={() => setRequestOpen(true)}
            >
              <Plus className="h-3.5 w-3.5" />
              Feedback aanvragen
            </Button>
          </div>
        )}

        {/* Feedback request button when collapsed and no feedback yet */}
        {!expanded && totalFeedbackCount === 0 && !hasPending && (
          <Button
            size="sm"
            variant="ghost"
            className="gap-1.5 h-6 text-xs text-muted-foreground px-2"
            onClick={() => setRequestOpen(true)}
          >
            <MessageSquare className="h-3 w-3" />
            Feedback aanvragen
          </Button>
        )}
      </CardContent>

      <FeedbackRequestModal
        open={requestOpen}
        onClose={() => setRequestOpen(false)}
        itemTitle={item.title}
        classmates={classmates}
        onSubmit={(data) => onRequestFeedback(item.id, data)}
      />
    </Card>
  )
}

function FeedbackSection({ label, icon: Icon, children }: {
  label: string
  icon: typeof GraduationCap
  children: React.ReactNode
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-1.5">
        <Icon className="h-3.5 w-3.5 text-muted-foreground" />
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{label}</p>
      </div>
      {children}
    </div>
  )
}

function FeedbackBubble({ text, date, name }: { text: string; date: string; name: string }) {
  const d = date ? new Date(date).toLocaleDateString('nl-NL', {
    day: 'numeric', month: 'short', year: 'numeric',
  }) : ''
  return (
    <div className="rounded-md bg-muted px-3 py-2">
      <p className="text-sm">{text}</p>
      <p className="text-xs text-muted-foreground mt-1">{name}{d ? ` · ${d}` : ''}</p>
    </div>
  )
}

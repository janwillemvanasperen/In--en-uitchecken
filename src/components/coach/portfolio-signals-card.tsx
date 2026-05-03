import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { AlertTriangle, Clock, FileX } from 'lucide-react'
import Link from 'next/link'

interface NoEvidenceStudent {
  id: string
  full_name: string
  daysSinceLastItem: number | null
}

interface PendingFeedbackItem {
  id: string
  title: string
  goal_number: number
  student_id: string
  student_name: string
  daysWaiting: number
}

interface Props {
  noEvidenceStudents: NoEvidenceStudent[]
  pendingFeedbackItems: PendingFeedbackItem[]
  view: string
}

export function PortfolioSignalsCard({ noEvidenceStudents, pendingFeedbackItems, view }: Props) {
  if (noEvidenceStudents.length === 0 && pendingFeedbackItems.length === 0) return null

  return (
    <Card className="border-orange-200 bg-orange-50/50 dark:bg-orange-950/10 dark:border-orange-900">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2 text-orange-700 dark:text-orange-400">
          <AlertTriangle className="h-4 w-4" />
          Signalen — portfolio
          <Badge variant="outline" className="ml-auto text-orange-600 border-orange-300">
            {noEvidenceStudents.length + pendingFeedbackItems.length}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {noEvidenceStudents.length > 0 && (
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2 flex items-center gap-1.5">
              <FileX className="h-3.5 w-3.5" />
              Geen bewijs ingediend (14+ dagen)
            </p>
            <div className="space-y-1">
              {noEvidenceStudents.map((s) => (
                <Link
                  key={s.id}
                  href={`/coach/students/${s.id}?tab=werk&view=${view}`}
                  className="flex items-center justify-between p-2 rounded-lg bg-background hover:bg-muted/60 transition-colors"
                >
                  <span className="text-sm font-medium">{s.full_name}</span>
                  <span className="text-xs text-muted-foreground">
                    {s.daysSinceLastItem === null
                      ? 'Nooit bewijs ingediend'
                      : `${s.daysSinceLastItem} dagen geleden`}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        )}

        {pendingFeedbackItems.length > 0 && (
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2 flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5" />
              Wacht op feedback (5+ dagen)
            </p>
            <div className="space-y-1">
              {pendingFeedbackItems.map((item) => (
                <Link
                  key={item.id}
                  href={`/coach/students/${item.student_id}?tab=werk&view=${view}`}
                  className="flex items-center justify-between p-2 rounded-lg bg-background hover:bg-muted/60 transition-colors"
                >
                  <div className="min-w-0">
                    <span className="text-sm font-medium truncate block">{item.student_name}</span>
                    <span className="text-xs text-muted-foreground truncate block">
                      Doel {item.goal_number} · {item.title}
                    </span>
                  </div>
                  <span className="text-xs text-muted-foreground shrink-0 ml-2">
                    {item.daysWaiting}d wacht
                  </span>
                </Link>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

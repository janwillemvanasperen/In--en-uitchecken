// @ts-nocheck
import { requireAdmin } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { CalendarLabelsList } from '@/components/admin/calendar-labels-editor'

export const dynamic = 'force-dynamic'

export default async function AdminCalendarLabelsPage() {
  await requireAdmin()
  const adminClient = createAdminClient()

  const { data: labels } = await adminClient
    .from('calendar_event_labels')
    .select('*')
    .order('sort_order')

  return (
    <div className="container mx-auto px-4 py-6 space-y-6 max-w-2xl">
      <h1 className="text-xl font-bold">Kalender labels</h1>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Labels beheren</CardTitle>
        </CardHeader>
        <CardContent>
          <CalendarLabelsList labels={labels || []} />
        </CardContent>
      </Card>
    </div>
  )
}

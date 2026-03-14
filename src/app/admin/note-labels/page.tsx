// @ts-nocheck
import { requireAdmin } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { NoteLabelsList } from '@/components/admin/note-labels-editor'

export const dynamic = 'force-dynamic'

export default async function AdminNoteLabelsPage() {
  await requireAdmin()
  const adminClient = createAdminClient()

  const { data: labels } = await adminClient
    .from('note_labels')
    .select('*')
    .order('sort_order')

  return (
    <div className="container mx-auto px-4 py-6 space-y-6 max-w-2xl">
      <h1 className="text-xl font-bold">Notitie labels</h1>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Labels beheren</CardTitle>
        </CardHeader>
        <CardContent>
          <NoteLabelsList labels={labels || []} />
        </CardContent>
      </Card>
    </div>
  )
}

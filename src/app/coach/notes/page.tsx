// @ts-nocheck
import { requireCoach } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase/server'
import { FileText } from 'lucide-react'
import { NewNoteButton } from '@/components/coach/new-note-button'
import { NotesFilterView } from '@/components/coach/notes-filter-view'

export const dynamic = 'force-dynamic'

export default async function CoachNotesPage() {
  const user = await requireCoach()
  const adminClient = createAdminClient()

  const [{ data: notes }, { data: noteLabels }, { data: students }, { data: otherCoaches }] =
    await Promise.all([
      adminClient
        .from('coach_notes')
        .select('*, users!coach_notes_student_id_fkey(id, full_name)')
        .eq('coach_id', user.id)
        .order('updated_at', { ascending: false }),
      adminClient
        .from('note_labels')
        .select('id, name, color')
        .eq('active', true)
        .order('sort_order'),
      adminClient
        .from('users')
        .select('id, full_name')
        .eq('role', 'student')
        .order('full_name'),
      adminClient
        .from('users')
        .select('id, full_name')
        .contains('roles', ['coach'])
        .neq('id', user.id)
        .order('full_name'),
    ])

  const noteRows = (notes || []).map((n: any) => ({
    id: n.id,
    student_id: n.student_id,
    student_name: n.users?.full_name ?? '',
    note_text: n.note_text,
    label_id: n.label_id ?? null,
    visible_to_student: n.visible_to_student,
    visible_to_coaches: n.visible_to_coaches,
    updated_at: n.updated_at,
  }))

  return (
    <div className="space-y-4 max-w-2xl">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">Mijn Notities</h1>
        <div className="flex items-center gap-3">
          <span className="text-sm text-muted-foreground">{noteRows.length} notities</span>
          <NewNoteButton
            students={students || []}
            availableLabels={noteLabels || []}
            availableCoaches={otherCoaches || []}
          />
        </div>
      </div>

      {noteRows.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <FileText className="h-10 w-10 mx-auto mb-3 opacity-30" />
          <p className="text-sm">Nog geen notities. Maak een nieuwe notitie aan.</p>
        </div>
      ) : (
        <NotesFilterView notes={noteRows} labels={noteLabels || []} />
      )}
    </div>
  )
}

// @ts-nocheck
import { requireCoach } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase/server'
import { Card, CardContent } from '@/components/ui/card'
import { FileText, Eye, EyeOff, Users } from 'lucide-react'
import { NewNoteButton } from '@/components/coach/new-note-button'

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

  const labelMap: Record<string, { name: string; color: string }> = {}
  for (const l of noteLabels || []) labelMap[l.id] = l

  // Group by student
  const byStudent: Record<string, { student: any; notes: any[] }> = {}
  for (const note of notes || []) {
    const sid = note.student_id
    if (!byStudent[sid]) byStudent[sid] = { student: note.users, notes: [] }
    byStudent[sid].notes.push(note)
  }
  const groups = Object.values(byStudent)

  return (
    <div className="space-y-4 max-w-2xl">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">Mijn Notities</h1>
        <div className="flex items-center gap-3">
          <span className="text-sm text-muted-foreground">{(notes || []).length} notities</span>
          <NewNoteButton
            students={students || []}
            availableLabels={noteLabels || []}
            availableCoaches={otherCoaches || []}
          />
        </div>
      </div>

      {groups.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <FileText className="h-10 w-10 mx-auto mb-3 opacity-30" />
          <p className="text-sm">Nog geen notities. Maak een nieuwe notitie aan.</p>
        </div>
      )}

      {groups.map(({ student, notes: studentNotes }) => (
        <div key={student?.id} className="space-y-2">
          <a
            href={`/coach/students/${student?.id}?tab=notities`}
            className="font-medium text-sm hover:underline flex items-center gap-2"
          >
            {student?.full_name}
            <span className="text-xs font-normal text-muted-foreground bg-muted px-1.5 py-0.5 rounded-full">
              {studentNotes.length}
            </span>
          </a>
          {studentNotes.map((note: any) => {
            const label = note.label_id ? labelMap[note.label_id] : null
            return (
              <Card key={note.id}>
                <CardContent className="py-3">
                  {label && (
                    <div className="flex items-center gap-1.5 mb-1.5">
                      <span
                        className="inline-block h-2 w-2 rounded-full"
                        style={{ background: label.color }}
                      />
                      <span className="text-xs font-medium" style={{ color: label.color }}>
                        {label.name}
                      </span>
                    </div>
                  )}
                  <p className="text-sm whitespace-pre-wrap">{note.note_text}</p>
                  <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                    <span>
                      {new Date(note.updated_at).toLocaleDateString('nl-NL', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                      })}
                    </span>
                    {note.visible_to_student ? (
                      <span className="flex items-center gap-1 text-green-600">
                        <Eye className="h-3 w-3" /> Zichtbaar voor student
                      </span>
                    ) : (
                      <span className="flex items-center gap-1">
                        <EyeOff className="h-3 w-3" /> Niet zichtbaar
                      </span>
                    )}
                    {note.visible_to_coaches && (
                      <span className="flex items-center gap-1">
                        <Users className="h-3 w-3" /> Gedeeld
                      </span>
                    )}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      ))}
    </div>
  )
}

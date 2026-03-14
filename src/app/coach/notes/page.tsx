// @ts-nocheck
import { requireCoach } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import { FileText, Eye, EyeOff, Users } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function CoachNotesPage() {
  const user = await requireCoach()
  const supabase = await createClient()

  const { data: notes } = await supabase
    .from('coach_notes')
    .select('*, users!coach_notes_student_id_fkey(id, full_name)')
    .eq('coach_id', user.id)
    .order('updated_at', { ascending: false })

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
        <span className="text-sm text-muted-foreground">{(notes || []).length} notities</span>
      </div>

      {groups.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <FileText className="h-10 w-10 mx-auto mb-3 opacity-30" />
          <p className="text-sm">Nog geen notities. Open een studentpagina om een notitie te maken.</p>
        </div>
      )}

      {groups.map(({ student, notes: studentNotes }) => (
        <div key={student?.id} className="space-y-2">
          <div className="flex items-center gap-2">
            <Link href={`/coach/students/${student?.id}?tab=notities`} className="font-medium text-sm hover:underline">
              {student?.full_name}
            </Link>
            <Badge variant="outline" className="text-xs">{studentNotes.length}</Badge>
          </div>
          {studentNotes.map((note: any) => (
            <Card key={note.id}>
              <CardContent className="py-3">
                <p className="text-sm whitespace-pre-wrap">{note.note_text}</p>
                <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                  <span>{new Date(note.updated_at).toLocaleDateString('nl-NL', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                  {note.visible_to_student ? (
                    <span className="flex items-center gap-1 text-green-600"><Eye className="h-3 w-3" /> Zichtbaar voor student</span>
                  ) : (
                    <span className="flex items-center gap-1"><EyeOff className="h-3 w-3" /> Niet zichtbaar</span>
                  )}
                  {note.visible_to_coaches && (
                    <span className="flex items-center gap-1"><Users className="h-3 w-3" /> Gedeeld</span>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ))}
    </div>
  )
}

'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { Loader2, Pencil, Trash2, Eye, EyeOff, Users } from 'lucide-react'
import { createNote, updateNote, deleteNote } from '@/app/coach/actions'

interface Note {
  id: string
  coach_id: string
  note_text: string
  visible_to_student: boolean
  visible_to_coaches: boolean
  created_at: string
  updated_at: string
  coach?: { full_name: string } | null
}

interface NoteEditorProps {
  studentId: string
  currentCoachId: string
  myNotes: Note[]
  colleagueNotes: Note[]
}

function NoteForm({
  studentId,
  initial,
  onDone,
}: {
  studentId: string
  initial?: Note
  onDone: () => void
}) {
  const [text, setText] = useState(initial?.note_text ?? '')
  const [visibleToStudent, setVisibleToStudent] = useState(initial?.visible_to_student ?? false)
  const [visibleToCoaches, setVisibleToCoaches] = useState(initial?.visible_to_coaches ?? true)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async () => {
    if (!text.trim()) return
    setLoading(true)
    const result = initial
      ? await updateNote(initial.id, text.trim(), visibleToStudent, visibleToCoaches)
      : await createNote(studentId, text.trim(), visibleToStudent, visibleToCoaches)
    setLoading(false)
    if (result.error) {
      setError(result.error)
    } else {
      onDone()
    }
  }

  return (
    <div className="space-y-3 rounded-lg border p-4 bg-muted/30">
      <Textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Schrijf je notitie hier..."
        rows={4}
        className="resize-none"
      />
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <Checkbox
            id="visible-student"
            checked={visibleToStudent}
            onCheckedChange={(v) => setVisibleToStudent(!!v)}
          />
          <Label htmlFor="visible-student" className="text-sm font-normal cursor-pointer flex items-center gap-1">
            <Eye className="h-3.5 w-3.5" /> Zichtbaar voor student
          </Label>
        </div>
        <div className="flex items-center gap-2">
          <Checkbox
            id="visible-coaches"
            checked={visibleToCoaches}
            onCheckedChange={(v) => setVisibleToCoaches(!!v)}
          />
          <Label htmlFor="visible-coaches" className="text-sm font-normal cursor-pointer flex items-center gap-1">
            <Users className="h-3.5 w-3.5" /> Delen met coaches
          </Label>
        </div>
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
      <div className="flex gap-2">
        <Button
          size="sm"
          onClick={handleSubmit}
          disabled={loading || !text.trim()}
          className="bg-[#ffd100] text-black hover:bg-[#ffd100]/90"
        >
          {loading && <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />}
          {initial ? 'Opslaan' : 'Notitie toevoegen'}
        </Button>
        <Button size="sm" variant="ghost" onClick={onDone}>
          Annuleren
        </Button>
      </div>
    </div>
  )
}

function MyNoteCard({ note, studentId, currentCoachId }: { note: Note; studentId: string; currentCoachId: string }) {
  const [editing, setEditing] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const handleDelete = async () => {
    if (!confirm('Notitie verwijderen?')) return
    setDeleting(true)
    await deleteNote(note.id)
    setDeleting(false)
  }

  if (editing) {
    return <NoteForm studentId={studentId} initial={note} onDone={() => setEditing(false)} />
  }

  return (
    <div className="rounded-lg border p-3 bg-background space-y-2">
      <p className="text-sm whitespace-pre-wrap">{note.note_text}</p>
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span>{new Date(note.created_at).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
          {note.updated_at !== note.created_at && <span>(bewerkt)</span>}
          <span className="flex items-center gap-0.5">
            {note.visible_to_student ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
          </span>
          {note.visible_to_coaches && <Users className="h-3 w-3" />}
        </div>
        <div className="flex gap-1">
          <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => setEditing(true)}>
            <Pencil className="h-3.5 w-3.5" />
          </Button>
          <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-destructive hover:text-destructive" onClick={handleDelete} disabled={deleting}>
            {deleting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
          </Button>
        </div>
      </div>
    </div>
  )
}

export function NoteEditor({ studentId, currentCoachId, myNotes, colleagueNotes }: NoteEditorProps) {
  const [showForm, setShowForm] = useState(false)

  return (
    <div className="space-y-6">
      {/* Add note button */}
      {!showForm && (
        <Button
          onClick={() => setShowForm(true)}
          className="bg-[#ffd100] text-black hover:bg-[#ffd100]/90"
          size="sm"
        >
          <Pencil className="h-3.5 w-3.5 mr-1.5" />
          Nieuwe notitie
        </Button>
      )}

      {showForm && (
        <NoteForm studentId={studentId} onDone={() => setShowForm(false)} />
      )}

      {/* My notes */}
      <div>
        <h3 className="text-sm font-semibold mb-3">Mijn Notities</h3>
        {myNotes.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nog geen notities.</p>
        ) : (
          <div className="space-y-2">
            {myNotes.map((note) => (
              <MyNoteCard key={note.id} note={note} studentId={studentId} currentCoachId={currentCoachId} />
            ))}
          </div>
        )}
      </div>

      {/* Colleague notes */}
      {colleagueNotes.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold mb-3">Notities van Collega's</h3>
          <div className="space-y-2">
            {colleagueNotes.map((note) => (
              <div key={note.id} className="rounded-lg border p-3 bg-muted/20 space-y-2">
                <p className="text-sm whitespace-pre-wrap">{note.note_text}</p>
                <div className="text-xs text-muted-foreground flex items-center gap-2">
                  <span className="font-medium">{note.coach?.full_name ?? 'Coach'}</span>
                  <span>·</span>
                  <span>{new Date(note.created_at).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

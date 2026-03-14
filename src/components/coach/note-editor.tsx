'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { Loader2, Pencil, Trash2, Eye, EyeOff, Users, Bell, X } from 'lucide-react'
import { createNote, updateNote, deleteNote } from '@/app/coach/actions'

const PERIOD_OPTIONS = [
  { value: 'all',       label: 'Alle periodes' },
  { value: 'today',     label: 'Vandaag' },
  { value: 'this_week', label: 'Deze week' },
  { value: 'this_month',label: 'Deze maand' },
  { value: 'this_year', label: 'Dit jaar' },
]

function periodStart(period: string): Date | null {
  const now = new Date()
  if (period === 'today') return new Date(now.getFullYear(), now.getMonth(), now.getDate())
  if (period === 'this_week') {
    const d = new Date(now); const day = d.getDay() || 7; d.setDate(d.getDate() - day + 1); d.setHours(0,0,0,0); return d
  }
  if (period === 'this_month') return new Date(now.getFullYear(), now.getMonth(), 1)
  if (period === 'this_year') return new Date(now.getFullYear(), 0, 1)
  return null
}

export interface NoteLabel {
  id: string
  name: string
  color: string
}

export interface CoachUser {
  id: string
  full_name: string
}

interface Note {
  id: string
  coach_id: string
  note_text: string
  visible_to_student: boolean
  visible_to_coaches: boolean
  label_id?: string | null
  label?: NoteLabel | null
  created_at: string
  updated_at: string
  coach?: { full_name: string } | null
}

interface NoteEditorProps {
  studentId: string
  currentCoachId: string
  myNotes: Note[]
  colleagueNotes: Note[]
  availableLabels?: NoteLabel[]
  availableCoaches?: CoachUser[]
}

function LabelDot({ color }: { color: string }) {
  return <span className="inline-block h-2 w-2 rounded-full shrink-0" style={{ background: color }} />
}

function NoteForm({
  studentId,
  initial,
  availableLabels,
  availableCoaches,
  onDone,
}: {
  studentId: string
  initial?: Note
  availableLabels: NoteLabel[]
  availableCoaches: CoachUser[]
  onDone: () => void
}) {
  const [text, setText] = useState(initial?.note_text ?? '')
  const [visibleToStudent, setVisibleToStudent] = useState(initial?.visible_to_student ?? false)
  const [visibleToCoaches, setVisibleToCoaches] = useState(initial?.visible_to_coaches ?? true)
  const [labelId, setLabelId] = useState<string>(initial?.label_id ?? '__none__')
  const [notifyIds, setNotifyIds] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const toggleNotify = (id: string) => {
    setNotifyIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
  }

  const handleSubmit = async () => {
    if (!text.trim()) return
    setLoading(true)
    const lid = labelId === '__none__' ? null : labelId
    const result = initial
      ? await updateNote(initial.id, text.trim(), visibleToStudent, visibleToCoaches, lid)
      : await createNote(studentId, text.trim(), visibleToStudent, visibleToCoaches, lid, notifyIds)
    setLoading(false)
    if (result.error) {
      setError(result.error)
    } else {
      onDone()
    }
  }

  return (
    <div className="space-y-3 rounded-lg border p-4 bg-muted/30">
      {/* Label selector */}
      {availableLabels.length > 0 && (
        <Select value={labelId} onValueChange={setLabelId}>
          <SelectTrigger className="h-8 text-sm w-56">
            <SelectValue placeholder="Label kiezen..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__none__">Geen label</SelectItem>
            {availableLabels.map(l => (
              <SelectItem key={l.id} value={l.id}>
                <div className="flex items-center gap-2">
                  <LabelDot color={l.color} />
                  {l.name}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

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

      {/* Notify coaches (only on create) */}
      {!initial && availableCoaches.length > 0 && (
        <div className="space-y-1.5">
          <p className="text-xs font-medium text-muted-foreground flex items-center gap-1">
            <Bell className="h-3 w-3" /> Coaches informeren
          </p>
          <div className="flex flex-wrap gap-3">
            {availableCoaches.map(c => (
              <div key={c.id} className="flex items-center gap-1.5">
                <Checkbox
                  id={`notify-${c.id}`}
                  checked={notifyIds.includes(c.id)}
                  onCheckedChange={() => toggleNotify(c.id)}
                />
                <Label htmlFor={`notify-${c.id}`} className="text-sm font-normal cursor-pointer">
                  {c.full_name}
                </Label>
              </div>
            ))}
          </div>
        </div>
      )}

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

function MyNoteCard({
  note,
  studentId,
  availableLabels,
}: {
  note: Note
  studentId: string
  availableLabels: NoteLabel[]
}) {
  const [editing, setEditing] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const handleDelete = async () => {
    if (!confirm('Notitie verwijderen?')) return
    setDeleting(true)
    await deleteNote(note.id)
    setDeleting(false)
  }

  const label = note.label ?? availableLabels.find(l => l.id === note.label_id) ?? null

  if (editing) {
    return (
      <NoteForm
        studentId={studentId}
        initial={note}
        availableLabels={availableLabels}
        availableCoaches={[]}
        onDone={() => setEditing(false)}
      />
    )
  }

  return (
    <div className="rounded-lg border p-3 bg-background space-y-2">
      {label && (
        <div className="flex items-center gap-1.5">
          <LabelDot color={label.color} />
          <span className="text-xs font-medium" style={{ color: label.color }}>{label.name}</span>
        </div>
      )}
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

export function NoteEditor({
  studentId,
  currentCoachId,
  myNotes,
  colleagueNotes,
  availableLabels = [],
  availableCoaches = [],
}: NoteEditorProps) {
  const [showForm, setShowForm] = useState(false)
  const [labelFilter, setLabelFilter] = useState('all')
  const [sourceFilter, setSourceFilter] = useState('all') // 'all' | 'mine' | 'colleagues'
  const [periodFilter, setPeriodFilter] = useState('all')

  const hasFilters = labelFilter !== 'all' || sourceFilter !== 'all' || periodFilter !== 'all'

  const filterNote = (note: Note) => {
    if (labelFilter !== 'all') {
      if (labelFilter === '__none__' && note.label_id) return false
      if (labelFilter !== '__none__' && note.label_id !== labelFilter) return false
    }
    const since = periodStart(periodFilter)
    if (since && new Date(note.created_at) < since) return false
    return true
  }

  const visibleMyNotes = sourceFilter === 'colleagues' ? [] : myNotes.filter(filterNote)
  const visibleColleagueNotes = sourceFilter === 'mine' ? [] : colleagueNotes.filter(filterNote)
  const totalVisible = visibleMyNotes.length + visibleColleagueNotes.length
  const totalAll = myNotes.length + colleagueNotes.length

  return (
    <div className="space-y-5">
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
        <NoteForm
          studentId={studentId}
          availableLabels={availableLabels}
          availableCoaches={availableCoaches}
          onDone={() => setShowForm(false)}
        />
      )}

      {/* Filters */}
      {totalAll > 0 && (
        <div className="flex flex-wrap gap-2 items-center border rounded-lg px-3 py-2 bg-muted/20">
          {availableLabels.length > 0 && (
            <Select value={labelFilter} onValueChange={setLabelFilter}>
              <SelectTrigger className="h-7 text-xs w-40 bg-background">
                <SelectValue placeholder="Label" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alle labels</SelectItem>
                <SelectItem value="__none__">Geen label</SelectItem>
                {availableLabels.map(l => (
                  <SelectItem key={l.id} value={l.id}>
                    <div className="flex items-center gap-2">
                      <LabelDot color={l.color} />
                      {l.name}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          {colleagueNotes.length > 0 && (
            <Select value={sourceFilter} onValueChange={setSourceFilter}>
              <SelectTrigger className="h-7 text-xs w-36 bg-background">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alle coaches</SelectItem>
                <SelectItem value="mine">Alleen mijn notities</SelectItem>
                <SelectItem value="colleagues">Alleen collega&apos;s</SelectItem>
              </SelectContent>
            </Select>
          )}
          <Select value={periodFilter} onValueChange={setPeriodFilter}>
            <SelectTrigger className="h-7 text-xs w-36 bg-background">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PERIOD_OPTIONS.map(o => (
                <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {hasFilters && (
            <button
              className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-0.5"
              onClick={() => { setLabelFilter('all'); setSourceFilter('all'); setPeriodFilter('all') }}
            >
              <X className="h-3 w-3" /> Wis
            </button>
          )}
          {hasFilters && (
            <span className="ml-auto text-xs text-muted-foreground">
              {totalVisible} van {totalAll}
            </span>
          )}
        </div>
      )}

      {/* My notes */}
      {sourceFilter !== 'colleagues' && (
        <div>
          <h3 className="text-sm font-semibold mb-3">Mijn Notities</h3>
          {visibleMyNotes.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              {hasFilters ? 'Geen notities voor deze filters.' : 'Nog geen notities.'}
            </p>
          ) : (
            <div className="space-y-2">
              {visibleMyNotes.map((note) => (
                <MyNoteCard key={note.id} note={note} studentId={studentId} availableLabels={availableLabels} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Colleague notes */}
      {sourceFilter !== 'mine' && colleagueNotes.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold mb-3">Notities van Collega&apos;s</h3>
          {visibleColleagueNotes.length === 0 ? (
            <p className="text-sm text-muted-foreground">Geen notities voor deze filters.</p>
          ) : (
            <div className="space-y-2">
              {visibleColleagueNotes.map((note) => {
                const label = availableLabels.find(l => l.id === note.label_id) ?? null
                return (
                  <div key={note.id} className="rounded-lg border p-3 bg-muted/20 space-y-2">
                    {label && (
                      <div className="flex items-center gap-1.5">
                        <LabelDot color={label.color} />
                        <span className="text-xs font-medium" style={{ color: label.color }}>{label.name}</span>
                      </div>
                    )}
                    <p className="text-sm whitespace-pre-wrap">{note.note_text}</p>
                    <div className="text-xs text-muted-foreground flex items-center gap-2">
                      <span className="font-medium">{note.coach?.full_name ?? 'Coach'}</span>
                      <span>·</span>
                      <span>{new Date(note.created_at).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

'use client'

import { useState, useMemo } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { Eye, EyeOff, Users, X } from 'lucide-react'

export interface NoteRow {
  id: string
  student_id: string
  student_name: string
  note_text: string
  label_id: string | null
  visible_to_student: boolean
  visible_to_coaches: boolean
  updated_at: string
}

export interface LabelOption {
  id: string
  name: string
  color: string
}

const PERIOD_OPTIONS = [
  { value: 'all',        label: 'Alle periodes' },
  { value: 'today',      label: 'Vandaag' },
  { value: 'this_week',  label: 'Deze week' },
  { value: 'this_month', label: 'Deze maand' },
  { value: 'this_year',  label: 'Dit jaar' },
]

function startOf(period: string): Date | null {
  const now = new Date()
  if (period === 'today') {
    return new Date(now.getFullYear(), now.getMonth(), now.getDate())
  }
  if (period === 'this_week') {
    const d = new Date(now)
    const day = d.getDay() || 7
    d.setDate(d.getDate() - day + 1)
    d.setHours(0, 0, 0, 0)
    return d
  }
  if (period === 'this_month') {
    return new Date(now.getFullYear(), now.getMonth(), 1)
  }
  if (period === 'this_year') {
    return new Date(now.getFullYear(), 0, 1)
  }
  return null
}

export function NotesFilterView({
  notes,
  labels,
}: {
  notes: NoteRow[]
  labels: LabelOption[]
}) {
  const [search, setSearch] = useState('')
  const [labelFilter, setLabelFilter] = useState('all')
  const [periodFilter, setPeriodFilter] = useState('all')

  const hasFilters = search || labelFilter !== 'all' || periodFilter !== 'all'

  const clearFilters = () => {
    setSearch('')
    setLabelFilter('all')
    setPeriodFilter('all')
  }

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    const since = startOf(periodFilter)

    return notes.filter(n => {
      if (q && !n.student_name.toLowerCase().includes(q) && !n.note_text.toLowerCase().includes(q)) return false
      if (labelFilter !== 'all') {
        if (labelFilter === '__none__' && n.label_id) return false
        if (labelFilter !== '__none__' && n.label_id !== labelFilter) return false
      }
      if (since && new Date(n.updated_at) < since) return false
      return true
    })
  }, [notes, search, labelFilter, periodFilter])

  // Group by student
  const groups = useMemo(() => {
    const map: Record<string, { student_id: string; student_name: string; notes: NoteRow[] }> = {}
    for (const n of filtered) {
      if (!map[n.student_id]) map[n.student_id] = { student_id: n.student_id, student_name: n.student_name, notes: [] }
      map[n.student_id].notes.push(n)
    }
    return Object.values(map)
  }, [filtered])

  const labelMap = Object.fromEntries(labels.map(l => [l.id, l]))

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap gap-2 items-center">
        <Input
          placeholder="Zoeken op student of tekst..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="h-8 text-sm w-52"
        />
        <Select value={labelFilter} onValueChange={setLabelFilter}>
          <SelectTrigger className="h-8 text-xs w-44">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Alle labels</SelectItem>
            <SelectItem value="__none__">Geen label</SelectItem>
            {labels.map(l => (
              <SelectItem key={l.id} value={l.id}>
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full inline-block shrink-0" style={{ background: l.color }} />
                  {l.name}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={periodFilter} onValueChange={setPeriodFilter}>
          <SelectTrigger className="h-8 text-xs w-36">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {PERIOD_OPTIONS.map(o => (
              <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        {hasFilters && (
          <Button variant="ghost" size="sm" className="h-8 text-xs" onClick={clearFilters}>
            <X className="h-3 w-3 mr-1" /> Wis filters
          </Button>
        )}
        <span className="ml-auto text-xs text-muted-foreground">
          {filtered.length} van {notes.length} notities
        </span>
      </div>

      {/* Results */}
      {groups.length === 0 && (
        <p className="text-sm text-muted-foreground py-6 text-center">Geen notities gevonden.</p>
      )}

      {groups.map(({ student_id, student_name, notes: studentNotes }) => (
        <div key={student_id} className="space-y-2">
          <a
            href={`/coach/students/${student_id}?tab=notities`}
            className="font-medium text-sm hover:underline flex items-center gap-2"
          >
            {student_name}
            <span className="text-xs font-normal text-muted-foreground bg-muted px-1.5 py-0.5 rounded-full">
              {studentNotes.length}
            </span>
          </a>
          {studentNotes.map(note => {
            const label = note.label_id ? labelMap[note.label_id] : null
            return (
              <Card key={note.id}>
                <CardContent className="py-3">
                  {label && (
                    <div className="flex items-center gap-1.5 mb-1.5">
                      <span className="inline-block h-2 w-2 rounded-full" style={{ background: label.color }} />
                      <span className="text-xs font-medium" style={{ color: label.color }}>{label.name}</span>
                    </div>
                  )}
                  <p className="text-sm whitespace-pre-wrap">{note.note_text}</p>
                  <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                    <span>
                      {new Date(note.updated_at).toLocaleDateString('nl-NL', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </span>
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
            )
          })}
        </div>
      ))}
    </div>
  )
}

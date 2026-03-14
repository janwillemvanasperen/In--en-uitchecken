'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog'
import { Loader2, Pencil, Eye, Users, Bell } from 'lucide-react'
import { createNote } from '@/app/coach/actions'

interface Student { id: string; full_name: string }
interface NoteLabel { id: string; name: string; color: string }
interface CoachUser { id: string; full_name: string }

function LabelDot({ color }: { color: string }) {
  return <span className="inline-block h-2 w-2 rounded-full shrink-0" style={{ background: color }} />
}

export function NewNoteButton({
  students,
  availableLabels,
  availableCoaches,
}: {
  students: Student[]
  availableLabels: NoteLabel[]
  availableCoaches: CoachUser[]
}) {
  const [open, setOpen] = useState(false)
  const [studentId, setStudentId] = useState('')
  const [text, setText] = useState('')
  const [labelId, setLabelId] = useState('__none__')
  const [visibleToStudent, setVisibleToStudent] = useState(false)
  const [visibleToCoaches, setVisibleToCoaches] = useState(true)
  const [notifyIds, setNotifyIds] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const reset = () => {
    setStudentId('')
    setText('')
    setLabelId('__none__')
    setVisibleToStudent(false)
    setVisibleToCoaches(true)
    setNotifyIds([])
    setError(null)
  }

  const toggleNotify = (id: string) =>
    setNotifyIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])

  const handleSubmit = async () => {
    if (!studentId || !text.trim()) return
    setLoading(true)
    const lid = labelId === '__none__' ? null : labelId
    const result = await createNote(studentId, text.trim(), visibleToStudent, visibleToCoaches, lid, notifyIds)
    setLoading(false)
    if (result.error) {
      setError(result.error)
    } else {
      reset()
      setOpen(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) reset() }}>
      <DialogTrigger asChild>
        <Button size="sm" className="bg-[#ffd100] text-black hover:bg-[#ffd100]/90">
          <Pencil className="h-3.5 w-3.5 mr-1.5" />
          Nieuwe notitie
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Nieuwe notitie</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 pt-1">
          {/* Student selector */}
          <div className="space-y-1.5">
            <Label className="text-sm">Student</Label>
            <Select value={studentId} onValueChange={setStudentId}>
              <SelectTrigger className="h-9">
                <SelectValue placeholder="Kies een student..." />
              </SelectTrigger>
              <SelectContent>
                {students.map(s => (
                  <SelectItem key={s.id} value={s.id}>{s.full_name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Label selector */}
          {availableLabels.length > 0 && (
            <div className="space-y-1.5">
              <Label className="text-sm">Label</Label>
              <Select value={labelId} onValueChange={setLabelId}>
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="Geen label" />
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
            </div>
          )}

          {/* Note text */}
          <div className="space-y-1.5">
            <Label className="text-sm">Notitie</Label>
            <Textarea
              value={text}
              onChange={e => setText(e.target.value)}
              placeholder="Schrijf je notitie hier..."
              rows={4}
              className="resize-none"
            />
          </div>

          {/* Visibility */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <Checkbox
                id="new-visible-student"
                checked={visibleToStudent}
                onCheckedChange={v => setVisibleToStudent(!!v)}
              />
              <Label htmlFor="new-visible-student" className="text-sm font-normal cursor-pointer flex items-center gap-1">
                <Eye className="h-3.5 w-3.5" /> Zichtbaar voor student
              </Label>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                id="new-visible-coaches"
                checked={visibleToCoaches}
                onCheckedChange={v => setVisibleToCoaches(!!v)}
              />
              <Label htmlFor="new-visible-coaches" className="text-sm font-normal cursor-pointer flex items-center gap-1">
                <Users className="h-3.5 w-3.5" /> Delen met coaches
              </Label>
            </div>
          </div>

          {/* Notify coaches */}
          {availableCoaches.length > 0 && (
            <div className="space-y-1.5">
              <p className="text-sm font-medium flex items-center gap-1">
                <Bell className="h-3.5 w-3.5" /> Coaches informeren
              </p>
              <div className="flex flex-wrap gap-3">
                {availableCoaches.map(c => (
                  <div key={c.id} className="flex items-center gap-1.5">
                    <Checkbox
                      id={`new-notify-${c.id}`}
                      checked={notifyIds.includes(c.id)}
                      onCheckedChange={() => toggleNotify(c.id)}
                    />
                    <Label htmlFor={`new-notify-${c.id}`} className="text-sm font-normal cursor-pointer">
                      {c.full_name}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
          )}

          {error && <p className="text-sm text-destructive">{error}</p>}

          <div className="flex gap-2 pt-1">
            <Button
              onClick={handleSubmit}
              disabled={loading || !studentId || !text.trim()}
              className="bg-[#ffd100] text-black hover:bg-[#ffd100]/90"
            >
              {loading && <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />}
              Notitie opslaan
            </Button>
            <Button variant="ghost" onClick={() => { reset(); setOpen(false) }}>
              Annuleren
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

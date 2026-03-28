'use client'

import { useState, useTransition } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { createCalendarLabel, updateCalendarLabel, deleteCalendarLabel } from '@/app/admin/actions'
import { Loader2, Plus, Trash2 } from 'lucide-react'

const PRESET_COLORS = [
  '#3b82f6', '#8b5cf6', '#ef4444', '#f97316',
  '#eab308', '#6b7280', '#10b981', '#ec4899',
]

interface CalendarLabel {
  id: string
  name: string
  color: string
  active: boolean
  sort_order: number
}

function ColorPicker({ value, onChange }: { value: string; onChange: (c: string) => void }) {
  return (
    <div className="flex items-center gap-1 flex-wrap">
      {PRESET_COLORS.map(c => (
        <button
          key={c}
          type="button"
          className={`h-5 w-5 rounded-full border-2 transition-all ${value === c ? 'border-foreground scale-110' : 'border-transparent'}`}
          style={{ background: c }}
          onClick={() => onChange(c)}
        />
      ))}
      <input
        type="color"
        value={value}
        onChange={e => onChange(e.target.value)}
        className="h-5 w-5 rounded cursor-pointer border-0 p-0"
        title="Aangepaste kleur"
      />
    </div>
  )
}

export function CalendarLabelsList({ labels: initial }: { labels: CalendarLabel[] }) {
  const [labels, setLabels] = useState<CalendarLabel[]>(initial)
  const [newName, setNewName] = useState('')
  const [newColor, setNewColor] = useState('#3b82f6')
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  const handleCreate = () => {
    if (!newName.trim()) return
    startTransition(async () => {
      const maxOrder = Math.max(0, ...labels.map(l => l.sort_order))
      const result = await createCalendarLabel(newName.trim(), newColor, maxOrder + 1)
      if (result.error) {
        setError(result.error)
      } else {
        setNewName('')
        setNewColor('#3b82f6')
        setError(null)
        setLabels(prev => [...prev, {
          id: Math.random().toString(),
          name: newName.trim(),
          color: newColor,
          active: true,
          sort_order: maxOrder + 1,
        }])
      }
    })
  }

  const handleToggleActive = (label: CalendarLabel) => {
    setLabels(prev => prev.map(l => l.id === label.id ? { ...l, active: !l.active } : l))
    startTransition(async () => {
      await updateCalendarLabel(label.id, { active: !label.active })
    })
  }

  const handleRename = (label: CalendarLabel, name: string) => {
    setLabels(prev => prev.map(l => l.id === label.id ? { ...l, name } : l))
  }

  const handleRenameSave = (label: CalendarLabel) => {
    startTransition(async () => {
      await updateCalendarLabel(label.id, { name: label.name })
    })
  }

  const handleColorChange = (label: CalendarLabel, color: string) => {
    setLabels(prev => prev.map(l => l.id === label.id ? { ...l, color } : l))
    startTransition(async () => {
      await updateCalendarLabel(label.id, { color })
    })
  }

  const handleDelete = (label: CalendarLabel) => {
    if (!confirm(`Label "${label.name}" verwijderen?`)) return
    setLabels(prev => prev.filter(l => l.id !== label.id))
    startTransition(async () => {
      await deleteCalendarLabel(label.id)
    })
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        {labels.map(label => (
          <div key={label.id} className="flex items-center gap-3 py-2 border-b last:border-0">
            <span
              className="h-3 w-3 rounded-full shrink-0"
              style={{ background: label.color }}
            />
            <Input
              value={label.name}
              onChange={e => handleRename(label, e.target.value)}
              onBlur={() => handleRenameSave(label)}
              className="h-8 text-sm flex-1 max-w-[180px]"
            />
            <ColorPicker value={label.color} onChange={c => handleColorChange(label, c)} />
            <div className="flex items-center gap-1.5 ml-auto shrink-0">
              <Switch
                checked={label.active}
                onCheckedChange={() => handleToggleActive(label)}
                id={`cal-active-${label.id}`}
              />
              <Label htmlFor={`cal-active-${label.id}`} className="text-xs text-muted-foreground cursor-pointer">
                {label.active ? 'Actief' : 'Inactief'}
              </Label>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 w-7 p-0 text-destructive hover:text-destructive ml-1"
                onClick={() => handleDelete(label)}
                disabled={pending}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        ))}
        {labels.length === 0 && (
          <p className="text-sm text-muted-foreground py-2">Nog geen labels aangemaakt.</p>
        )}
      </div>

      {/* Add new label */}
      <div className="pt-2 space-y-2">
        <p className="text-xs font-medium text-muted-foreground">Nieuw label toevoegen</p>
        <div className="flex items-center gap-2 flex-wrap">
          <Input
            value={newName}
            onChange={e => setNewName(e.target.value)}
            placeholder="Labelnaam..."
            className="h-8 text-sm w-48"
            onKeyDown={e => e.key === 'Enter' && handleCreate()}
          />
          <ColorPicker value={newColor} onChange={setNewColor} />
          <Button
            size="sm"
            className="h-8 bg-[#ffd100] text-black hover:bg-[#ffd100]/90"
            onClick={handleCreate}
            disabled={!newName.trim() || pending}
          >
            {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5 mr-1" />}
            Toevoegen
          </Button>
        </div>
        {error && <p className="text-sm text-destructive">{error}</p>}
      </div>
    </div>
  )
}

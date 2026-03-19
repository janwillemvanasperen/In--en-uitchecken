'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { createSchedulePush } from '@/app/admin/actions'
import { Loader2, Send, Users, Search } from 'lucide-react'

interface Student {
  id: string
  full_name: string
  email: string
  coach_name?: string | null
}

interface SchedulePushFormProps {
  students: Student[]
}

export function SchedulePushForm({ students }: SchedulePushFormProps) {
  const router = useRouter()
  const today = new Date().toISOString().split('T')[0]

  const [validFrom, setValidFrom] = useState(today)
  const [validUntil, setValidUntil] = useState('')
  const [message, setMessage] = useState('')
  const [selectAll, setSelectAll] = useState(false)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [search, setSearch] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const filtered = students.filter(s =>
    s.full_name.toLowerCase().includes(search.toLowerCase()) ||
    s.email.toLowerCase().includes(search.toLowerCase()) ||
    (s.coach_name ?? '').toLowerCase().includes(search.toLowerCase())
  )

  const handleSelectAll = (checked: boolean) => {
    setSelectAll(checked)
    if (checked) {
      setSelectedIds(new Set(students.map(s => s.id)))
    } else {
      setSelectedIds(new Set())
    }
  }

  const handleToggle = (id: string, checked: boolean) => {
    setSelectedIds(prev => {
      const next = new Set(prev)
      if (checked) next.add(id)
      else next.delete(id)
      setSelectAll(next.size === students.length)
      return next
    })
  }

  const handleSubmit = async () => {
    setError(null)
    setSuccess(null)

    if (!validFrom || !validUntil) {
      setError('Vul een start- en einddatum in.')
      return
    }
    if (validFrom > validUntil) {
      setError('Einddatum moet na de startdatum liggen.')
      return
    }
    if (selectedIds.size === 0) {
      setError('Selecteer minimaal één student.')
      return
    }

    setIsSubmitting(true)
    const result = await createSchedulePush(
      validFrom,
      validUntil,
      Array.from(selectedIds),
      message || undefined
    )

    if (result.error) {
      setError(result.error)
    } else {
      setSuccess(`Push verstuurd naar ${selectedIds.size} student(en).`)
      setSelectedIds(new Set())
      setSelectAll(false)
      setMessage('')
      router.refresh()
    }

    setIsSubmitting(false)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Send className="h-5 w-5" />
          Nieuwe roosterpush versturen
        </CardTitle>
        <CardDescription>
          Studenten ontvangen een melding en zien een banner op hun dashboard.
          Het huidige rooster blijft actief tot de startdatum.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Date range */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="valid_from">Startdatum nieuw rooster</Label>
            <Input
              id="valid_from"
              type="date"
              value={validFrom}
              min={today}
              onChange={e => setValidFrom(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="valid_until">Einddatum nieuw rooster</Label>
            <Input
              id="valid_until"
              type="date"
              value={validUntil}
              min={validFrom || today}
              onChange={e => setValidUntil(e.target.value)}
            />
          </div>
        </div>

        {/* Optional message */}
        <div className="space-y-1.5">
          <Label htmlFor="message">Bericht aan studenten (optioneel)</Label>
          <Textarea
            id="message"
            placeholder="bijv. Vul je rooster in voor het nieuwe kwartaal..."
            value={message}
            onChange={e => setMessage(e.target.value)}
            rows={2}
            className="resize-none"
          />
        </div>

        {/* Student selector */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Studenten
            </Label>
            <Badge variant="secondary">
              {selectedIds.size} van {students.length} geselecteerd
            </Badge>
          </div>

          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Zoek op naam, e-mail of coach..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-8 h-9"
            />
          </div>

          <div className="border rounded-lg overflow-hidden">
            {/* Select all row */}
            <label className="flex items-center gap-3 px-3 py-2.5 bg-muted/50 border-b cursor-pointer hover:bg-muted transition-colors">
              <Checkbox
                checked={selectAll}
                onCheckedChange={(v) => handleSelectAll(!!v)}
              />
              <span className="text-sm font-medium">Alle studenten selecteren</span>
            </label>

            {/* Student rows */}
            <div className="max-h-64 overflow-y-auto divide-y">
              {filtered.length === 0 && (
                <p className="px-3 py-4 text-sm text-center text-muted-foreground">
                  Geen studenten gevonden.
                </p>
              )}
              {filtered.map(s => (
                <label
                  key={s.id}
                  className="flex items-center gap-3 px-3 py-2.5 cursor-pointer hover:bg-muted/50 transition-colors"
                >
                  <Checkbox
                    checked={selectedIds.has(s.id)}
                    onCheckedChange={(v) => handleToggle(s.id, !!v)}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{s.full_name}</p>
                    <p className="text-xs text-muted-foreground truncate">{s.email}</p>
                  </div>
                  {s.coach_name && (
                    <Badge variant="outline" className="text-xs shrink-0">
                      {s.coach_name}
                    </Badge>
                  )}
                </label>
              ))}
            </div>
          </div>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        {success && (
          <Alert>
            <AlertDescription className="text-green-700">{success}</AlertDescription>
          </Alert>
        )}

        <Button
          onClick={handleSubmit}
          disabled={isSubmitting || selectedIds.size === 0 || !validFrom || !validUntil}
          className="w-full bg-[#ffd100] text-black hover:bg-[#e6bc00]"
        >
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Push versturen naar {selectedIds.size} student{selectedIds.size !== 1 ? 'en' : ''}
        </Button>
      </CardContent>
    </Card>
  )
}

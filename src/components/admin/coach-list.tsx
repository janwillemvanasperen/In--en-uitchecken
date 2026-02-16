'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Loader2, Trash2, Pencil, Plus, Users, Power } from 'lucide-react'
import { createCoach, updateCoach, deleteCoach } from '@/app/admin/actions'
import type { Coach } from '@/types'

export function CoachList({
  coaches,
  studentCounts,
}: {
  coaches: Coach[]
  studentCounts: Record<string, number>
}) {
  const [newName, setNewName] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newName.trim()) return
    setIsLoading(true)
    setError(null)

    const result = await createCoach(newName)
    if (result.error) {
      setError(result.error)
    } else {
      setNewName('')
    }
    setIsLoading(false)
  }

  const handleUpdate = async (id: string) => {
    if (!editName.trim()) return
    setIsLoading(true)
    setError(null)

    const result = await updateCoach(id, { name: editName })
    if (result.error) {
      setError(result.error)
    } else {
      setEditingId(null)
      setEditName('')
    }
    setIsLoading(false)
  }

  const handleToggleActive = async (id: string, currentActive: boolean) => {
    setIsLoading(true)
    setError(null)

    const result = await updateCoach(id, { active: !currentActive })
    if (result.error) setError(result.error)
    setIsLoading(false)
  }

  const handleDelete = async () => {
    if (!deletingId) return
    setIsLoading(true)
    setError(null)

    const result = await deleteCoach(deletingId)
    if (result.error) {
      setError(result.error)
    }
    setIsLoading(false)
    setDeletingId(null)
  }

  const startEdit = (coach: Coach) => {
    setEditingId(coach.id)
    setEditName(coach.name)
  }

  const deletingCoach = coaches.find((c) => c.id === deletingId)

  return (
    <div className="space-y-6">
      {/* Add new coach form */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Nieuwe coach</CardTitle>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          <form onSubmit={handleCreate} className="flex gap-3">
            <Input
              placeholder="Coach naam..."
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              required
              disabled={isLoading}
            />
            <Button type="submit" disabled={isLoading || !newName.trim()}>
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <Plus className="h-4 w-4 mr-2" />
                  Toevoegen
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Coaches list */}
      {coaches.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            Nog geen coaches aangemaakt.
          </CardContent>
        </Card>
      ) : (
        <div className="border rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted">
              <tr>
                <th className="text-left px-4 py-3 font-medium">Naam</th>
                <th className="text-left px-4 py-3 font-medium">Studenten</th>
                <th className="text-left px-4 py-3 font-medium">Status</th>
                <th className="text-right px-4 py-3 font-medium">Acties</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {coaches.map((coach) => (
                <tr key={coach.id}>
                  {editingId === coach.id ? (
                    <td colSpan={4} className="px-4 py-3">
                      <div className="flex gap-2">
                        <Input
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          disabled={isLoading}
                          autoFocus
                        />
                        <Button
                          size="sm"
                          onClick={() => handleUpdate(coach.id)}
                          disabled={isLoading || !editName.trim()}
                        >
                          Opslaan
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setEditingId(null)}
                        >
                          Annuleren
                        </Button>
                      </div>
                    </td>
                  ) : (
                    <>
                      <td className="px-4 py-3 font-medium">{coach.name}</td>
                      <td className="px-4 py-3">
                        <span className="flex items-center gap-1 text-muted-foreground">
                          <Users className="h-3 w-3" />
                          {studentCounts[coach.id] || 0}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={coach.active ? 'default' : 'secondary'}>
                          {coach.active ? 'Actief' : 'Inactief'}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => startEdit(coach)}
                            title="Bewerken"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleToggleActive(coach.id, coach.active)}
                            disabled={isLoading}
                            title={coach.active ? 'Deactiveren' : 'Activeren'}
                          >
                            <Power className={`h-4 w-4 ${coach.active ? 'text-green-600' : 'text-muted-foreground'}`} />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setDeletingId(coach.id)}
                            title="Verwijderen"
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <p className="text-sm text-muted-foreground">
        {coaches.length} coach{coaches.length !== 1 ? 'es' : ''}
        {' · '}
        {coaches.filter(c => c.active).length} actief
      </p>

      {/* Delete confirmation dialog */}
      <Dialog open={!!deletingId} onOpenChange={() => setDeletingId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Coach verwijderen</DialogTitle>
            <DialogDescription>
              Weet je zeker dat je &quot;{deletingCoach?.name}&quot; wilt verwijderen?
              {(studentCounts[deletingId || ''] || 0) > 0 && (
                <> Deze coach is gekoppeld aan {studentCounts[deletingId || '']} student(en). De koppeling wordt verwijderd.</>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeletingId(null)}>
              Annuleren
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Verwijderen
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Loader2, UserPlus } from 'lucide-react'
import { createUser, updateUser } from '@/app/admin/actions'
import type { User, Coach } from '@/types'

const ALL_ROLES = [
  { value: 'student', label: 'Student' },
  { value: 'admin', label: 'Beheerder' },
  { value: 'coach', label: 'Coach' },
]

export function UserForm({
  user,
  coaches = [],
  onDone,
}: {
  user?: User
  coaches?: Coach[]
  onDone?: () => void
}) {
  const [fullName, setFullName] = useState(user?.full_name || '')
  const [email, setEmail] = useState(user?.email || '')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState<'student' | 'admin' | 'coach'>(user?.role || 'student')
  const [roles, setRoles] = useState<string[]>(user?.roles?.length ? user.roles : [user?.role || 'student'])
  const [coachId, setCoachId] = useState<string>(user?.coach_id || '__none__')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const isEditing = !!user
  const activeCoaches = coaches.filter((c) => c.active)

  const toggleRole = (r: string, checked: boolean) => {
    setRoles(prev => {
      const next = checked ? [...prev, r] : prev.filter(x => x !== r)
      // Active role must always be in the list
      if (!next.includes(role)) setRole(next[0] as any || 'student')
      return next.length > 0 ? next : [role]
    })
  }

  const handleRoleChange = (newRole: 'student' | 'admin' | 'coach') => {
    setRole(newRole)
    // Ensure active role is always in the roles array
    if (!roles.includes(newRole)) {
      setRoles(prev => [...prev, newRole])
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    if (!fullName.trim() || !email.trim()) {
      setError('Naam en email zijn verplicht')
      setIsLoading(false)
      return
    }

    if (!isEditing && password.length < 6) {
      setError('Wachtwoord moet minimaal 6 tekens zijn')
      setIsLoading(false)
      return
    }

    const selectedCoachId = coachId === '__none__' ? null : coachId
    const finalRoles = roles.includes(role) ? roles : [...roles, role]

    const result = isEditing
      ? await updateUser(user.id, { full_name: fullName.trim(), email: email.trim(), role, roles: finalRoles, coach_id: selectedCoachId })
      : await createUser({ full_name: fullName.trim(), email: email.trim(), password, role, roles: finalRoles, coach_id: selectedCoachId })

    if (result.error) {
      setError(result.error)
    } else {
      if (!isEditing) {
        setFullName('')
        setEmail('')
        setPassword('')
        setRole('student')
        setRoles(['student'])
        setCoachId('__none__')
      }
      onDone?.()
    }

    setIsLoading(false)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">
          {isEditing ? 'Gebruiker bewerken' : 'Nieuwe gebruiker'}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="user-name">Volledige naam</Label>
            <Input
              id="user-name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Jan de Vries"
              required
            />
          </div>
          <div>
            <Label htmlFor="user-email">Email</Label>
            <Input
              id="user-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="jan@voorbeeld.nl"
              required
            />
          </div>
          {!isEditing && (
            <div>
              <Label htmlFor="user-password">Wachtwoord</Label>
              <Input
                id="user-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Minimaal 6 tekens"
                required
                minLength={6}
              />
            </div>
          )}
          <div>
            <Label htmlFor="user-role">Actieve rol</Label>
            <Select value={role} onValueChange={(v: 'student' | 'admin' | 'coach') => handleRoleChange(v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="student">Student</SelectItem>
                <SelectItem value="admin">Beheerder</SelectItem>
                <SelectItem value="coach">Coach</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="mb-2 block">Toegestane rollen</Label>
            <div className="flex gap-4 flex-wrap">
              {ALL_ROLES.map(r => (
                <div key={r.value} className="flex items-center gap-2">
                  <Checkbox
                    id={`role-${r.value}`}
                    checked={roles.includes(r.value)}
                    onCheckedChange={(checked) => toggleRole(r.value, !!checked)}
                    disabled={r.value === role}
                  />
                  <Label htmlFor={`role-${r.value}`} className="font-normal cursor-pointer">
                    {r.label}
                  </Label>
                </div>
              ))}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              De actieve rol is altijd aangevinkt. Extra rollen geven de gebruiker de mogelijkheid om te wisselen.
            </p>
          </div>
          {role === 'student' && activeCoaches.length > 0 && (
            <div>
              <Label htmlFor="user-coach">Coach</Label>
              <Select value={coachId} onValueChange={setCoachId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecteer coach" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">Geen coach</SelectItem>
                  {activeCoaches.map((coach) => (
                    <SelectItem key={coach.id} value={coach.id}>
                      {coach.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          <Button type="submit" disabled={isLoading} className="w-full">
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isEditing ? 'Opslaan' : (
              <>
                <UserPlus className="mr-2 h-4 w-4" />
                Gebruiker aanmaken
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}

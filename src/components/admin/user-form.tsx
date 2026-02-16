'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Loader2, UserPlus } from 'lucide-react'
import { createUser, updateUser } from '@/app/admin/actions'
import type { User } from '@/types'

export function UserForm({
  user,
  onDone,
}: {
  user?: User
  onDone?: () => void
}) {
  const [fullName, setFullName] = useState(user?.full_name || '')
  const [email, setEmail] = useState(user?.email || '')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState<'student' | 'admin'>(user?.role || 'student')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const isEditing = !!user

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

    const result = isEditing
      ? await updateUser(user.id, { full_name: fullName.trim(), email: email.trim(), role })
      : await createUser({ full_name: fullName.trim(), email: email.trim(), password, role })

    if (result.error) {
      setError(result.error)
    } else {
      if (!isEditing) {
        setFullName('')
        setEmail('')
        setPassword('')
        setRole('student')
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
            <Label htmlFor="user-role">Rol</Label>
            <Select value={role} onValueChange={(v: 'student' | 'admin') => setRole(v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="student">Student</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
              </SelectContent>
            </Select>
          </div>
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

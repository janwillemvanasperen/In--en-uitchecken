'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, Plus } from 'lucide-react'
import { createLocation, updateLocation } from '@/app/admin/actions'
import type { Location } from '@/types'

export function LocationForm({
  location,
  onDone,
}: {
  location?: Location
  onDone?: () => void
}) {
  const [name, setName] = useState(location?.name || '')
  const [latitude, setLatitude] = useState(location?.latitude?.toString() || '')
  const [longitude, setLongitude] = useState(location?.longitude?.toString() || '')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const isEditing = !!location

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    const lat = parseFloat(latitude)
    const lng = parseFloat(longitude)

    if (!name.trim()) {
      setError('Naam is verplicht')
      setIsLoading(false)
      return
    }
    if (isNaN(lat) || isNaN(lng)) {
      setError('Ongeldige coördinaten')
      setIsLoading(false)
      return
    }

    const result = isEditing
      ? await updateLocation(location.id, { name: name.trim(), latitude: lat, longitude: lng })
      : await createLocation({ name: name.trim(), latitude: lat, longitude: lng })

    if (result.error) {
      setError(result.error)
    } else {
      if (!isEditing) {
        setName('')
        setLatitude('')
        setLongitude('')
      }
      onDone?.()
    }

    setIsLoading(false)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">
          {isEditing ? 'Locatie bewerken' : 'Nieuwe locatie'}
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
            <Label htmlFor="loc-name">Naam</Label>
            <Input
              id="loc-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Bijv. Hoofdkantoor"
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="loc-lat">Breedtegraad</Label>
              <Input
                id="loc-lat"
                type="number"
                step="any"
                value={latitude}
                onChange={(e) => setLatitude(e.target.value)}
                placeholder="52.3676"
                required
              />
            </div>
            <div>
              <Label htmlFor="loc-lng">Lengtegraad</Label>
              <Input
                id="loc-lng"
                type="number"
                step="any"
                value={longitude}
                onChange={(e) => setLongitude(e.target.value)}
                placeholder="4.9041"
                required
              />
            </div>
          </div>
          <Button type="submit" disabled={isLoading} className="w-full">
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isEditing ? 'Opslaan' : (
              <>
                <Plus className="mr-2 h-4 w-4" />
                Locatie toevoegen
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}

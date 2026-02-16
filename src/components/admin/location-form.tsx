'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, Plus, MapPin } from 'lucide-react'
import { createLocation, updateLocation } from '@/app/admin/actions'
import type { Location } from '@/types'

async function geocodeAddress(address: string): Promise<{ lat: number; lng: number; display: string } | null> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1&countrycodes=nl`,
      { headers: { 'Accept-Language': 'nl' } }
    )
    const data = await res.json()
    if (data.length === 0) return null
    return {
      lat: parseFloat(data[0].lat),
      lng: parseFloat(data[0].lon),
      display: data[0].display_name,
    }
  } catch {
    return null
  }
}

export function LocationForm({
  location,
  onDone,
}: {
  location?: Location
  onDone?: () => void
}) {
  const [name, setName] = useState(location?.name || '')
  const [address, setAddress] = useState((location as any)?.address || '')
  const [resolvedAddress, setResolvedAddress] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const isEditing = !!location

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)
    setResolvedAddress(null)

    if (!name.trim()) {
      setError('Naam is verplicht')
      setIsLoading(false)
      return
    }

    if (!address.trim()) {
      setError('Adres is verplicht')
      setIsLoading(false)
      return
    }

    // Geocode the address
    const geo = await geocodeAddress(address.trim())
    if (!geo) {
      setError('Adres niet gevonden. Probeer een specifieker adres.')
      setIsLoading(false)
      return
    }

    setResolvedAddress(geo.display)

    const result = isEditing
      ? await updateLocation(location.id, {
          name: name.trim(),
          address: address.trim(),
          latitude: geo.lat,
          longitude: geo.lng,
        })
      : await createLocation({
          name: name.trim(),
          address: address.trim(),
          latitude: geo.lat,
          longitude: geo.lng,
        })

    if (result.error) {
      setError(result.error)
    } else {
      if (!isEditing) {
        setName('')
        setAddress('')
        setResolvedAddress(null)
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
          <div>
            <Label htmlFor="loc-address">Adres</Label>
            <Input
              id="loc-address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Bijv. Damrak 1, Amsterdam"
              required
            />
          </div>
          {resolvedAddress && (
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              {resolvedAddress}
            </p>
          )}
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

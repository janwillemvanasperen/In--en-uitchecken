'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Loader2, Trash2, Pencil, QrCode, MapPin } from 'lucide-react'
import { deleteLocation } from '@/app/admin/actions'
import { LocationForm } from './location-form'
import type { Location } from '@/types'

export function LocationList({ locations }: { locations: Location[] }) {
  const [editingId, setEditingId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [qrLocationId, setQrLocationId] = useState<string | null>(null)

  const handleDelete = async () => {
    if (!deletingId) return
    setIsDeleting(true)
    setError(null)

    const result = await deleteLocation(deletingId)
    if (result.error) {
      setError(result.error)
    }

    setIsDeleting(false)
    setDeletingId(null)
  }

  const deletingLocation = locations.find(l => l.id === deletingId)
  const qrLocation = locations.find(l => l.id === qrLocationId)

  return (
    <div className="space-y-4">
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {locations.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            Geen locaties gevonden. Voeg een locatie toe.
          </CardContent>
        </Card>
      ) : (
        locations.map((location) => (
          <div key={location.id}>
            {editingId === location.id ? (
              <LocationForm
                location={location}
                onDone={() => setEditingId(null)}
              />
            ) : (
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      {location.name}
                    </CardTitle>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setQrLocationId(location.id)}
                      >
                        <QrCode className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setEditingId(location.id)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setDeletingId(location.id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-sm text-muted-foreground space-y-1">
                    <p>Coördinaten: {location.latitude}, {location.longitude}</p>
                    <p className="font-mono text-xs">QR: {location.qr_code}</p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        ))
      )}

      {/* Delete confirmation dialog */}
      <Dialog open={!!deletingId} onOpenChange={() => setDeletingId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Locatie verwijderen</DialogTitle>
            <DialogDescription>
              Weet je zeker dat je &quot;{deletingLocation?.name}&quot; wilt verwijderen?
              Dit kan niet ongedaan worden gemaakt.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeletingId(null)}>
              Annuleren
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={isDeleting}>
              {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Verwijderen
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* QR code dialog */}
      <Dialog open={!!qrLocationId} onOpenChange={() => setQrLocationId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>QR Code - {qrLocation?.name}</DialogTitle>
            <DialogDescription>
              Scan deze QR code om in te checken op deze locatie.
            </DialogDescription>
          </DialogHeader>
          {qrLocation && (
            <div className="flex flex-col items-center gap-4">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(qrLocation.qr_code)}`}
                alt={`QR code voor ${qrLocation.name}`}
                width={250}
                height={250}
              />
              <p className="text-xs font-mono text-muted-foreground break-all">
                {qrLocation.qr_code}
              </p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

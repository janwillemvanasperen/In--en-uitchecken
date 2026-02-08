'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertTriangle } from 'lucide-react'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="max-w-md w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-6 w-6" />
            Er is iets misgegaan
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert variant="destructive">
            <AlertDescription>
              {error.message || 'Er is een onverwachte fout opgetreden'}
            </AlertDescription>
          </Alert>

          <p className="text-sm text-muted-foreground">
            Probeer de pagina opnieuw te laden. Als het probleem aanhoudt, neem dan contact op met de administrator.
          </p>

          <div className="flex gap-2">
            <Button onClick={reset} className="flex-1">
              Opnieuw proberen
            </Button>
            <Button
              variant="outline"
              onClick={() => window.location.href = '/student/dashboard'}
              className="flex-1"
            >
              Naar dashboard
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

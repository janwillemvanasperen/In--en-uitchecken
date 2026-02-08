'use client'

import { useEffect, useRef, useState } from 'react'
import { Html5Qrcode } from 'html5-qrcode'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertTriangle } from 'lucide-react'

interface QRScannerProps {
  onScan: (qrCode: string) => void
  onError: (error: string) => void
}

export function QRScanner({ onScan, onError }: QRScannerProps) {
  const scannerRef = useRef<Html5Qrcode | null>(null)
  const [isScanning, setIsScanning] = useState(false)
  const [cameraError, setCameraError] = useState<string | null>(null)

  useEffect(() => {
    const scanner = new Html5Qrcode('qr-reader')
    scannerRef.current = scanner
    setIsScanning(true)

    scanner
      .start(
        { facingMode: 'environment' }, // Use back camera on mobile
        {
          fps: 10, // Scans per second
          qrbox: { width: 250, height: 250 }, // Scanning box size
        },
        (decodedText) => {
          // QR code successfully scanned
          onScan(decodedText)
          // Stop scanning after successful scan
          if (scannerRef.current?.isScanning) {
            scannerRef.current.stop()
            setIsScanning(false)
          }
        },
        (errorMessage) => {
          // Scanning errors (ignore these as they happen frequently while searching for QR code)
        }
      )
      .catch((err) => {
        // Camera permission or initialization error
        const errorMsg = 'Camera toegang geweigerd of niet beschikbaar. Controleer je browser instellingen.'
        setCameraError(errorMsg)
        onError(errorMsg)
        setIsScanning(false)
      })

    return () => {
      // Cleanup on unmount
      if (scannerRef.current?.isScanning) {
        scannerRef.current.stop().catch(() => {
          // Ignore stop errors
        })
      }
    }
  }, [onScan, onError])

  return (
    <div className="space-y-4">
      {cameraError && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{cameraError}</AlertDescription>
        </Alert>
      )}

      <div
        id="qr-reader"
        className="w-full max-w-md mx-auto rounded-lg overflow-hidden"
      />

      {isScanning && !cameraError && (
        <p className="text-sm text-center text-muted-foreground">
          Richt je camera op de QR code
        </p>
      )}
    </div>
  )
}

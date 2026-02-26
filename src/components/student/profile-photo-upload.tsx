'use client'

import { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { AvatarWithFallback } from '@/components/shared/avatar-with-fallback'
import { uploadProfilePhoto } from '@/app/student/actions'
import { Camera, Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface ProfilePhotoUploadProps {
  currentPhotoUrl: string | null
  fullName: string
}

function resizeImage(file: File, maxSize: number): Promise<File> {
  return new Promise((resolve) => {
    const img = new Image()
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')!

    img.onload = () => {
      let { width, height } = img

      if (width <= maxSize && height <= maxSize) {
        resolve(file)
        return
      }

      if (width > height) {
        height = (height / width) * maxSize
        width = maxSize
      } else {
        width = (width / height) * maxSize
        height = maxSize
      }

      canvas.width = width
      canvas.height = height
      ctx.drawImage(img, 0, 0, width, height)

      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(new File([blob], file.name, { type: 'image/jpeg' }))
          } else {
            resolve(file)
          }
        },
        'image/jpeg',
        0.85
      )
    }

    img.src = URL.createObjectURL(file)
  })
}

export function ProfilePhotoUpload({ currentPhotoUrl, fullName }: ProfilePhotoUploadProps) {
  const [photoUrl, setPhotoUrl] = useState(currentPhotoUrl)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setLoading(true)
    setError(null)

    try {
      // Resize to max 400px
      const resized = await resizeImage(file, 400)

      const formData = new FormData()
      formData.append('photo', resized)

      const result = await uploadProfilePhoto(formData)

      if (result.error) {
        setError(result.error)
      } else if (result.url) {
        setPhotoUrl(result.url)
        router.refresh()
      }
    } catch {
      setError('Upload mislukt. Probeer het opnieuw.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative">
        <AvatarWithFallback
          src={photoUrl}
          fullName={fullName}
          size="lg"
        />
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={loading}
          className="absolute bottom-0 right-0 h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-md hover:bg-primary/90 transition-colors"
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Camera className="h-4 w-4" />
          )}
        </button>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />

      <Button
        variant="outline"
        size="sm"
        onClick={() => fileInputRef.current?.click()}
        disabled={loading}
      >
        {loading ? 'Uploaden...' : 'Foto wijzigen'}
      </Button>

      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}
    </div>
  )
}

'use client'

import { useState } from 'react'

interface AvatarWithFallbackProps {
  src?: string | null
  fullName: string
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const sizeClasses = {
  sm: 'h-8 w-8 text-xs',
  md: 'h-10 w-10 text-sm',
  lg: 'h-20 w-20 text-xl',
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/)
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
  }
  return name.slice(0, 2).toUpperCase()
}

export function AvatarWithFallback({ src, fullName, size = 'md', className = '' }: AvatarWithFallbackProps) {
  const [imgError, setImgError] = useState(false)

  const sizeClass = sizeClasses[size]

  if (src && !imgError) {
    return (
      <img
        src={src}
        alt={fullName}
        className={`${sizeClass} rounded-full object-cover ${className}`}
        onError={() => setImgError(true)}
      />
    )
  }

  return (
    <div className={`${sizeClass} rounded-full bg-primary/20 flex items-center justify-center font-medium text-foreground ${className}`}>
      {getInitials(fullName)}
    </div>
  )
}

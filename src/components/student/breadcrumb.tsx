'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ChevronRight } from 'lucide-react'

const pathNames: Record<string, string> = {
  'check-in': 'Check-in',
  'history': 'Geschiedenis',
  'schedule': 'Rooster',
  'leave-requests': 'Verlofaanvragen',
  'profile': 'Profiel',
}

export function Breadcrumb() {
  const pathname = usePathname()

  // Don't show on dashboard
  if (pathname === '/student/dashboard') return null

  // Get the current page segment
  const segments = pathname.split('/').filter(Boolean)
  // segments: ['student', 'check-in'] or ['student', 'history']
  const currentSegment = segments[2] || segments[1]
  const pageName = pathNames[currentSegment] || currentSegment

  if (!pageName || segments.length < 3) return null

  return (
    <nav className="container mx-auto px-4 py-2">
      <div className="flex items-center gap-1 text-sm text-muted-foreground">
        <Link href="/student/dashboard" className="hover:text-foreground transition-colors">
          Dashboard
        </Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <span className="text-foreground font-medium">{pageName}</span>
      </div>
    </nav>
  )
}

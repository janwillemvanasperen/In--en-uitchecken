'use client'

import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Users } from 'lucide-react'

import type { CoachView } from '@/lib/coach-utils'
export type { CoachView }

interface ViewSelectorProps {
  currentView: CoachView
  counts?: { mijnStudenten: number; mijnKlas: number; alle: number }
}

export function ViewSelector({ currentView, counts }: ViewSelectorProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const handleChange = (value: CoachView) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set('view', value)
    // Remove tab param when switching view on student pages
    params.delete('tab')
    router.push(`${pathname}?${params.toString()}`)
  }

  return (
    <div className="flex items-center gap-2">
      <Users className="h-4 w-4 text-muted-foreground shrink-0" />
      <Select value={currentView} onValueChange={handleChange}>
        <SelectTrigger className="h-8 text-xs w-auto min-w-[180px] border-[#ffd100] bg-[#ffd100]/10">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="mijn-studenten">
            Mijn Studenten{counts ? ` (${counts.mijnStudenten})` : ''}
          </SelectItem>
          <SelectItem value="mijn-klas">
            Mijn Klas{counts ? ` (${counts.mijnKlas})` : ''}
          </SelectItem>
          <SelectItem value="alle">
            Alle Studenten{counts ? ` (${counts.alle})` : ''}
          </SelectItem>
        </SelectContent>
      </Select>
    </div>
  )
}


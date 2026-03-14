'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { switchRole } from '@/app/actions'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { ChevronDown, Loader2 } from 'lucide-react'

const ROLE_LABELS: Record<string, string> = {
  student: 'Student',
  admin: 'Beheerder',
  coach: 'Coach',
}

interface RoleSwitcherProps {
  currentRole: string
  availableRoles: string[]
}

export function RoleSwitcher({ currentRole, availableRoles }: RoleSwitcherProps) {
  const [isPending, startTransition] = useTransition()
  const router = useRouter()
  const otherRoles = availableRoles.filter(r => r !== currentRole)

  // Only show if user has more than one role
  if (otherRoles.length === 0) return null

  const handleSwitch = (role: string) => {
    startTransition(async () => {
      const result = await switchRole(role)
      if (result?.redirectTo) {
        // Full page reload to bypass Next.js server component cache
        window.location.href = result.redirectTo
      }
    })
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="h-8 gap-1 text-xs" disabled={isPending}>
          {isPending ? (
            <Loader2 className="h-3 w-3 animate-spin" />
          ) : (
            <>
              {ROLE_LABELS[currentRole] ?? currentRole}
              <ChevronDown className="h-3 w-3" />
            </>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {otherRoles.map(role => (
          <DropdownMenuItem key={role} onClick={() => handleSwitch(role)}>
            Wissel naar {ROLE_LABELS[role] ?? role}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

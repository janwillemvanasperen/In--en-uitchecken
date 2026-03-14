'use client'

import Link from 'next/link'
import { AvatarWithFallback } from '@/components/shared/avatar-with-fallback'
import { Badge } from '@/components/ui/badge'
import { Star, Clock, AlertTriangle, FileText } from 'lucide-react'

interface StudentCardProps {
  student: {
    id: string
    full_name: string
    profile_photo_url?: string | null
    class_code?: string | null
    cohort?: string | null
    coaches?: { name: string } | null
  }
  isOwnStudent: boolean
  isCheckedIn: boolean
  checkInTime?: string | null
  checkInLocation?: string | null
  hasScheduleToday: boolean
  weeklyHours: number
  pendingLeave: number
  noteCount: number
  viewHref: string
}

export function StudentCard({
  student,
  isOwnStudent,
  isCheckedIn,
  checkInTime,
  checkInLocation,
  hasScheduleToday,
  weeklyHours,
  pendingLeave,
  noteCount,
  viewHref,
}: StudentCardProps) {
  const statusColor = isCheckedIn
    ? 'bg-green-500'
    : hasScheduleToday
    ? 'bg-orange-400'
    : 'bg-gray-300'

  const statusLabel = isCheckedIn
    ? 'Ingecheckt'
    : hasScheduleToday
    ? 'Verwacht'
    : 'Geen rooster'

  return (
    <Link href={viewHref} className="block group">
      <div className="rounded-lg border bg-card p-4 hover:shadow-md transition-shadow hover:border-[#ffd100]/60">
        <div className="flex items-start gap-3">
          <div className="relative shrink-0">
            <AvatarWithFallback
              src={student.profile_photo_url}
              fullName={student.full_name}
              size="sm"
            />
            <span
              className={`absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-background ${statusColor}`}
              title={statusLabel}
            />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="font-medium text-sm truncate">{student.full_name}</span>
              {isOwnStudent && (
                <Star className="h-3.5 w-3.5 fill-[#ffd100] text-[#ffd100] shrink-0" />
              )}
            </div>

            <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
              {student.coaches?.name && (
                <Badge variant="secondary" className="text-xs px-1.5 py-0 h-4">
                  {student.coaches.name}
                </Badge>
              )}
              {student.class_code && (
                <Badge variant="outline" className="text-xs px-1.5 py-0 h-4">
                  {student.class_code}
                </Badge>
              )}
            </div>

            {isCheckedIn && checkInLocation && (
              <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-green-500 inline-block" />
                {checkInLocation}
                {checkInTime && ` · ${new Date(checkInTime).toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' })}`}
              </p>
            )}
          </div>
        </div>

        <div className="mt-3 flex items-center gap-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {weeklyHours.toFixed(1)}u
          </span>
          {pendingLeave > 0 && (
            <span className="flex items-center gap-1 text-orange-500">
              <AlertTriangle className="h-3 w-3" />
              {pendingLeave} verlof
            </span>
          )}
          {noteCount > 0 && (
            <span className="flex items-center gap-1">
              <FileText className="h-3 w-3" />
              {noteCount}
            </span>
          )}
        </div>
      </div>
    </Link>
  )
}

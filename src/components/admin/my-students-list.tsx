'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Progress } from '@/components/ui/progress'
import Link from 'next/link'
import { Search, Clock, MapPin, AlertTriangle, CheckCircle } from 'lucide-react'
import { AvatarWithFallback } from '@/components/shared/avatar-with-fallback'
import type { Coach } from '@/types'

interface StudentRow {
  id: string
  full_name: string
  email: string
  coach_id: string | null
  profile_photo_url: string | null
  coaches: { name: string } | null
}

interface MyStudentsListProps {
  students: StudentRow[]
  coaches: Coach[]
  activeCheckInMap: Record<string, { location: string; checkInTime: string }>
  todayScheduleMap: Record<string, { start_time: string; end_time: string }>
  weeklyHoursMap: Record<string, number>
  pendingLeaveMap: Record<string, number>
}

export function MyStudentsList({
  students,
  coaches,
  activeCheckInMap,
  todayScheduleMap,
  weeklyHoursMap,
  pendingLeaveMap,
}: MyStudentsListProps) {
  const [search, setSearch] = useState('')
  const [coachFilter, setCoachFilter] = useState('__all__')

  const filtered = students.filter((s) => {
    const matchSearch = s.full_name.toLowerCase().includes(search.toLowerCase()) ||
      s.email.toLowerCase().includes(search.toLowerCase())
    const matchCoach = coachFilter === '__all__' ||
      (coachFilter === '__none__' && !s.coach_id) ||
      s.coach_id === coachFilter
    return matchSearch && matchCoach
  })

  // Summary stats
  const activeNow = filtered.filter(s => activeCheckInMap[s.id]).length
  const scheduledToday = filtered.filter(s => todayScheduleMap[s.id]).length
  const pendingLeaveTotal = filtered.reduce((acc, s) => acc + (pendingLeaveMap[s.id] || 0), 0)

  const targetHours = 16

  return (
    <div className="space-y-6">
      {/* Summary cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-green-600">{activeNow}</p>
                <p className="text-sm text-muted-foreground">Nu ingecheckt</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                <Clock className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold text-primary">{scheduledToday}</p>
                <p className="text-sm text-muted-foreground">Ingepland vandaag</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-yellow-100 flex items-center justify-center">
                <AlertTriangle className="h-5 w-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-yellow-600">{pendingLeaveTotal}</p>
                <p className="text-sm text-muted-foreground">Openstaand verlof</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Zoek op naam of email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        {coaches.length > 0 && (
          <select
            value={coachFilter}
            onChange={(e) => setCoachFilter(e.target.value)}
            className="h-10 rounded-md border border-input bg-background px-3 text-sm"
          >
            <option value="__all__">Alle coaches</option>
            <option value="__none__">Geen coach</option>
            {coaches.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        )}
      </div>

      <p className="text-sm text-muted-foreground">{filtered.length} student{filtered.length !== 1 ? 'en' : ''}</p>

      {/* Student cards grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filtered.map((student) => {
          const isActive = !!activeCheckInMap[student.id]
          const schedule = todayScheduleMap[student.id]
          const hours = weeklyHoursMap[student.id] || 0
          const percentage = Math.min((hours / targetHours) * 100, 100)
          const pendingCount = pendingLeaveMap[student.id] || 0

          let progressColor = 'bg-red-500'
          if (percentage >= 80) progressColor = 'bg-green-500'
          else if (percentage >= 50) progressColor = 'bg-yellow-500'

          let textColor = 'text-red-600'
          if (percentage >= 80) textColor = 'text-green-600'
          else if (percentage >= 50) textColor = 'text-yellow-600'

          return (
            <Link key={student.id} href={`/admin/my-students/${student.id}`}>
              <Card className={`hover:shadow-md transition-shadow cursor-pointer ${isActive ? 'border-green-300 bg-green-50/30' : ''}`}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <AvatarWithFallback
                        src={student.profile_photo_url}
                        fullName={student.full_name}
                        size="sm"
                      />
                      <div>
                        <CardTitle className="text-base">{student.full_name}</CardTitle>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {student.coaches?.name || 'Geen coach'}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      {isActive && (
                        <Badge className="bg-green-600 text-xs">Actief</Badge>
                      )}
                      {pendingCount > 0 && (
                        <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 text-xs">
                          {pendingCount} verlof
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {/* Current status */}
                  {isActive && (
                    <div className="flex items-center gap-1.5 text-sm text-green-700">
                      <MapPin className="h-3.5 w-3.5" />
                      <span>{activeCheckInMap[student.id].location}</span>
                    </div>
                  )}

                  {/* Today's schedule */}
                  {schedule && !isActive && (
                    <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                      <Clock className="h-3.5 w-3.5" />
                      <span>Verwacht: {schedule.start_time.slice(0, 5)} - {schedule.end_time.slice(0, 5)}</span>
                    </div>
                  )}

                  {!schedule && !isActive && (
                    <div className="text-sm text-muted-foreground">
                      Geen rooster vandaag
                    </div>
                  )}

                  {/* Weekly progress bar */}
                  <div>
                    <div className="flex items-baseline justify-between mb-1">
                      <span className={`text-sm font-medium ${textColor}`}>
                        {hours.toFixed(1)}u
                      </span>
                      <span className="text-xs text-muted-foreground">
                        van {targetHours}u
                      </span>
                    </div>
                    <Progress
                      value={percentage}
                      className="h-2"
                      indicatorClassName={progressColor}
                    />
                  </div>
                </CardContent>
              </Card>
            </Link>
          )
        })}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          Geen studenten gevonden
        </div>
      )}
    </div>
  )
}

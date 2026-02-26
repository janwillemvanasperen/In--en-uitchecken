'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { createClient } from '@/lib/supabase/client'
import { formatDuration, formatDurationHoursMinutes, calculateHours } from '@/lib/date-utils'
import { Clock, MapPin, Calendar, TrendingUp, FileText, CheckCircle, XCircle } from 'lucide-react'

const DAY_NAMES = ['', 'Maandag', 'Dinsdag', 'Woensdag', 'Donderdag', 'Vrijdag', 'Zaterdag', 'Zondag']

interface StudentDetailViewProps {
  student: {
    id: string
    full_name: string
    email: string
    coach_id: string | null
    created_at: string
    coaches: { name: string } | null
  }
  activeCheckIn: any | null
  todaySchedule: any | null
  weekCheckIns: any[]
  weeklyHours: number
  scheduledWeeklyHours: number
  allSchedules: any[]
  recentCheckIns: any[]
  leaveRequests: any[]
}

export function StudentDetailView({
  student,
  activeCheckIn: initialCheckIn,
  todaySchedule,
  weekCheckIns,
  weeklyHours,
  scheduledWeeklyHours,
  allSchedules,
  recentCheckIns,
  leaveRequests,
}: StudentDetailViewProps) {
  const [activeCheckIn, setActiveCheckIn] = useState(initialCheckIn)
  const [elapsedTime, setElapsedTime] = useState(0)
  const supabase = createClient()

  // Real-time subscription for check-ins
  useEffect(() => {
    const channel = supabase
      .channel(`admin-student-${student.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'check_ins',
          filter: `user_id=eq.${student.id}`,
        },
        async (payload) => {
          if (payload.eventType === 'INSERT') {
            const newCheckIn = payload.new as any
            if (!newCheckIn.check_out_time) {
              const { data } = await supabase
                .from('check_ins')
                .select('*, locations!check_ins_location_id_fkey(*)')
                .eq('id', newCheckIn.id)
                .single()
              if (data) setActiveCheckIn(data)
            }
          } else if (payload.eventType === 'UPDATE') {
            const updated = payload.new as any
            if (updated.check_out_time && activeCheckIn?.id === updated.id) {
              setActiveCheckIn(null)
              setElapsedTime(0)
            }
          }
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [student.id, supabase, activeCheckIn])

  // Live timer for active check-in
  useEffect(() => {
    if (!activeCheckIn) { setElapsedTime(0); return }
    const checkInTime = new Date(activeCheckIn.check_in_time).getTime()
    setElapsedTime(Math.floor((Date.now() - checkInTime) / 1000))
    const interval = setInterval(() => {
      setElapsedTime(Math.floor((Date.now() - checkInTime) / 1000))
    }, 1000)
    return () => clearInterval(interval)
  }, [activeCheckIn])

  const targetHours = 16
  const percentage = Math.min((weeklyHours / targetHours) * 100, 100)

  let progressColor = 'bg-red-500'
  if (percentage >= 80) progressColor = 'bg-green-500'
  else if (percentage >= 50) progressColor = 'bg-yellow-500'

  let textColor = 'text-red-600'
  if (percentage >= 80) textColor = 'text-green-600'
  else if (percentage >= 50) textColor = 'text-yellow-600'

  // Group week check-ins by day
  const checkInsByDay: Record<string, any[]> = {}
  for (const ci of weekCheckIns) {
    const day = new Date(ci.check_in_time).toLocaleDateString('nl-NL', { weekday: 'long', day: 'numeric', month: 'short' })
    if (!checkInsByDay[day]) checkInsByDay[day] = []
    checkInsByDay[day].push(ci)
  }

  // Build schedule map: dayOfWeek -> schedule
  const scheduleMap: Record<number, any> = {}
  for (const s of allSchedules) {
    scheduleMap[s.day_of_week] = s
  }

  return (
    <div className="space-y-6">
      {/* Top summary cards */}
      <div className="grid gap-4 md:grid-cols-3">
        {/* Current Status */}
        <Card className={activeCheckIn ? 'border-green-300 bg-green-50/30' : ''}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Status nu
            </CardTitle>
          </CardHeader>
          <CardContent>
            {activeCheckIn ? (
              <div className="space-y-2">
                <Badge className="bg-green-600">Ingecheckt</Badge>
                <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                  <MapPin className="h-3.5 w-3.5" />
                  {activeCheckIn.locations?.name || 'Onbekend'}
                </div>
                <p className="text-2xl font-bold text-green-600">{formatDuration(elapsedTime)}</p>
              </div>
            ) : (
              <div className="space-y-2">
                <Badge variant="secondary">Uitgecheckt</Badge>
                {todaySchedule ? (
                  <p className="text-sm text-muted-foreground">
                    Verwacht: {todaySchedule.start_time.slice(0, 5)} - {todaySchedule.end_time.slice(0, 5)}
                  </p>
                ) : (
                  <p className="text-sm text-muted-foreground">Geen rooster vandaag</p>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Weekly Progress */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Weekvoortgang
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-baseline gap-2">
                <span className={`text-2xl font-bold ${textColor}`}>{weeklyHours.toFixed(1)}u</span>
                <span className="text-sm text-muted-foreground">van {targetHours}u</span>
              </div>
              <Progress value={percentage} className="h-2.5" indicatorClassName={progressColor} />
              {scheduledWeeklyHours > 0 && (
                <p className="text-xs text-muted-foreground">
                  Ingepland: {scheduledWeeklyHours.toFixed(1)}u per week
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Quick Stats */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Overzicht
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Check-ins deze week</span>
                <span className="font-medium">{weekCheckIns.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Roosterdagen</span>
                <span className="font-medium">{allSchedules.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Verlofaanvragen</span>
                <span className="font-medium">{leaveRequests.filter(lr => lr.status === 'pending').length} openstaand</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="today" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="today">Vandaag</TabsTrigger>
          <TabsTrigger value="schedule">Rooster</TabsTrigger>
          <TabsTrigger value="attendance">Aanwezigheid</TabsTrigger>
          <TabsTrigger value="weekly">Weekoverzicht</TabsTrigger>
          <TabsTrigger value="leave">Verlof</TabsTrigger>
        </TabsList>

        {/* Tab: Today */}
        <TabsContent value="today" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Vandaag</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Today's schedule info */}
              {todaySchedule ? (
                <div className="p-3 rounded-lg bg-muted/50">
                  <p className="text-sm font-medium">Geplande tijd</p>
                  <p className="text-lg font-bold">
                    {todaySchedule.start_time.slice(0, 5)} - {todaySchedule.end_time.slice(0, 5)}
                  </p>
                </div>
              ) : (
                <div className="p-3 rounded-lg bg-muted/50">
                  <p className="text-sm text-muted-foreground">Geen rooster voor vandaag</p>
                </div>
              )}

              {/* Today's check-ins */}
              <div>
                <p className="text-sm font-medium mb-2">Check-ins vandaag</p>
                {(() => {
                  const todayCheckIns = recentCheckIns.filter(ci => {
                    const d = new Date(ci.check_in_time)
                    const now = new Date()
                    return d.getDate() === now.getDate() && d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
                  })
                  if (todayCheckIns.length === 0) {
                    return <p className="text-sm text-muted-foreground">Nog geen check-ins vandaag</p>
                  }
                  return (
                    <div className="space-y-2">
                      {todayCheckIns.map((ci: any) => {
                        const checkedIn = new Date(ci.check_in_time)
                        const checkedOut = ci.check_out_time ? new Date(ci.check_out_time) : null
                        const durationSec = checkedOut
                          ? Math.floor((checkedOut.getTime() - checkedIn.getTime()) / 1000)
                          : Math.floor((Date.now() - checkedIn.getTime()) / 1000)
                        return (
                          <div key={ci.id} className="flex items-center justify-between p-2 rounded border">
                            <div>
                              <p className="text-sm font-medium">{ci.locations?.name || 'Onbekend'}</p>
                              <p className="text-xs text-muted-foreground">
                                {checkedIn.toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' })}
                                {checkedOut && ` - ${checkedOut.toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' })}`}
                              </p>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-sm text-muted-foreground">{formatDurationHoursMinutes(durationSec)}</span>
                              {checkedOut ? (
                                <Badge variant="secondary">Klaar</Badge>
                              ) : (
                                <Badge className="bg-green-600">Actief</Badge>
                              )}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )
                })()}
              </div>

              {/* Comparison: scheduled vs actual (today) */}
              {todaySchedule && (() => {
                const todayCheckIns = recentCheckIns.filter(ci => {
                  const d = new Date(ci.check_in_time)
                  const now = new Date()
                  return d.getDate() === now.getDate() && d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
                })
                let actualHoursToday = 0
                for (const ci of todayCheckIns) {
                  const hours = calculateHours(ci.check_in_time, ci.check_out_time || new Date().toISOString())
                  actualHoursToday += hours
                }
                const start = todaySchedule.start_time.split(':').map(Number)
                const end = todaySchedule.end_time.split(':').map(Number)
                const scheduledHoursToday = (end[0] + end[1] / 60) - (start[0] + start[1] / 60)
                const todayPercentage = Math.min((actualHoursToday / scheduledHoursToday) * 100, 100)

                let todayColor = 'text-red-600'
                if (todayPercentage >= 80) todayColor = 'text-green-600'
                else if (todayPercentage >= 50) todayColor = 'text-yellow-600'

                return (
                  <div className="p-3 rounded-lg border">
                    <p className="text-sm font-medium mb-2">Voortgang vandaag</p>
                    <div className="flex items-baseline gap-2">
                      <span className={`text-xl font-bold ${todayColor}`}>
                        {actualHoursToday.toFixed(1)}u
                      </span>
                      <span className="text-sm text-muted-foreground">
                        van {scheduledHoursToday.toFixed(1)}u gepland
                      </span>
                    </div>
                  </div>
                )
              })()}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Schedule */}
        <TabsContent value="schedule" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Huidig weekrooster</CardTitle>
            </CardHeader>
            <CardContent>
              {allSchedules.length === 0 ? (
                <p className="text-sm text-muted-foreground">Geen goedgekeurd rooster gevonden</p>
              ) : (
                <div className="space-y-2">
                  {[1, 2, 3, 4, 5, 6, 7].map((day) => {
                    const s = scheduleMap[day]
                    const today = new Date()
                    const currentDay = today.getDay() || 7
                    const isCurrentDay = day === currentDay

                    return (
                      <div
                        key={day}
                        className={`flex items-center justify-between p-3 rounded-lg ${isCurrentDay ? 'bg-primary/10 border border-primary/30' : 'bg-muted/30'}`}
                      >
                        <span className={`text-sm font-medium ${isCurrentDay ? 'text-primary' : ''}`}>
                          {DAY_NAMES[day]}
                          {isCurrentDay && ' (vandaag)'}
                        </span>
                        {s ? (
                          <span className="text-sm font-mono">
                            {s.start_time.slice(0, 5)} - {s.end_time.slice(0, 5)}
                          </span>
                        ) : (
                          <span className="text-sm text-muted-foreground">Vrij</span>
                        )}
                      </div>
                    )
                  })}
                  <div className="pt-2 border-t mt-3">
                    <div className="flex justify-between text-sm">
                      <span className="font-medium">Totaal per week</span>
                      <span className="font-bold">{scheduledWeeklyHours.toFixed(1)} uur</span>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Attendance */}
        <TabsContent value="attendance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Recente check-ins</CardTitle>
            </CardHeader>
            <CardContent>
              {recentCheckIns.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nog geen check-ins</p>
              ) : (
                <div className="space-y-2">
                  {recentCheckIns.map((ci: any) => {
                    const checkedIn = new Date(ci.check_in_time)
                    const checkedOut = ci.check_out_time ? new Date(ci.check_out_time) : null
                    const hours = calculateHours(ci.check_in_time, ci.check_out_time)

                    return (
                      <div key={ci.id} className="flex items-center justify-between p-2 rounded border text-sm">
                        <div>
                          <p className="font-medium">{ci.locations?.name || 'Onbekend'}</p>
                          <p className="text-xs text-muted-foreground">
                            {checkedIn.toLocaleDateString('nl-NL', { weekday: 'short', day: 'numeric', month: 'short' })}
                            {' '}
                            {checkedIn.toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' })}
                            {checkedOut && ` - ${checkedOut.toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' })}`}
                          </p>
                        </div>
                        <div className="text-right">
                          {checkedOut ? (
                            <span className="text-muted-foreground">{hours.toFixed(1)}u</span>
                          ) : (
                            <Badge className="bg-green-600">Actief</Badge>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Weekly Overview */}
        <TabsContent value="weekly" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Weekoverzicht</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Weekly totals */}
              <div className="p-4 rounded-lg border">
                <div className="flex items-baseline justify-between mb-2">
                  <span className={`text-2xl font-bold ${textColor}`}>{weeklyHours.toFixed(1)}u</span>
                  <span className="text-sm text-muted-foreground">doel: {targetHours}u</span>
                </div>
                <Progress value={percentage} className="h-3" indicatorClassName={progressColor} />
                <p className="text-xs text-muted-foreground mt-2">
                  {percentage >= 100 ? 'Doel bereikt!' : `Nog ${(targetHours - weeklyHours).toFixed(1)}u te gaan`}
                </p>
              </div>

              {/* Day-by-day comparison */}
              <div className="space-y-3">
                <p className="text-sm font-medium">Per dag</p>
                {[1, 2, 3, 4, 5, 6, 7].map((day) => {
                  const s = scheduleMap[day]
                  const today = new Date()
                  const currentDay = today.getDay() || 7

                  // Calculate actual hours for this day of the week
                  const dayCheckIns = weekCheckIns.filter(ci => {
                    const d = new Date(ci.check_in_time)
                    return (d.getDay() || 7) === day
                  })
                  let actualDayHours = 0
                  for (const ci of dayCheckIns) {
                    if (ci.check_out_time) {
                      actualDayHours += calculateHours(ci.check_in_time, ci.check_out_time)
                    }
                  }

                  // Scheduled hours
                  let scheduledDayHours = 0
                  if (s) {
                    const start = s.start_time.split(':').map(Number)
                    const end = s.end_time.split(':').map(Number)
                    scheduledDayHours = (end[0] + end[1] / 60) - (start[0] + start[1] / 60)
                  }

                  const isPast = day < currentDay
                  const isCurrent = day === currentDay
                  const isFuture = day > currentDay

                  // Color: green if met/exceeded, red if missed (past), neutral if future
                  let dayTextColor = 'text-muted-foreground'
                  if (scheduledDayHours > 0 && isPast) {
                    dayTextColor = actualDayHours >= scheduledDayHours * 0.8 ? 'text-green-600' : 'text-red-600'
                  } else if (scheduledDayHours > 0 && isCurrent && actualDayHours > 0) {
                    dayTextColor = actualDayHours >= scheduledDayHours * 0.8 ? 'text-green-600' : 'text-yellow-600'
                  }

                  return (
                    <div
                      key={day}
                      className={`flex items-center justify-between p-2 rounded ${isCurrent ? 'bg-primary/10 border border-primary/30' : ''}`}
                    >
                      <span className={`text-sm ${isCurrent ? 'font-medium text-primary' : isFuture ? 'text-muted-foreground' : ''}`}>
                        {DAY_NAMES[day]}
                      </span>
                      <div className="flex items-center gap-3 text-sm">
                        {scheduledDayHours > 0 && (
                          <span className="text-muted-foreground">
                            gepland: {scheduledDayHours.toFixed(1)}u
                          </span>
                        )}
                        <span className={`font-medium ${dayTextColor}`}>
                          {actualDayHours > 0 ? `${actualDayHours.toFixed(1)}u` : isFuture ? '-' : '0u'}
                        </span>
                        {scheduledDayHours > 0 && isPast && (
                          actualDayHours >= scheduledDayHours * 0.8 ? (
                            <CheckCircle className="h-4 w-4 text-green-500" />
                          ) : (
                            <XCircle className="h-4 w-4 text-red-500" />
                          )
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Daily breakdown with actual check-ins */}
              {Object.entries(checkInsByDay).length > 0 && (
                <div className="space-y-3 pt-4 border-t">
                  <p className="text-sm font-medium">Check-in details deze week</p>
                  {Object.entries(checkInsByDay).map(([day, cis]) => (
                    <div key={day}>
                      <p className="text-xs font-medium text-muted-foreground uppercase mb-1">{day}</p>
                      {cis.map((ci: any) => {
                        const inn = new Date(ci.check_in_time)
                        const out = ci.check_out_time ? new Date(ci.check_out_time) : null
                        return (
                          <div key={ci.id} className="flex items-center justify-between pl-3 py-1 text-sm border-l-2 border-muted">
                            <span>
                              {inn.toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' })}
                              {out && ` - ${out.toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' })}`}
                              <span className="text-muted-foreground"> ({ci.locations?.name})</span>
                            </span>
                            <span className="text-muted-foreground">
                              {out ? `${calculateHours(ci.check_in_time, ci.check_out_time).toFixed(1)}u` : 'actief'}
                            </span>
                          </div>
                        )
                      })}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Leave Requests */}
        <TabsContent value="leave" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Verlofaanvragen</CardTitle>
            </CardHeader>
            <CardContent>
              {leaveRequests.length === 0 ? (
                <p className="text-sm text-muted-foreground">Geen verlofaanvragen</p>
              ) : (
                <div className="space-y-3">
                  {leaveRequests.map((lr: any) => {
                    const reasonLabels: Record<string, string> = {
                      sick: 'Ziek',
                      late: 'Te laat',
                      appointment: 'Afspraak',
                    }
                    const statusColors: Record<string, string> = {
                      pending: 'bg-yellow-100 text-yellow-800',
                      approved: 'bg-green-100 text-green-800',
                      rejected: 'bg-red-100 text-red-800',
                    }
                    const statusLabels: Record<string, string> = {
                      pending: 'In behandeling',
                      approved: 'Goedgekeurd',
                      rejected: 'Afgewezen',
                    }

                    return (
                      <div key={lr.id} className="p-3 rounded-lg border">
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="text-sm font-medium">
                              {reasonLabels[lr.reason] || lr.reason}
                              {' — '}
                              {new Date(lr.date).toLocaleDateString('nl-NL', { weekday: 'short', day: 'numeric', month: 'short' })}
                            </p>
                            {(lr.start_time || lr.end_time) && (
                              <p className="text-xs text-muted-foreground">
                                {lr.start_time?.slice(0, 5)}{lr.end_time && ` - ${lr.end_time.slice(0, 5)}`}
                              </p>
                            )}
                            {lr.description && (
                              <p className="text-xs text-muted-foreground mt-1">{lr.description}</p>
                            )}
                            {lr.admin_note && (
                              <p className="text-xs mt-1 italic text-muted-foreground">
                                Admin: {lr.admin_note}
                              </p>
                            )}
                          </div>
                          <Badge className={statusColors[lr.status] || ''}>
                            {statusLabels[lr.status] || lr.status}
                          </Badge>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

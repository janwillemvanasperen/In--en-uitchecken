// @ts-nocheck
import { requireAdmin } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { Users, MapPin, Calendar, Clock, FileText, Settings, ClipboardCheck, GraduationCap, UserCheck, Target, Tag, Send } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function AdminDashboard() {
  const user = await requireAdmin()
  const supabase = await createClient()

  const today = new Date()
  const dayOfWeek = today.getDay() || 7
  const todayStr = today.toISOString().split('T')[0]

  const [
    { count: studentCount },
    { count: pendingSchedules },
    { count: pendingLeave },
    { count: activeCheckIns },
    { data: recentCheckIns },
    { count: coachCount },
    { count: scheduledTodayCount },
  ] = await Promise.all([
    supabase.from('users').select('*', { count: 'exact', head: true }).eq('role', 'student'),
    supabase.from('schedules').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
    supabase.from('leave_requests').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
    supabase.from('check_ins').select('*', { count: 'exact', head: true }).is('check_out_time', null),
    supabase.from('check_ins').select('*, users!check_ins_user_id_fkey(full_name), locations!check_ins_location_id_fkey(name)').order('check_in_time', { ascending: false }).limit(5),
    supabase.from('coaches').select('*', { count: 'exact', head: true }).eq('active', true),
    supabase.from('schedules').select('*', { count: 'exact', head: true }).eq('day_of_week', dayOfWeek).eq('status', 'approved').lte('valid_from', todayStr).gte('valid_until', todayStr),
  ])

  const sections = [
    {
      title: 'Dagelijks',
      items: [
        { title: 'Mijn studenten', description: 'Overzicht en voortgang per student', href: '/admin/my-students', icon: UserCheck, badge: activeCheckIns || null },
        { title: 'Aanwezigheid', description: 'Bekijk check-ins en exporteer', href: '/admin/check-ins', icon: ClipboardCheck },
        { title: 'Roostergoedkeuring', description: 'Keur ingediende roosters goed of af', href: '/admin/schedules', icon: Calendar, badge: pendingSchedules || null },
        { title: 'Verlofgoedkeuring', description: 'Keur verlofaanvragen goed of af', href: '/admin/leave-requests', icon: FileText, badge: pendingLeave || null },
        { title: 'Roosterpush', description: 'Stuur studenten een roosterverzoek', href: '/admin/schedule-push', icon: Send },
      ],
    },
    {
      title: 'Beheer',
      items: [
        { title: 'Gebruikers', description: 'Beheer student- en beheerdersaccounts', href: '/admin/users', icon: Users },
        { title: 'Coaches', description: 'Beheer coaches, werkroosters en groepen', href: '/admin/coaches', icon: GraduationCap, badge: coachCount || null },
        { title: 'Locaties', description: 'Voeg locaties toe of bewerk ze', href: '/admin/locations', icon: MapPin },
      ],
    },
    {
      title: 'Configuratie',
      items: [
        { title: 'Ontwikkeldoelen', description: 'Beheer doelnamen en fases', href: '/admin/development-goals', icon: Target },
        { title: 'Notitie labels', description: 'Beheer labels voor coach notities', href: '/admin/note-labels', icon: Tag },
        { title: 'Instellingen', description: 'Systeeminstellingen en dagcapaciteit', href: '/admin/settings', icon: Settings },
      ],
    },
  ]

  return (
    <main className="container mx-auto px-4 py-8 space-y-8">

      {/* Stats row */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-1">
            <CardDescription>Studenten</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{studentCount || 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-1">
            <CardDescription>Nu aanwezig</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-green-600">{activeCheckIns || 0}</p>
            <p className="text-xs text-muted-foreground">{scheduledTodayCount || 0} ingepland vandaag</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-1">
            <CardDescription>Roosters te beoordelen</CardDescription>
          </CardHeader>
          <CardContent>
            <p className={`text-3xl font-bold ${(pendingSchedules || 0) > 0 ? 'text-orange-500' : ''}`}>{pendingSchedules || 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-1">
            <CardDescription>Verlof te beoordelen</CardDescription>
          </CardHeader>
          <CardContent>
            <p className={`text-3xl font-bold ${(pendingLeave || 0) > 0 ? 'text-orange-500' : ''}`}>{pendingLeave || 0}</p>
          </CardContent>
        </Card>
      </div>

      {/* Recent check-ins */}
      {recentCheckIns && recentCheckIns.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Recente check-ins
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {recentCheckIns.map((ci: any) => (
                <div key={ci.id} className="flex items-center justify-between text-sm">
                  <div>
                    <span className="font-medium">{ci.users?.full_name || 'Onbekend'}</span>
                    <span className="text-muted-foreground"> · </span>
                    <span className="text-muted-foreground">{ci.locations?.name || 'Onbekend'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground tabular-nums">
                      {new Date(ci.check_in_time).toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    {ci.check_out_time ? (
                      <Badge variant="secondary">Uit</Badge>
                    ) : (
                      <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Actief</Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Grouped nav sections */}
      {sections.map((section) => (
        <div key={section.title}>
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">{section.title}</h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {section.items.map((item) => (
              <Link key={item.href} href={item.href}>
                <Card className="h-full hover:border-foreground/30 transition-colors cursor-pointer">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center gap-2">
                      <item.icon className="h-4 w-4 shrink-0" />
                      {item.title}
                      {item.badge ? (
                        <Badge variant="secondary" className="ml-auto">{item.badge}</Badge>
                      ) : null}
                    </CardTitle>
                    <CardDescription className="text-xs">{item.description}</CardDescription>
                  </CardHeader>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      ))}

    </main>
  )
}

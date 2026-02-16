// @ts-nocheck
import { requireAdmin } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { LogoutButton } from '@/components/logout-button'
import { Users, MapPin, Calendar, Clock, FileText, Settings, ClipboardCheck, GraduationCap, UserCheck } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function AdminDashboard() {
  const user = await requireAdmin()
  const supabase = await createClient()

  // Get today info for schedule count
  const today = new Date()
  const dayOfWeek = today.getDay() || 7
  const todayStr = today.toISOString().split('T')[0]

  // Get statistics
  const [
    { count: studentCount },
    { count: pendingSchedules },
    { count: pendingLeave },
    { count: locationsCount },
    { count: activeCheckIns },
    { data: recentCheckIns },
    { count: coachCount },
    { count: scheduledTodayCount },
  ] = await Promise.all([
    supabase.from('users').select('*', { count: 'exact', head: true }).eq('role', 'student'),
    supabase.from('schedules').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
    supabase.from('leave_requests').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
    supabase.from('locations').select('*', { count: 'exact', head: true }),
    supabase.from('check_ins').select('*', { count: 'exact', head: true }).is('check_out_time', null),
    supabase.from('check_ins').select('*, users!check_ins_user_id_fkey(full_name), locations!check_ins_location_id_fkey(name)').order('check_in_time', { ascending: false }).limit(5),
    supabase.from('coaches').select('*', { count: 'exact', head: true }).eq('active', true),
    supabase.from('schedules').select('*', { count: 'exact', head: true }).eq('day_of_week', dayOfWeek).eq('status', 'approved').lte('valid_from', todayStr).gte('valid_until', todayStr),
  ])

  const navCards = [
    { title: 'Mijn Studenten', description: 'Overzicht en voortgang per student', href: '/admin/my-students', icon: UserCheck, badge: activeCheckIns },
    { title: 'Gebruikersbeheer', description: 'Beheer student accounts', href: '/admin/users', icon: Users },
    { title: 'Coaches', description: 'Beheer coaches en groepen', href: '/admin/coaches', icon: GraduationCap, badge: coachCount },
    { title: 'Locatiebeheer', description: 'Voeg locaties toe of bewerk ze', href: '/admin/locations', icon: MapPin },
    { title: 'Roostergoedkeuring', description: 'Keur student roosters goed', href: '/admin/schedules', icon: Calendar, badge: pendingSchedules },
    { title: 'Verlofgoedkeuring', description: 'Keur verlofaanvragen goed of af', href: '/admin/leave-requests', icon: FileText, badge: pendingLeave },
    { title: 'Aanwezigheid', description: 'Bekijk check-ins en exporteer', href: '/admin/check-ins', icon: ClipboardCheck },
    { title: 'Instellingen', description: 'Wijzig systeeminstellingen', href: '/admin/settings', icon: Settings },
  ]

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold">Admin Dashboard</h1>
          <div className="flex items-center gap-4">
            <p className="text-sm text-muted-foreground">{user.full_name}</p>
            <LogoutButton />
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Statistics */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Studenten</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{studentCount || 0}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Actieve check-ins</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-green-600">{activeCheckIns || 0}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Pending roosters</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{pendingSchedules || 0}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Pending verlof</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{pendingLeave || 0}</p>
            </CardContent>
          </Card>
        </div>

        {/* Studenten Vandaag widget */}
        <Card className="mt-6">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <UserCheck className="h-4 w-4" />
              Studenten vandaag
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-6">
              <div>
                <p className="text-2xl font-bold text-green-600">{activeCheckIns || 0}</p>
                <p className="text-xs text-muted-foreground">nu actief</p>
              </div>
              <div>
                <p className="text-2xl font-bold">{scheduledTodayCount || 0}</p>
                <p className="text-xs text-muted-foreground">ingepland</p>
              </div>
              <Link href="/admin/my-students" className="ml-auto">
                <Button variant="outline" size="sm">Bekijk studenten</Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Recent activity */}
        {recentCheckIns && recentCheckIns.length > 0 && (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Recente activiteit
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {recentCheckIns.map((ci: any) => (
                  <div key={ci.id} className="flex items-center justify-between text-sm">
                    <div>
                      <span className="font-medium">{ci.users?.full_name || 'Onbekend'}</span>
                      <span className="text-muted-foreground"> bij </span>
                      <span>{ci.locations?.name || 'Onbekend'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground">
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

        {/* Navigation cards */}
        <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {navCards.map((card) => (
            <Card key={card.href}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <card.icon className="h-5 w-5" />
                  {card.title}
                  {card.badge ? (
                    <Badge variant="secondary" className="ml-auto">{card.badge}</Badge>
                  ) : null}
                </CardTitle>
                <CardDescription>{card.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <Link href={card.href}>
                  <Button className="w-full">Openen</Button>
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      </main>
    </div>
  )
}

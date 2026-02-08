import { requireAdmin } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { LogoutButton } from '@/components/logout-button'

export default async function AdminDashboard() {
  const user = await requireAdmin()
  const supabase = await createClient()

  // Get statistics
  const { count: studentCount } = await supabase
    .from('users')
    .select('*', { count: 'exact', head: true })
    .eq('role', 'student')

  const { count: pendingSchedules } = await supabase
    .from('schedules')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'pending')

  const { count: pendingLeave } = await supabase
    .from('leave_requests')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'pending')

  const { count: locationsCount } = await supabase
    .from('locations')
    .select('*', { count: 'exact', head: true })

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
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader>
              <CardTitle>Studenten</CardTitle>
              <CardDescription>Totaal aantal studenten</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{studentCount || 0}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Roosters</CardTitle>
              <CardDescription>Wachtend op goedkeuring</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{pendingSchedules || 0}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Verlofaanvragen</CardTitle>
              <CardDescription>Wachtend op goedkeuring</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{pendingLeave || 0}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Locaties</CardTitle>
              <CardDescription>Totaal aantal locaties</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{locationsCount || 0}</p>
            </CardContent>
          </Card>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle>Gebruikersbeheer</CardTitle>
              <CardDescription>Beheer student accounts</CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/admin/users">
                <Button className="w-full">
                  Beheer gebruikers
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Locatiebeheer</CardTitle>
              <CardDescription>Voeg locaties toe of bewerk ze</CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/admin/locations">
                <Button className="w-full">
                  Beheer locaties
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Roostergoedkeuring</CardTitle>
              <CardDescription>Keur student roosters goed</CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/admin/schedules">
                <Button className="w-full">
                  Bekijk roosters
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Verlofgoedkeuring</CardTitle>
              <CardDescription>Keur verlofaanvragen goed of af</CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/admin/leave-requests">
                <Button className="w-full">
                  Bekijk aanvragen
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Check-ins</CardTitle>
              <CardDescription>Bekijk en bewerk timestamps</CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/admin/check-ins">
                <Button className="w-full">
                  Bekijk check-ins
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Instellingen</CardTitle>
              <CardDescription>Wijzig systeeminstellingen</CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/admin/settings">
                <Button className="w-full">
                  Instellingen
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}

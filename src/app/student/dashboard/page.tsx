import { requireStudent } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { LogoutButton } from '@/components/logout-button'

export default async function StudentDashboard() {
  const user = await requireStudent()
  const supabase = await createClient()

  // Get user's schedules
  const { data: schedules } = await supabase
    .from('schedules')
    .select('*')
    .eq('user_id', user.id)
    .order('day_of_week', { ascending: true })

  // Get recent check-ins
  const { data: checkIns } = await supabase
    .from('check_ins')
    .select('*, locations(*)')
    .eq('user_id', user.id)
    .order('check_in_time', { ascending: false })
    .limit(5)

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold">Student Dashboard</h1>
          <div className="flex items-center gap-4">
            <p className="text-sm text-muted-foreground">{user.full_name}</p>
            <LogoutButton />
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle>Welkom terug!</CardTitle>
              <CardDescription>
                {user.full_name}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Je bent ingelogd als student
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Mijn rooster</CardTitle>
              <CardDescription>
                {schedules?.length || 0} sessies gepland
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/student/schedule">
                <Button variant="outline" className="w-full">
                  Bekijk rooster
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Check in/uit</CardTitle>
              <CardDescription>
                Start of beëindig je sessie
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/student/check-in">
                <Button className="w-full">
                  Check in/uit
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Recente check-ins</CardTitle>
            <CardDescription>
              Je laatste 5 check-in sessies
            </CardDescription>
          </CardHeader>
          <CardContent>
            {checkIns && checkIns.length > 0 ? (
              <div className="space-y-4">
                {checkIns.map((checkIn: any) => (
                  <div key={checkIn.id} className="flex items-center justify-between border-b pb-2">
                    <div>
                      <p className="font-medium">{checkIn.locations?.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(checkIn.check_in_time).toLocaleString('nl-NL')}
                      </p>
                    </div>
                    <div className="text-right">
                      {checkIn.check_out_time ? (
                        <span className="text-green-600">Uitgecheckt</span>
                      ) : (
                        <span className="text-blue-600">Actief</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Nog geen check-ins</p>
            )}
          </CardContent>
        </Card>

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Verlofaanvragen</CardTitle>
              <CardDescription>Vraag verlof aan voor ziekte, te laat of afspraak</CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/student/leave-requests">
                <Button variant="outline" className="w-full">
                  Beheer verlof
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Voortgang</CardTitle>
              <CardDescription>Bekijk je uren en voortgang</CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/student/progress">
                <Button variant="outline" className="w-full">
                  Bekijk voortgang
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}

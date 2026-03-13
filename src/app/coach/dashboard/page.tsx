// @ts-nocheck
import { requireCoach } from '@/lib/auth'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Construction } from 'lucide-react'

export default async function CoachDashboard() {
  const user = await requireCoach()

  return (
    <div className="max-w-lg mx-auto mt-12">
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Construction className="h-4 w-4 text-primary" />
            Coach dashboard
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Hallo {user.full_name}, het coach dashboard is nog in ontwikkeling en komt binnenkort beschikbaar.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

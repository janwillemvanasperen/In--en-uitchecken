// @ts-nocheck
import { requireCoach } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Settings, Bell, Eye } from 'lucide-react'

export default async function CoachSettingsPage() {
  const user = await requireCoach()
  const supabase = await createClient()

  const { data: profile } = await supabase
    .from('users')
    .select('full_name, email, profile_photo_url')
    .eq('id', user.id)
    .single()

  return (
    <div className="space-y-4 max-w-lg">
      <h1 className="text-xl font-bold">Instellingen</h1>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Eye className="h-4 w-4" /> Standaard weergave
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p className="text-muted-foreground">De standaard weergave is "Mijn Studenten". Je kunt dit per sessie aanpassen via de weergave-selector bovenaan elke pagina.</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Bell className="h-4 w-4" /> Notificaties
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div className="flex items-center justify-between py-1">
            <span>Openstaande verlofaanvragen</span>
            <Badge variant="outline">Zichtbaar op dashboard</Badge>
          </div>
          <div className="flex items-center justify-between py-1">
            <span>Studenten niet ingecheckt</span>
            <Badge variant="outline">Zichtbaar op dashboard</Badge>
          </div>
          <div className="flex items-center justify-between py-1 opacity-50">
            <span>Nieuw ingediend werk</span>
            <Badge variant="outline" className="border-[#ffd100] text-[#ffd100]">Binnenkort</Badge>
          </div>
          <div className="flex items-center justify-between py-1 opacity-50">
            <span>Wekelijkse samenvatting</span>
            <Badge variant="outline" className="border-[#ffd100] text-[#ffd100]">Binnenkort</Badge>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Settings className="h-4 w-4" /> Accountgegevens
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div>
            <p className="text-xs text-muted-foreground">Naam</p>
            <p className="font-medium">{profile?.full_name || user.full_name}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Email</p>
            <p className="font-medium">{user.email}</p>
          </div>
          <p className="text-xs text-muted-foreground pt-2">
            Account- en profielwijzigingen kunnen worden aangevraagd bij de beheerder.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

// @ts-nocheck
import { requireAdmin } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/server'
import { SettingsForm } from '@/components/admin/settings-form'
import { DayCapacityEditor } from '@/components/admin/day-capacity-editor'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export default async function AdminSettingsPage() {
  await requireAdmin()
  const supabase = await createClient()
  const adminClient = createAdminClient()

  const [{ data: settings }, { data: capacityRows }] = await Promise.all([
    supabase.from('settings').select('*').order('key'),
    adminClient.from('day_capacities').select('day_of_week, max_spots').order('day_of_week'),
  ])

  return (
    <>
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex items-center gap-4">
          <Link href="/admin/dashboard">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Terug
            </Button>
          </Link>
          <h1 className="text-2xl font-bold">Instellingen</h1>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-2xl space-y-8">
        <SettingsForm settings={settings || []} />
        <DayCapacityEditor initialCapacities={capacityRows || []} />
      </main>
</>
  )
}

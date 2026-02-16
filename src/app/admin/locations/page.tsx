// @ts-nocheck
import { requireAdmin } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { LocationList } from '@/components/admin/location-list'
import { LocationForm } from '@/components/admin/location-form'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export default async function AdminLocationsPage() {
  await requireAdmin()
  const supabase = await createClient()

  const { data: locations } = await supabase
    .from('locations')
    .select('*')
    .order('name')

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex items-center gap-4">
          <Link href="/admin/dashboard">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Terug
            </Button>
          </Link>
          <h1 className="text-2xl font-bold">Locatiebeheer</h1>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-2xl space-y-6">
        <LocationForm />
        <LocationList locations={locations || []} />
      </main>
    </div>
  )
}

// @ts-nocheck
import { requireAdmin } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { CheckInList } from '@/components/admin/check-in-list'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export default async function AdminCheckInsPage() {
  await requireAdmin()
  const supabase = await createClient()

  const { data: checkIns } = await supabase
    .from('check_ins')
    .select('*, users(full_name), locations(name)')
    .order('check_in_time', { ascending: false })
    .limit(500)

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
          <h1 className="text-2xl font-bold">Aanwezigheid</h1>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <CheckInList checkIns={checkIns || []} />
      </main>
    </div>
  )
}

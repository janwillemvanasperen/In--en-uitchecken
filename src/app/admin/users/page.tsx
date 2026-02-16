// @ts-nocheck
import { requireAdmin } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { UserList } from '@/components/admin/user-list'
import { UserForm } from '@/components/admin/user-form'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function AdminUsersPage() {
  await requireAdmin()
  const supabase = await createClient()

  const [{ data: users }, { data: coaches }] = await Promise.all([
    supabase.from('users').select('*').order('full_name'),
    supabase.from('coaches').select('*').order('name'),
  ])

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
          <h1 className="text-2xl font-bold">Gebruikersbeheer</h1>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-4xl space-y-6">
        <UserForm coaches={coaches || []} />
        <UserList users={users || []} coaches={coaches || []} />
      </main>
    </div>
  )
}

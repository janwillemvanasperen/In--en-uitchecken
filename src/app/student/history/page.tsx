import { requireStudent } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { HistoryFilterTabs } from '@/components/student/history-filter-tabs'
import { HistoryList } from '@/components/student/history-list'
import { getMonday } from '@/lib/date-utils'

export default async function HistoryPage({
  searchParams,
}: {
  searchParams: { filter?: 'week' | 'month' | 'all' }
}) {
  const user = await requireStudent()
  const supabase = await createClient()
  const filter = searchParams.filter || 'week'

  // Calculate date range based on filter
  let startDate: Date
  const endDate = new Date()

  if (filter === 'week') {
    startDate = getMonday(new Date())
  } else if (filter === 'month') {
    startDate = new Date(endDate.getFullYear(), endDate.getMonth(), 1)
  } else {
    // All time
    startDate = new Date(0)
  }

  // Fetch check-ins
  const { data: checkIns } = await supabase
    .from('check_ins')
    .select('*, locations(*)')
    .eq('user_id', user.id)
    .gte('check_in_time', startDate.toISOString())
    .order('check_in_time', { ascending: false })

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4">
          <h1 className="text-2xl font-bold">Geschiedenis</h1>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <HistoryFilterTabs currentFilter={filter} />

        <div className="mt-6">
          <HistoryList checkIns={checkIns || []} />
        </div>
      </main>
    </div>
  )
}

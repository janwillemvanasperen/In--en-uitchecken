// @ts-nocheck
import { requireStudent } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScheduleEditor } from '@/components/student/schedule-editor'
import { ScheduleOverview } from '@/components/student/schedule-overview'
import { ScheduleHistory } from '@/components/student/schedule-history'

export default async function SchedulePage() {
  const user = await requireStudent()
  const supabase = await createClient()

  const today = new Date().toISOString().split('T')[0]

  // Get current approved schedule
  const { data: currentSchedule } = await supabase
    .from('schedules')
    .select('*')
    .eq('user_id', user.id)
    .eq('status', 'approved')
    .lte('valid_from', today)
    .gte('valid_until', today)
    .order('day_of_week', { ascending: true })

  // Get pending schedule
  const { data: pendingSchedule } = await supabase
    .from('schedules')
    .select('*')
    .eq('user_id', user.id)
    .eq('status', 'pending')
    .order('day_of_week', { ascending: true })

  // Get settings
  const { data: settings } = await supabase
    .from('settings')
    .select('key, value')
    .in('key', ['minimum_hours_per_week', 'default_start_time', 'schedule_approval_period_weeks'])

  const settingsMap: Record<string, string> = {}
  settings?.forEach((s: any) => {
    settingsMap[s.key] = s.value
  })

  const minimumHours = Number(settingsMap['minimum_hours_per_week'] || '16')
  const defaultStartTime = settingsMap['default_start_time'] || '10:00'
  const periodWeeks = Number(settingsMap['schedule_approval_period_weeks'] || '6')

  // Get schedule history (past schedules, grouped by submission_group)
  const { data: allSchedules } = await supabase
    .from('schedules')
    .select('*')
    .eq('user_id', user.id)
    .lt('valid_until', today)
    .order('valid_from', { ascending: false })

  // Group by submission_group
  const historyGroups: Record<string, any> = {}
  allSchedules?.forEach((s: any) => {
    const group = s.submission_group || s.id
    if (!historyGroups[group]) {
      historyGroups[group] = {
        submissionGroup: group,
        validFrom: s.valid_from,
        validUntil: s.valid_until,
        status: s.status,
        entries: [],
      }
    }
    historyGroups[group].entries.push(s)
  })

  const history = Object.values(historyGroups).slice(0, 10)

  // Determine default tab
  const hasPending = pendingSchedule && pendingSchedule.length > 0
  const hasApproved = currentSchedule && currentSchedule.length > 0
  const defaultTab = (!hasApproved && !hasPending) ? 'indienen' : 'overzicht'

  return (
    <Tabs defaultValue={defaultTab} className="space-y-6">
      <TabsList>
        <TabsTrigger value="overzicht">Overzicht</TabsTrigger>
        <TabsTrigger value="indienen">
          {hasPending ? 'Bewerken' : 'Indienen'}
        </TabsTrigger>
      </TabsList>

      <TabsContent value="overzicht" className="space-y-6">
        <ScheduleOverview
          currentSchedule={currentSchedule}
          pendingSchedule={pendingSchedule}
        />
        <ScheduleHistory history={history} />
      </TabsContent>

      <TabsContent value="indienen">
        <ScheduleEditor
          defaultStartTime={defaultStartTime}
          minimumHours={minimumHours}
          periodWeeks={periodWeeks}
          existingPending={pendingSchedule}
        />
      </TabsContent>
    </Tabs>
  )
}

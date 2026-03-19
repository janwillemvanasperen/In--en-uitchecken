// @ts-nocheck
import { requireStudent } from '@/lib/auth'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScheduleEditor } from '@/components/student/schedule-editor'
import { ScheduleOverview } from '@/components/student/schedule-overview'
import { ScheduleHistory } from '@/components/student/schedule-history'

export default async function SchedulePage({ searchParams }: { searchParams: Promise<any> }) {
  const sp = await searchParams
  const user = await requireStudent()
  const supabase = await createClient()
  const adminClient = createAdminClient()

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

  // Fetch day capacities + current occupancy (excluding this student)
  const [{ data: capacityRows }, { data: occupancyRows }] = await Promise.all([
    adminClient.from('day_capacities').select('day_of_week, max_spots'),
    adminClient
      .from('schedules')
      .select('user_id, day_of_week')
      .eq('status', 'approved')
      .gte('valid_until', today)
      .neq('user_id', user.id),
  ])

  // Count distinct students per day
  const usedByDay: Record<number, Set<string>> = {}
  for (const row of occupancyRows || []) {
    if (!usedByDay[row.day_of_week]) usedByDay[row.day_of_week] = new Set()
    usedByDay[row.day_of_week].add(row.user_id)
  }

  const dayCapacity: Record<number, { used: number; max: number }> = {}
  for (const cap of capacityRows || []) {
    dayCapacity[cap.day_of_week] = {
      max: cap.max_spots,
      used: usedByDay[cap.day_of_week]?.size ?? 0,
    }
  }

  // Open schedule push request for this student
  const { data: openPushRecipient } = await adminClient
    .from('schedule_push_recipients')
    .select('id, schedule_push_requests(id, valid_from, valid_until, message)')
    .eq('student_id', user.id)
    .eq('responded', false)
    .order('id', { ascending: false })
    .limit(1)
    .maybeSingle()

  const openPush = openPushRecipient
    ? (openPushRecipient.schedule_push_requests as any)
    : null

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

  // Determine default tab — open push or ?tab=indienen forces submit tab
  const hasPending = pendingSchedule && pendingSchedule.length > 0
  const hasApproved = currentSchedule && currentSchedule.length > 0
  const forceSubmit = sp?.tab === 'indienen' || !!openPush
  const defaultTab = (forceSubmit || (!hasApproved && !hasPending)) ? 'indienen' : 'overzicht'

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
          dayCapacity={dayCapacity}
          pushRequest={openPush ? {
            id: openPush.id,
            valid_from: openPush.valid_from,
            valid_until: openPush.valid_until,
            message: openPush.message,
          } : null}
        />
      </TabsContent>
    </Tabs>
  )
}

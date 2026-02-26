import { requireStudent } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { CheckInClient } from '@/components/student/check-in-client'

export default async function CheckInPage() {
  const user = await requireStudent()
  const supabase = await createClient()

  // Get all locations
  const { data: locations } = await supabase
    .from('locations')
    .select('*')
    .order('name')

  // Get active check-in
  const { data: activeCheckIn } = await supabase
    .from('check_ins')
    .select('*, locations(*)')
    .eq('user_id', user.id)
    .is('check_out_time', null)
    .single()

  // Get today's schedule
  const today = new Date()
  const dayOfWeek = today.getDay() || 7

  const { data: todaySchedule } = await supabase
    .from('schedules')
    .select('*')
    .eq('user_id', user.id)
    .eq('day_of_week', dayOfWeek)
    .eq('status', 'approved')
    .lte('valid_from', today.toISOString().split('T')[0])
    .gte('valid_until', today.toISOString().split('T')[0])
    .single()

  return (
    <CheckInClient
      locations={locations || []}
      activeCheckIn={activeCheckIn}
      todaySchedule={todaySchedule}
      userId={user.id}
    />
  )
}

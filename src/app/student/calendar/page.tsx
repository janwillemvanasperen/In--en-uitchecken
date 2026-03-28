// @ts-nocheck
import { requireStudent } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { StudentCalendarView } from '@/components/calendar/student-calendar-view'
import type { CalendarEvent } from '@/components/calendar/types'

export const dynamic = 'force-dynamic'

export default async function StudentCalendarPage() {
  const user = await requireStudent()
  const supabase = await createClient()

  // RLS ensures we only get events relevant to this student:
  // - coach events targeting this student or all of their coach's students
  // - shared events owned by this student
  const { data: eventsRaw } = await supabase
    .from('calendar_events')
    .select('*, calendar_event_labels(id, name, color)')
    .order('event_date', { ascending: true })
    .order('start_time', { ascending: true, nullsFirst: false })

  const events: CalendarEvent[] = eventsRaw ?? []

  return (
    <div className="p-4 md:p-6 max-w-2xl mx-auto">
      <StudentCalendarView events={events} currentUserId={user.id} />
    </div>
  )
}

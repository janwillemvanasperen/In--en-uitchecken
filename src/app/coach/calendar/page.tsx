// @ts-nocheck
import { requireCoach } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { CoachCalendarView } from '@/components/calendar/coach-calendar-view'
import type { CalendarEvent, CalendarLabel, CalendarStudent } from '@/components/calendar/types'

export const dynamic = 'force-dynamic'

export default async function CoachCalendarPage() {
  const user = await requireCoach()
  const supabase = await createClient()

  // Fetch all events visible to this coach (RLS handles filtering):
  // - events created by this coach
  // - shared events of students assigned to this coach
  const [{ data: eventsRaw }, { data: labelsRaw }, { data: studentsRaw }] = await Promise.all([
    supabase
      .from('calendar_events')
      .select('*, calendar_event_labels(id, name, color)')
      .order('event_date', { ascending: true })
      .order('start_time', { ascending: true, nullsFirst: false }),

    supabase
      .from('calendar_event_labels')
      .select('id, name, color')
      .eq('active', true)
      .order('sort_order'),

    supabase
      .from('users')
      .select('id, full_name')
      .eq('role', 'student')
      .eq('coach_id', user.id)
      .order('full_name'),
  ])

  const events: CalendarEvent[] = eventsRaw ?? []
  const labels: CalendarLabel[] = labelsRaw ?? []
  const students: CalendarStudent[] = studentsRaw ?? []

  return (
    <div className="p-4 md:p-6 max-w-2xl mx-auto">
      <CoachCalendarView
        events={events}
        students={students}
        labels={labels}
        currentUserId={user.id}
      />
    </div>
  )
}

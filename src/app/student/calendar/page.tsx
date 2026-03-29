// @ts-nocheck
import { requireStudent } from '@/lib/auth'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { StudentCalendarView } from '@/components/calendar/student-calendar-view'
import type { CalendarEvent, MeetingCycle, MeetingSlotStudent } from '@/components/calendar/types'

export const dynamic = 'force-dynamic'

export default async function StudentCalendarPage() {
  const user = await requireStudent()
  const supabase = await createClient()
  const adminSupabase = createAdminClient()

  // First get the student's coach_id
  const { data: studentProfile } = await supabase
    .from('users')
    .select('coach_id')
    .eq('id', user.id)
    .single()

  const coachId = studentProfile?.coach_id

  const [
    { data: eventsRaw },
    { data: cyclesRaw },
    { data: slotsRaw },
    { data: bookingsRaw },
  ] = await Promise.all([
    // RLS ensures we only get events relevant to this student
    supabase
      .from('calendar_events')
      .select('*, calendar_event_labels(id, name, color)')
      .order('event_date', { ascending: true })
      .order('start_time', { ascending: true, nullsFirst: false }),

    // Meeting cycles from the student's coach that target this student
    // (target_student_ids IS NULL = all students, or contains this student's id)
    coachId
      ? supabase
          .from('meeting_cycles')
          .select('*')
          .eq('coach_id', coachId)
          .eq('status', 'active')
          .or(`target_student_ids.is.null,target_student_ids.cs.{${user.id}}`)
          .order('date_from', { ascending: true })
      : Promise.resolve({ data: [] }),

    // All slots for those cycles (use adminClient to count bookings without exposing students)
    coachId
      ? adminSupabase
          .from('meeting_slots')
          .select(`
            id,
            cycle_id,
            slot_date,
            start_time,
            end_time,
            available,
            meeting_cycles!inner(title, coach_id, status, target_student_ids),
            meeting_bookings(student_id)
          `)
          .eq('meeting_cycles.coach_id', coachId)
          .eq('meeting_cycles.status', 'active')
          .eq('available', true)
          .order('slot_date', { ascending: true })
          .order('start_time', { ascending: true })
      : Promise.resolve({ data: [] }),

    // This student's own bookings
    supabase
      .from('meeting_bookings')
      .select('slot_id')
      .eq('student_id', user.id),
  ])

  const events: CalendarEvent[] = eventsRaw ?? []
  const meetingCycles: MeetingCycle[] = cyclesRaw ?? []
  const myBookedSlotIds = new Set((bookingsRaw ?? []).map((b: any) => b.slot_id))

  // Build MeetingSlotStudent[] — filter by targeting, never expose who booked
  const meetingSlots: MeetingSlotStudent[] = (slotsRaw ?? []).filter((s: any) => {
    const targets: string[] | null = s.meeting_cycles?.target_student_ids ?? null
    return targets === null || targets.includes(user.id)
  }).map((s: any) => {
    const isBooked = (s.meeting_bookings?.length ?? 0) > 0
    const isMyBooking = myBookedSlotIds.has(s.id)
    return {
      id: s.id,
      cycle_id: s.cycle_id,
      cycle_title: s.meeting_cycles?.title ?? '',
      slot_date: s.slot_date,
      start_time: s.start_time,
      end_time: s.end_time,
      isBooked,
      isMyBooking,
    }
  })

  return (
    <div className="p-4 md:p-6 max-w-2xl mx-auto">
      <StudentCalendarView
        events={events}
        currentUserId={user.id}
        meetingCycles={meetingCycles}
        meetingSlots={meetingSlots}
      />
    </div>
  )
}

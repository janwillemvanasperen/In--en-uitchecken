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

  // users.coach_id = coaches entity-ID; meeting_cycles.coach_id = auth user-ID van de coach
  const { data: studentProfile } = await supabase
    .from('users')
    .select('coach_id')
    .eq('id', user.id)
    .single()

  const coachEntityId = studentProfile?.coach_id ?? null

  // Haal de auth user-ID van de coach op via de coaches tabel
  let coachAuthUserId: string | null = null
  if (coachEntityId) {
    const { data: coachRecord } = await adminSupabase
      .from('coaches')
      .select('user_id')
      .eq('id', coachEntityId)
      .single()
    coachAuthUserId = coachRecord?.user_id ?? null
  }

  // Fetch calendar events via adminClient (bypasses broken RLS policy):
  // - own shared events always included
  // - coach events from this student's coach, filtered by targeting in app code
  let eventsRaw: any[] = []
  if (coachAuthUserId) {
    const { data } = await adminSupabase
      .from('calendar_events')
      .select('*, calendar_event_labels(id, name, color)')
      .or(
        `and(variant.eq.shared,student_id.eq.${user.id}),` +
        `and(variant.eq.coach,created_by.eq.${coachAuthUserId})`
      )
      .order('event_date', { ascending: true })
      .order('start_time', { ascending: true, nullsFirst: false })
    // Filter coach events by targeting (target_student_ids IS NULL = all; or includes this student)
    eventsRaw = (data ?? []).filter((e: any) => {
      if (e.variant !== 'coach') return true
      const targets = e.target_student_ids
      return targets == null || targets.includes(user.id)
    })
  } else {
    // No coach linked — only own shared events
    const { data } = await adminSupabase
      .from('calendar_events')
      .select('*, calendar_event_labels(id, name, color)')
      .eq('variant', 'shared')
      .eq('student_id', user.id)
      .order('event_date', { ascending: true })
      .order('start_time', { ascending: true, nullsFirst: false })
    eventsRaw = data ?? []
  }

  const [
    { data: cyclesRaw },
    { data: slotsRaw },
    { data: bookingsRaw },
  ] = await Promise.all([
    // Meeting cycles from the student's coach that target this student
    coachAuthUserId
      ? adminSupabase
          .from('meeting_cycles')
          .select('*')
          .eq('coach_id', coachAuthUserId)
          .eq('status', 'active')
          .or(`target_student_ids.is.null,target_student_ids.cs.{${user.id}}`)
          .order('date_from', { ascending: true })
      : Promise.resolve({ data: [] }),

    // All available slots for those cycles
    coachAuthUserId
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
          .eq('meeting_cycles.coach_id', coachAuthUserId)
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

  const events: CalendarEvent[] = eventsRaw
  const meetingCycles: MeetingCycle[] = cyclesRaw ?? []
  const myBookedSlotIds = new Set((bookingsRaw ?? []).map((b: any) => b.slot_id))

  // Build MeetingSlotStudent[] — never expose who else booked a slot
  const meetingSlots: MeetingSlotStudent[] = (slotsRaw ?? []).filter((s: any) => {
    const targets: string[] | null = s.meeting_cycles?.target_student_ids ?? null
    return targets == null || targets.includes(user.id)
  }).map((s: any) => ({
    id: s.id,
    cycle_id: s.cycle_id,
    cycle_title: s.meeting_cycles?.title ?? '',
    slot_date: s.slot_date,
    start_time: s.start_time,
    end_time: s.end_time,
    isBooked: (s.meeting_bookings?.length ?? 0) > 0,
    isMyBooking: myBookedSlotIds.has(s.id),
  }))

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

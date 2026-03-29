// @ts-nocheck
import { requireCoach } from '@/lib/auth'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { getCoachEntityId } from '@/lib/coach-utils'
import { CoachCalendarView } from '@/components/calendar/coach-calendar-view'
import type { CalendarEvent, CalendarLabel, CalendarStudent, MeetingCycle, MeetingSlotCoach } from '@/components/calendar/types'

export const dynamic = 'force-dynamic'

export default async function CoachCalendarPage() {
  const user = await requireCoach()
  const supabase = await createClient()
  const adminSupabase = createAdminClient()

  // users.coach_id references coaches.id (entity UUID), not auth.users.id
  const coachEntityId = await getCoachEntityId(user.id)

  const [
    { data: eventsRaw },
    { data: labelsRaw },
    { data: studentsRaw },
    { data: cyclesRaw },
    { data: slotsRaw },
  ] = await Promise.all([
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

    coachEntityId
      ? supabase
          .from('users')
          .select('id, full_name')
          .eq('role', 'student')
          .eq('coach_id', coachEntityId)
          .order('full_name')
      : Promise.resolve({ data: [] }),

    supabase
      .from('meeting_cycles')
      .select('*, target_student_ids')
      .eq('coach_id', user.id)
      .order('date_from', { ascending: false }),

    adminSupabase
      .from('meeting_slots')
      .select(`
        id,
        cycle_id,
        slot_date,
        start_time,
        end_time,
        available,
        meeting_cycles!inner(title, coach_id),
        meeting_bookings(
          student_id,
          users:student_id(id, full_name)
        )
      `)
      .eq('meeting_cycles.coach_id', user.id)
      .order('slot_date', { ascending: true })
      .order('start_time', { ascending: true }),
  ])

  const events: CalendarEvent[] = eventsRaw ?? []
  const labels: CalendarLabel[] = labelsRaw ?? []
  const students: CalendarStudent[] = studentsRaw ?? []
  const meetingCycles: MeetingCycle[] = cyclesRaw ?? []

  const meetingSlots: MeetingSlotCoach[] = (slotsRaw ?? []).map((s: any) => {
    const booking = s.meeting_bookings?.[0] ?? null
    return {
      id: s.id,
      cycle_id: s.cycle_id,
      cycle_title: s.meeting_cycles?.title ?? '',
      slot_date: s.slot_date,
      start_time: s.start_time,
      end_time: s.end_time,
      available: s.available,
      notes: s.notes ?? null,
      booked_student: booking?.users
        ? { id: booking.users.id, full_name: booking.users.full_name }
        : null,
    }
  })

  return (
    <div className="p-4 md:p-6 max-w-2xl mx-auto">
      <CoachCalendarView
        events={events}
        students={students}
        labels={labels}
        currentUserId={user.id}
        meetingCycles={meetingCycles}
        meetingSlots={meetingSlots}
      />
    </div>
  )
}


    supabase
      .from('meeting_cycles')
      .select('*, target_student_ids')
      .eq('coach_id', user.id)
      .order('date_from', { ascending: false }),

    // Use adminClient to fetch slots + bookings without RLS restrictions
    adminSupabase
      .from('meeting_slots')
      .select(`
        id,
        cycle_id,
        slot_date,
        start_time,
        end_time,
        available,
        meeting_cycles!inner(title, coach_id),
        meeting_bookings(
          student_id,
          users:student_id(id, full_name)
        )
      `)
      .eq('meeting_cycles.coach_id', user.id)
      .order('slot_date', { ascending: true })
      .order('start_time', { ascending: true }),
  ])

  const events: CalendarEvent[] = eventsRaw ?? []
  const labels: CalendarLabel[] = labelsRaw ?? []
  const students: CalendarStudent[] = studentsRaw ?? []
  const meetingCycles: MeetingCycle[] = cyclesRaw ?? []

  // Shape slots into MeetingSlotCoach[]
  const meetingSlots: MeetingSlotCoach[] = (slotsRaw ?? []).map((s: any) => {
    const booking = s.meeting_bookings?.[0] ?? null
    return {
      id: s.id,
      cycle_id: s.cycle_id,
      cycle_title: s.meeting_cycles?.title ?? '',
      slot_date: s.slot_date,
      start_time: s.start_time,
      end_time: s.end_time,
      available: s.available,
      notes: s.notes ?? null,
      booked_student: booking?.users
        ? { id: booking.users.id, full_name: booking.users.full_name }
        : null,
    }
  })

  return (
    <div className="p-4 md:p-6 max-w-2xl mx-auto">
      <CoachCalendarView
        events={events}
        students={students}
        labels={labels}
        currentUserId={user.id}
        meetingCycles={meetingCycles}
        meetingSlots={meetingSlots}
      />
    </div>
  )
}

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
        meeting_bookings(student_id)
      `)
      .eq('meeting_cycles.coach_id', user.id)
      .order('slot_date', { ascending: true })
      .order('start_time', { ascending: true }),
  ])

  const events: CalendarEvent[] = eventsRaw ?? []
  const labels: CalendarLabel[] = labelsRaw ?? []
  const students: CalendarStudent[] = studentsRaw ?? []
  const meetingCycles: MeetingCycle[] = cyclesRaw ?? []

  // meeting_bookings.student_id → auth.users, not public.users
  // PostgREST can't auto-join to public.users through auth.users, so look up names separately
  const bookedStudentIds = [...new Set(
    (slotsRaw ?? []).flatMap((s: any) => s.meeting_bookings?.map((b: any) => b.student_id) ?? [])
  )]
  const { data: studentNamesRaw } = bookedStudentIds.length > 0
    ? await adminSupabase.from('users').select('id, full_name').in('id', bookedStudentIds)
    : { data: [] }
  const studentNameMap: Record<string, string> = Object.fromEntries(
    (studentNamesRaw ?? []).map((u: any) => [u.id, u.full_name])
  )

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
      booked_student: booking?.student_id
        ? { id: booking.student_id, full_name: studentNameMap[booking.student_id] ?? 'Onbekend' }
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

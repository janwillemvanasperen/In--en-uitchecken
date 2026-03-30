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

  // Haal de auth user-ID van de EIGEN coach op via de coaches tabel
  let coachAuthUserId: string | null = null
  if (coachEntityId) {
    const { data: coachRecord } = await adminSupabase
      .from('coaches')
      .select('user_id')
      .eq('id', coachEntityId)
      .single()
    coachAuthUserId = coachRecord?.user_id ?? null
  }

  // ─── Calendar events ──────────────────────────────────────────────────────────
  // Fetch via adminClient with explicit filter (bypasses broken RLS):
  // - own shared events always included
  // - coach events from the student's own coach, filtered by targeting
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
    eventsRaw = (data ?? []).filter((e: any) => {
      if (e.variant !== 'coach') return true
      const targets = e.target_student_ids
      return targets == null || targets.includes(user.id)
    })
  } else {
    const { data } = await adminSupabase
      .from('calendar_events')
      .select('*, calendar_event_labels(id, name, color)')
      .eq('variant', 'shared')
      .eq('student_id', user.id)
      .order('event_date', { ascending: true })
      .order('start_time', { ascending: true, nullsFirst: false })
    eventsRaw = data ?? []
  }

  // ─── Meeting cycles ───────────────────────────────────────────────────────────
  // Fetch cycles the student can book:
  // 1. Own coach's cycles (target_student_ids IS NULL = all his students, or explicitly targeted)
  // 2. Any other coach's cycle that explicitly targets this student
  let cyclesRaw: any[] = []
  if (coachAuthUserId) {
    const { data } = await adminSupabase
      .from('meeting_cycles')
      .select('*')
      .eq('status', 'active')
      .or(
        // Own coach, all-student cycles
        `and(coach_id.eq.${coachAuthUserId},target_student_ids.is.null),` +
        // Any coach with explicit targeting of this student
        `target_student_ids.cs.{${user.id}}`
      )
      .order('date_from', { ascending: true })
    cyclesRaw = data ?? []
  } else {
    // No own coach — show only cycles that explicitly target this student
    const { data } = await adminSupabase
      .from('meeting_cycles')
      .select('*')
      .eq('status', 'active')
      .filter('target_student_ids', 'cs', `{${user.id}}`)
      .order('date_from', { ascending: true })
    cyclesRaw = data ?? []
  }

  // Look up coach names for all cycles
  const coachIds = [...new Set(cyclesRaw.map((c: any) => c.coach_id))]
  const coachNameMap: Record<string, string> = {}
  if (coachIds.length > 0) {
    const { data: coachUsers } = await adminSupabase
      .from('users')
      .select('id, full_name')
      .in('id', coachIds)
    ;(coachUsers ?? []).forEach((u: any) => { coachNameMap[u.id] = u.full_name })
  }

  // Enrich cycles with coach_name; sort: own coach first, then by date
  const meetingCycles: MeetingCycle[] = cyclesRaw
    .map((c: any) => ({ ...c, coach_name: coachNameMap[c.coach_id] ?? 'Coach' }))
    .sort((a: any, b: any) => {
      const aOwn = a.coach_id === coachAuthUserId ? 0 : 1
      const bOwn = b.coach_id === coachAuthUserId ? 0 : 1
      return aOwn - bOwn || a.date_from.localeCompare(b.date_from)
    })

  // ─── Meeting slots ────────────────────────────────────────────────────────────
  const cycleIds = meetingCycles.map((c) => c.id)
  const cycleTitleMap: Record<string, string> = Object.fromEntries(
    meetingCycles.map((c) => [c.id, c.title])
  )

  const [{ data: slotsRaw }, { data: bookingsRaw }] = await Promise.all([
    cycleIds.length > 0
      ? adminSupabase
          .from('meeting_slots')
          .select('id, cycle_id, slot_date, start_time, end_time, available, meeting_bookings(student_id)')
          .in('cycle_id', cycleIds)
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

  const myBookedSlotIds = new Set((bookingsRaw ?? []).map((b: any) => b.slot_id))

  const meetingSlots: MeetingSlotStudent[] = (slotsRaw ?? []).map((s: any) => ({
    id: s.id,
    cycle_id: s.cycle_id,
    cycle_title: cycleTitleMap[s.cycle_id] ?? '',
    slot_date: s.slot_date,
    start_time: s.start_time,
    end_time: s.end_time,
    isBooked: (s.meeting_bookings?.length ?? 0) > 0,
    isMyBooking: myBookedSlotIds.has(s.id),
  }))

  return (
    <div className="p-4 md:p-6 max-w-2xl mx-auto">
      <StudentCalendarView
        events={eventsRaw}
        currentUserId={user.id}
        meetingCycles={meetingCycles}
        meetingSlots={meetingSlots}
      />
    </div>
  )
}

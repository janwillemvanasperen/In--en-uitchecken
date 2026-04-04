export type CalendarVariant = 'coach' | 'shared'
export type CalendarActionType = 'submit_schedule' | 'submit_leave_request' | 'check_in'

export interface CalendarLabel {
  id: string
  name: string
  color: string
}

export interface CalendarEvent {
  id: string
  title: string
  description: string | null
  event_date: string          // YYYY-MM-DD
  all_day: boolean
  start_time: string | null   // HH:mm
  end_time: string | null     // HH:mm
  variant: CalendarVariant
  created_by: string
  student_id: string | null
  target_student_ids: string[] | null  // null = all students; array = specific
  label_id: string | null
  action_type: CalendarActionType | null
  action_label: string | null
  created_at: string
  calendar_event_labels: CalendarLabel | null
}

export interface CalendarStudent {
  id: string
  full_name: string
}

export const ACTION_TYPE_DEFAULTS: Record<CalendarActionType, { label: string; href: string }> = {
  submit_schedule:      { label: 'Rooster insturen',   href: '/student/schedule' },
  submit_leave_request: { label: 'Verlof aanvragen',   href: '/student/leave-requests' },
  check_in:             { label: 'Inchecken',          href: '/student/check-in' },
}

// ─── Meeting cycles ────────────────────────────────────────────────────────

export interface MeetingCycle {
  id: string
  title: string
  description: string | null
  coach_id: string
  date_from: string      // YYYY-MM-DD
  date_until: string     // YYYY-MM-DD
  days_of_week: number[] // 1=Mon … 7=Sun
  day_start_time: string // HH:mm
  day_end_time: string   // HH:mm
  slot_duration: number  // minutes
  status: 'active' | 'closed'
  target_student_ids: string[] | null  // null = all students; array = specific
  created_at: string
  // Enriched on student-facing pages (not stored in DB)
  coach_name?: string
}

/** Slot as seen by a coach (includes who booked it) */
export interface MeetingSlotCoach {
  id: string
  cycle_id: string
  cycle_title: string
  slot_date: string      // YYYY-MM-DD
  start_time: string     // HH:mm
  end_time: string       // HH:mm
  available: boolean
  notes: string | null
  booked_student: { id: string; full_name: string } | null
}

/** Upcoming booked slot for student dashboard display */
export interface UpcomingMeetingSlot {
  id: string
  slot_date: string
  start_time: string
  end_time: string
  cycle_title: string
}

/** Slot as seen by a student (privacy: only knows if taken, not by whom) */
export interface MeetingSlotStudent {
  id: string
  cycle_id: string
  cycle_title: string
  slot_date: string      // YYYY-MM-DD
  start_time: string     // HH:mm
  end_time: string       // HH:mm
  isBooked: boolean      // someone (not necessarily this student) has booked
  isMyBooking: boolean   // this student has booked this slot
}

// ─── Activities ────────────────────────────────────────────────────────────────

export interface Activity {
  id: string
  title: string
  description: string | null
  activity_date: string        // YYYY-MM-DD
  start_time: string | null    // HH:mm
  end_time: string | null      // HH:mm
  location: string | null
  max_participants: number | null
  signup_deadline: string | null  // ISO datetime
  created_by: string
  status: 'active' | 'cancelled'
  created_at: string
  // Enriched
  signup_count?: number
  is_signed_up?: boolean
}

/** Signup record enriched with student name (coach view) */
export interface ActivitySignup {
  id: string
  activity_id: string
  student_id: string
  full_name: string
  signed_up_at: string
}

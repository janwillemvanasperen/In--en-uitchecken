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
  start_time: string | null   // HH:mm
  end_time: string | null     // HH:mm
  variant: CalendarVariant
  created_by: string
  student_id: string | null
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

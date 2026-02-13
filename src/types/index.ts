import type { Database } from '@/lib/supabase/database.types'

// Table row types
export type User = Database['public']['Tables']['users']['Row']
export type Schedule = Database['public']['Tables']['schedules']['Row']
export type CheckIn = Database['public']['Tables']['check_ins']['Row']
export type Location = Database['public']['Tables']['locations']['Row']
export type LeaveRequest = Database['public']['Tables']['leave_requests']['Row']
export type Settings = Database['public']['Tables']['settings']['Row']

// Composite types with relations
export type CheckInWithLocation = CheckIn & {
  locations: Location | null
}

export type ActiveCheckIn = CheckIn & {
  locations: Location
}

// Enum types
export type UserRole = 'student' | 'admin'
export type ScheduleStatus = 'pending' | 'approved' | 'rejected'
export type LeaveReason = 'sick' | 'late' | 'appointment'
export type LeaveStatus = 'pending' | 'approved' | 'rejected'

// Form input types
export type CheckInInput = {
  locationId: string
  userLat?: number
  userLng?: number
  qrCode?: string
  expectedStart: string
  expectedEnd: string
}

export type LeaveRequestInput = {
  date: string
  reason: LeaveReason
  description: string
}

// Schedule form types
export type ScheduleEntry = {
  day_of_week: number
  active: boolean
  start_time: string
  end_time: string
}

export type ScheduleSubmissionInput = {
  entries: ScheduleEntry[]
}

export type PushSubscriptionInput = {
  endpoint: string
  p256dh: string
  auth: string
}

// View models
export type DashboardStats = {
  todaySchedule: Schedule | null
  activeCheckIn: ActiveCheckIn | null
  weeklyHours: number
  nextSession: Schedule | null
}

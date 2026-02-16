export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          role: 'student' | 'admin'
          full_name: string
          coach_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          role?: 'student' | 'admin'
          full_name: string
          coach_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          role?: 'student' | 'admin'
          full_name?: string
          coach_id?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      coaches: {
        Row: {
          id: string
          name: string
          active: boolean
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          active?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          active?: boolean
          created_at?: string
        }
      }
      locations: {
        Row: {
          id: string
          name: string
          address: string | null
          latitude: number
          longitude: number
          qr_code: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          address?: string | null
          latitude: number
          longitude: number
          qr_code: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          address?: string | null
          latitude?: number
          longitude?: number
          qr_code?: string
          created_at?: string
          updated_at?: string
        }
      }
      schedules: {
        Row: {
          id: string
          user_id: string
          day_of_week: number
          start_time: string
          end_time: string
          status: 'pending' | 'approved' | 'rejected'
          valid_from: string
          valid_until: string
          submission_group: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          day_of_week: number
          start_time: string
          end_time: string
          status?: 'pending' | 'approved' | 'rejected'
          valid_from: string
          valid_until: string
          submission_group?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          day_of_week?: number
          start_time?: string
          end_time?: string
          status?: 'pending' | 'approved' | 'rejected'
          valid_from?: string
          valid_until?: string
          submission_group?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      check_ins: {
        Row: {
          id: string
          user_id: string
          location_id: string
          check_in_time: string
          check_out_time: string | null
          expected_start: string
          expected_end: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          location_id: string
          check_in_time?: string
          check_out_time?: string | null
          expected_start: string
          expected_end: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          location_id?: string
          check_in_time?: string
          check_out_time?: string | null
          expected_start?: string
          expected_end?: string
          created_at?: string
          updated_at?: string
        }
      }
      leave_requests: {
        Row: {
          id: string
          user_id: string
          date: string
          reason: 'sick' | 'late' | 'appointment'
          description: string | null
          status: 'pending' | 'approved' | 'rejected'
          hours_counted: number
          reviewed_by: string | null
          reviewed_at: string | null
          created_at: string
          updated_at: string
          admin_note: string | null
          start_time: string | null
          end_time: string | null
        }
        Insert: {
          id?: string
          user_id: string
          date: string
          reason: 'sick' | 'late' | 'appointment'
          description?: string | null
          status?: 'pending' | 'approved' | 'rejected'
          hours_counted?: number
          reviewed_by?: string | null
          reviewed_at?: string | null
          created_at?: string
          updated_at?: string
          admin_note?: string | null
          start_time?: string | null
          end_time?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          date?: string
          reason?: 'sick' | 'late' | 'appointment'
          description?: string | null
          status?: 'pending' | 'approved' | 'rejected'
          hours_counted?: number
          reviewed_by?: string | null
          reviewed_at?: string | null
          created_at?: string
          updated_at?: string
          admin_note?: string | null
          start_time?: string | null
          end_time?: string | null
        }
      }
      push_subscriptions: {
        Row: {
          id: string
          user_id: string
          endpoint: string
          p256dh: string
          auth: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          endpoint: string
          p256dh: string
          auth: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          endpoint?: string
          p256dh?: string
          auth?: string
          created_at?: string
          updated_at?: string
        }
      }
      notification_log: {
        Row: {
          id: string
          user_id: string
          notification_type: string
          reference_id: string | null
          reference_date: string | null
          sent_at: string
          delivered: boolean
        }
        Insert: {
          id?: string
          user_id: string
          notification_type: string
          reference_id?: string | null
          reference_date?: string | null
          sent_at?: string
          delivered?: boolean
        }
        Update: {
          id?: string
          user_id?: string
          notification_type?: string
          reference_id?: string | null
          reference_date?: string | null
          sent_at?: string
          delivered?: boolean
        }
      }
      settings: {
        Row: {
          id: string
          key: string
          value: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          key: string
          value: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          key?: string
          value?: string
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      is_admin: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      get_user_role: {
        Args: { user_id: string }
        Returns: 'student' | 'admin'
      }
      calculate_hours: {
        Args: { check_in: string; check_out: string }
        Returns: number
      }
    }
    Enums: {
      user_role: 'student' | 'admin'
      schedule_status: 'pending' | 'approved' | 'rejected'
      leave_reason: 'sick' | 'late' | 'appointment'
      leave_status: 'pending' | 'approved' | 'rejected'
    }
  }
}

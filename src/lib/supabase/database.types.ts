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
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          role?: 'student' | 'admin'
          full_name: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          role?: 'student' | 'admin'
          full_name?: string
          created_at?: string
          updated_at?: string
        }
      }
      locations: {
        Row: {
          id: string
          name: string
          latitude: number
          longitude: number
          qr_code: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          latitude: number
          longitude: number
          qr_code: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
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

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
          role: 'student' | 'admin' | 'coach' | 'verzuim'
          roles: string[]
          full_name: string
          coach_id: string | null
          profile_photo_url: string | null
          class_code: string | null
          cohort: string | null
          phone_number: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          role?: 'student' | 'admin' | 'coach' | 'verzuim'
          roles?: string[]
          full_name: string
          coach_id?: string | null
          profile_photo_url?: string | null
          class_code?: string | null
          cohort?: string | null
          phone_number?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          role?: 'student' | 'admin' | 'coach' | 'verzuim'
          roles?: string[]
          full_name?: string
          coach_id?: string | null
          profile_photo_url?: string | null
          class_code?: string | null
          cohort?: string | null
          phone_number?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      coaches: {
        Row: {
          id: string
          name: string
          active: boolean
          user_id: string | null
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          active?: boolean
          user_id?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          active?: boolean
          user_id?: string | null
          created_at?: string
        }
      }
      coach_schedules: {
        Row: {
          id: string
          coach_id: string
          day_of_week: number
          start_time: string
          end_time: string
        }
        Insert: {
          id?: string
          coach_id: string
          day_of_week: number
          start_time?: string
          end_time?: string
        }
        Update: {
          id?: string
          coach_id?: string
          day_of_week?: number
          start_time?: string
          end_time?: string
        }
      }
      coach_notes: {
        Row: {
          id: string
          coach_id: string
          student_id: string
          note_text: string
          visible_to_student: boolean
          visible_to_coaches: boolean
          label_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          coach_id: string
          student_id: string
          note_text: string
          visible_to_student?: boolean
          visible_to_coaches?: boolean
          label_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          coach_id?: string
          student_id?: string
          note_text?: string
          visible_to_student?: boolean
          visible_to_coaches?: boolean
          label_id?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      note_labels: {
        Row: {
          id: string
          name: string
          color: string
          active: boolean
          sort_order: number
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          color?: string
          active?: boolean
          sort_order?: number
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          color?: string
          active?: boolean
          sort_order?: number
          created_at?: string
        }
      }
      student_work_submissions: {
        Row: {
          id: string
          student_id: string
          title: string
          description: string | null
          category: 'project' | 'opdracht' | 'oefening' | 'portfolio' | null
          file_url: string
          file_type: 'pdf' | 'image' | 'video' | 'document' | null
          file_size: number | null
          submitted_at: string
          reviewed_by: string | null
          reviewed_at: string | null
          status: 'pending' | 'reviewed' | 'approved' | 'rejected'
          coach_feedback: string | null
          coach_rating: number | null
          tags: string[]
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          student_id: string
          title: string
          description?: string | null
          category?: 'project' | 'opdracht' | 'oefening' | 'portfolio' | null
          file_url: string
          file_type?: 'pdf' | 'image' | 'video' | 'document' | null
          file_size?: number | null
          submitted_at?: string
          reviewed_by?: string | null
          reviewed_at?: string | null
          status?: 'pending' | 'reviewed' | 'approved' | 'rejected'
          coach_feedback?: string | null
          coach_rating?: number | null
          tags?: string[]
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          student_id?: string
          title?: string
          description?: string | null
          category?: 'project' | 'opdracht' | 'oefening' | 'portfolio' | null
          file_url?: string
          file_type?: 'pdf' | 'image' | 'video' | 'document' | null
          file_size?: number | null
          submitted_at?: string
          reviewed_by?: string | null
          reviewed_at?: string | null
          status?: 'pending' | 'reviewed' | 'approved' | 'rejected'
          coach_feedback?: string | null
          coach_rating?: number | null
          tags?: string[]
          created_at?: string
          updated_at?: string
        }
      }
      submission_comments: {
        Row: {
          id: string
          submission_id: string
          user_id: string
          comment_text: string
          created_at: string
        }
        Insert: {
          id?: string
          submission_id: string
          user_id: string
          comment_text: string
          created_at?: string
        }
        Update: {
          id?: string
          submission_id?: string
          user_id?: string
          comment_text?: string
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
          admin_note: string | null
          push_request_id: string | null
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
          admin_note?: string | null
          push_request_id?: string | null
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
          admin_note?: string | null
          push_request_id?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      schedule_push_requests: {
        Row: {
          id: string
          valid_from: string
          valid_until: string
          message: string | null
          created_by: string
          created_at: string
        }
        Insert: {
          id?: string
          valid_from: string
          valid_until: string
          message?: string | null
          created_by: string
          created_at?: string
        }
        Update: {
          id?: string
          valid_from?: string
          valid_until?: string
          message?: string | null
          created_by?: string
          created_at?: string
        }
      }
      schedule_push_recipients: {
        Row: {
          id: string
          push_request_id: string
          student_id: string
          responded: boolean
          responded_at: string | null
        }
        Insert: {
          id?: string
          push_request_id: string
          student_id: string
          responded?: boolean
          responded_at?: string | null
        }
        Update: {
          id?: string
          push_request_id?: string
          student_id?: string
          responded?: boolean
          responded_at?: string | null
        }
      }
      development_goal_names: {
        Row: {
          goal_number: number
          goal_name: string
          description: string | null
          active: boolean
        }
        Insert: {
          goal_number: number
          goal_name: string
          description?: string | null
          active?: boolean
        }
        Update: {
          goal_number?: number
          goal_name?: string
          description?: string | null
          active?: boolean
        }
      }
      student_development_goals: {
        Row: {
          student_id: string
          goal_1_phase: number
          goal_2_phase: number
          goal_3_phase: number
          goal_4_phase: number
          goal_5_phase: number
          goal_6_phase: number
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          student_id: string
          goal_1_phase?: number
          goal_2_phase?: number
          goal_3_phase?: number
          goal_4_phase?: number
          goal_5_phase?: number
          goal_6_phase?: number
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          student_id?: string
          goal_1_phase?: number
          goal_2_phase?: number
          goal_3_phase?: number
          goal_4_phase?: number
          goal_5_phase?: number
          goal_6_phase?: number
          updated_at?: string
          updated_by?: string | null
        }
      }
      day_capacities: {
        Row: { day_of_week: number; max_spots: number; updated_at: string }
        Insert: { day_of_week: number; max_spots: number; updated_at?: string }
        Update: { day_of_week?: number; max_spots?: number; updated_at?: string }
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
      notifications: {
        Row: {
          id: string
          user_id: string
          type: string
          title: string
          message: string
          read: boolean
          related_id: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          type: string
          title: string
          message: string
          read?: boolean
          related_id?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          type?: string
          title?: string
          message?: string
          read?: boolean
          related_id?: string | null
          created_at?: string
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
      user_role: 'student' | 'admin' | 'coach' | 'verzuim'
      schedule_status: 'pending' | 'approved' | 'rejected'
      leave_reason: 'sick' | 'late' | 'appointment'
      leave_status: 'pending' | 'approved' | 'rejected'
    }
  }
}

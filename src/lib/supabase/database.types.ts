export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      activities: {
        Row: {
          activity_date: string
          created_at: string
          created_by: string
          description: string | null
          end_time: string | null
          id: string
          location: string | null
          max_participants: number | null
          signup_deadline: string | null
          start_time: string | null
          status: string
          title: string
        }
        Insert: {
          activity_date: string
          created_at?: string
          created_by: string
          description?: string | null
          end_time?: string | null
          id?: string
          location?: string | null
          max_participants?: number | null
          signup_deadline?: string | null
          start_time?: string | null
          status?: string
          title: string
        }
        Update: {
          activity_date?: string
          created_at?: string
          created_by?: string
          description?: string | null
          end_time?: string | null
          id?: string
          location?: string | null
          max_participants?: number | null
          signup_deadline?: string | null
          start_time?: string | null
          status?: string
          title?: string
        }
        Relationships: []
      }
      activity_signups: {
        Row: {
          activity_id: string
          id: string
          signed_up_at: string
          student_id: string
        }
        Insert: {
          activity_id: string
          id?: string
          signed_up_at?: string
          student_id: string
        }
        Update: {
          activity_id?: string
          id?: string
          signed_up_at?: string
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "activity_signups_activity_id_fkey"
            columns: ["activity_id"]
            isOneToOne: false
            referencedRelation: "activities"
            referencedColumns: ["id"]
          },
        ]
      }
      calendar_event_labels: {
        Row: {
          active: boolean
          color: string
          created_at: string
          id: string
          name: string
          sort_order: number
        }
        Insert: {
          active?: boolean
          color?: string
          created_at?: string
          id?: string
          name: string
          sort_order?: number
        }
        Update: {
          active?: boolean
          color?: string
          created_at?: string
          id?: string
          name?: string
          sort_order?: number
        }
        Relationships: []
      }
      calendar_events: {
        Row: {
          action_label: string | null
          action_type: string | null
          all_day: boolean
          created_at: string
          created_by: string
          description: string | null
          end_time: string | null
          event_date: string
          id: string
          label_id: string | null
          start_time: string | null
          student_id: string | null
          target_student_ids: string[] | null
          title: string
          updated_at: string
          variant: string
        }
        Insert: {
          action_label?: string | null
          action_type?: string | null
          all_day?: boolean
          created_at?: string
          created_by: string
          description?: string | null
          end_time?: string | null
          event_date: string
          id?: string
          label_id?: string | null
          start_time?: string | null
          student_id?: string | null
          target_student_ids?: string[] | null
          title: string
          updated_at?: string
          variant: string
        }
        Update: {
          action_label?: string | null
          action_type?: string | null
          all_day?: boolean
          created_at?: string
          created_by?: string
          description?: string | null
          end_time?: string | null
          event_date?: string
          id?: string
          label_id?: string | null
          start_time?: string | null
          student_id?: string | null
          target_student_ids?: string[] | null
          title?: string
          updated_at?: string
          variant?: string
        }
        Relationships: [
          {
            foreignKeyName: "calendar_events_label_id_fkey"
            columns: ["label_id"]
            isOneToOne: false
            referencedRelation: "calendar_event_labels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "calendar_events_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      check_ins: {
        Row: {
          check_in_time: string
          check_out_time: string | null
          created_at: string
          expected_end: string
          expected_start: string
          id: string
          location_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          check_in_time?: string
          check_out_time?: string | null
          created_at?: string
          expected_end: string
          expected_start: string
          id?: string
          location_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          check_in_time?: string
          check_out_time?: string | null
          created_at?: string
          expected_end?: string
          expected_start?: string
          id?: string
          location_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "check_ins_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "check_ins_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      coach_notes: {
        Row: {
          coach_id: string
          created_at: string
          id: string
          label_id: string | null
          note_text: string
          student_id: string
          updated_at: string
          visible_to_coaches: boolean
          visible_to_student: boolean
        }
        Insert: {
          coach_id: string
          created_at?: string
          id?: string
          label_id?: string | null
          note_text: string
          student_id: string
          updated_at?: string
          visible_to_coaches?: boolean
          visible_to_student?: boolean
        }
        Update: {
          coach_id?: string
          created_at?: string
          id?: string
          label_id?: string | null
          note_text?: string
          student_id?: string
          updated_at?: string
          visible_to_coaches?: boolean
          visible_to_student?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "coach_notes_coach_id_fkey"
            columns: ["coach_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "coach_notes_label_id_fkey"
            columns: ["label_id"]
            isOneToOne: false
            referencedRelation: "note_labels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "coach_notes_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      coach_schedules: {
        Row: {
          coach_id: string
          day_of_week: number
          end_time: string
          id: string
          start_time: string
        }
        Insert: {
          coach_id: string
          day_of_week: number
          end_time?: string
          id?: string
          start_time?: string
        }
        Update: {
          coach_id?: string
          day_of_week?: number
          end_time?: string
          id?: string
          start_time?: string
        }
        Relationships: [
          {
            foreignKeyName: "coach_schedules_coach_id_fkey"
            columns: ["coach_id"]
            isOneToOne: false
            referencedRelation: "coaches"
            referencedColumns: ["id"]
          },
        ]
      }
      coaches: {
        Row: {
          active: boolean
          created_at: string
          id: string
          name: string
          user_id: string | null
        }
        Insert: {
          active?: boolean
          created_at?: string
          id?: string
          name: string
          user_id?: string | null
        }
        Update: {
          active?: boolean
          created_at?: string
          id?: string
          name?: string
          user_id?: string | null
        }
        Relationships: []
      }
      day_capacities: {
        Row: {
          day_of_week: number
          max_spots: number
          updated_at: string
        }
        Insert: {
          day_of_week: number
          max_spots?: number
          updated_at?: string
        }
        Update: {
          day_of_week?: number
          max_spots?: number
          updated_at?: string
        }
        Relationships: []
      }
      development_goal_names: {
        Row: {
          active: boolean
          description: string | null
          goal_name: string
          goal_number: number
        }
        Insert: {
          active?: boolean
          description?: string | null
          goal_name: string
          goal_number: number
        }
        Update: {
          active?: boolean
          description?: string | null
          goal_name?: string
          goal_number?: number
        }
        Relationships: []
      }
      leave_requests: {
        Row: {
          admin_note: string | null
          created_at: string
          date: string
          description: string | null
          end_time: string | null
          hours_counted: number | null
          id: string
          reason: Database["public"]["Enums"]["leave_reason"]
          reviewed_at: string | null
          reviewed_by: string | null
          start_time: string | null
          status: Database["public"]["Enums"]["leave_status"]
          updated_at: string
          user_id: string
        }
        Insert: {
          admin_note?: string | null
          created_at?: string
          date: string
          description?: string | null
          end_time?: string | null
          hours_counted?: number | null
          id?: string
          reason?: Database["public"]["Enums"]["leave_reason"]
          reviewed_at?: string | null
          reviewed_by?: string | null
          start_time?: string | null
          status?: Database["public"]["Enums"]["leave_status"]
          updated_at?: string
          user_id: string
        }
        Update: {
          admin_note?: string | null
          created_at?: string
          date?: string
          description?: string | null
          end_time?: string | null
          hours_counted?: number | null
          id?: string
          reason?: Database["public"]["Enums"]["leave_reason"]
          reviewed_at?: string | null
          reviewed_by?: string | null
          start_time?: string | null
          status?: Database["public"]["Enums"]["leave_status"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "leave_requests_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leave_requests_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      locations: {
        Row: {
          address: string | null
          created_at: string
          id: string
          latitude: number
          longitude: number
          name: string
          qr_code: string
          updated_at: string
        }
        Insert: {
          address?: string | null
          created_at?: string
          id?: string
          latitude: number
          longitude: number
          name: string
          qr_code: string
          updated_at?: string
        }
        Update: {
          address?: string | null
          created_at?: string
          id?: string
          latitude?: number
          longitude?: number
          name?: string
          qr_code?: string
          updated_at?: string
        }
        Relationships: []
      }
      meeting_bookings: {
        Row: {
          booked_at: string
          id: string
          slot_id: string
          student_id: string
        }
        Insert: {
          booked_at?: string
          id?: string
          slot_id: string
          student_id: string
        }
        Update: {
          booked_at?: string
          id?: string
          slot_id?: string
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "meeting_bookings_slot_id_fkey"
            columns: ["slot_id"]
            isOneToOne: false
            referencedRelation: "meeting_slots"
            referencedColumns: ["id"]
          },
        ]
      }
      meeting_cycles: {
        Row: {
          coach_id: string
          created_at: string
          date_from: string
          date_until: string
          day_end_time: string
          day_start_time: string
          days_of_week: number[]
          description: string | null
          id: string
          slot_duration: number
          status: string
          target_student_ids: string[] | null
          title: string
          updated_at: string
        }
        Insert: {
          coach_id: string
          created_at?: string
          date_from: string
          date_until: string
          day_end_time?: string
          day_start_time?: string
          days_of_week?: number[]
          description?: string | null
          id?: string
          slot_duration?: number
          status?: string
          target_student_ids?: string[] | null
          title: string
          updated_at?: string
        }
        Update: {
          coach_id?: string
          created_at?: string
          date_from?: string
          date_until?: string
          day_end_time?: string
          day_start_time?: string
          days_of_week?: number[]
          description?: string | null
          id?: string
          slot_duration?: number
          status?: string
          target_student_ids?: string[] | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      meeting_slots: {
        Row: {
          available: boolean
          created_at: string
          cycle_id: string
          end_time: string
          id: string
          notes: string | null
          slot_date: string
          start_time: string
        }
        Insert: {
          available?: boolean
          created_at?: string
          cycle_id: string
          end_time: string
          id?: string
          notes?: string | null
          slot_date: string
          start_time: string
        }
        Update: {
          available?: boolean
          created_at?: string
          cycle_id?: string
          end_time?: string
          id?: string
          notes?: string | null
          slot_date?: string
          start_time?: string
        }
        Relationships: [
          {
            foreignKeyName: "meeting_slots_cycle_id_fkey"
            columns: ["cycle_id"]
            isOneToOne: false
            referencedRelation: "meeting_cycles"
            referencedColumns: ["id"]
          },
        ]
      }
      note_labels: {
        Row: {
          active: boolean
          color: string
          created_at: string
          id: string
          name: string
          sort_order: number
        }
        Insert: {
          active?: boolean
          color?: string
          created_at?: string
          id?: string
          name: string
          sort_order?: number
        }
        Update: {
          active?: boolean
          color?: string
          created_at?: string
          id?: string
          name?: string
          sort_order?: number
        }
        Relationships: []
      }
      notification_log: {
        Row: {
          delivered: boolean | null
          id: string
          notification_type: string
          reference_date: string | null
          reference_id: string | null
          sent_at: string
          user_id: string
        }
        Insert: {
          delivered?: boolean | null
          id?: string
          notification_type: string
          reference_date?: string | null
          reference_id?: string | null
          sent_at?: string
          user_id: string
        }
        Update: {
          delivered?: boolean | null
          id?: string
          notification_type?: string
          reference_date?: string | null
          reference_id?: string | null
          sent_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notification_log_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          message: string
          read: boolean
          related_id: string | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          message: string
          read?: boolean
          related_id?: string | null
          title: string
          type: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          message?: string
          read?: boolean
          related_id?: string | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      portfolio_assessments: {
        Row: {
          coach_id: string
          created_at: string
          goal_number: number
          id: string
          notes: string | null
          phase_assessed: number
          result: string
          student_id: string
        }
        Insert: {
          coach_id: string
          created_at?: string
          goal_number: number
          id?: string
          notes?: string | null
          phase_assessed: number
          result: string
          student_id: string
        }
        Update: {
          coach_id?: string
          created_at?: string
          goal_number?: number
          id?: string
          notes?: string | null
          phase_assessed?: number
          result?: string
          student_id?: string
        }
        Relationships: []
      }
      portfolio_feedback: {
        Row: {
          coach_id: string
          created_at: string
          feedback_text: string
          id: string
          item_id: string
        }
        Insert: {
          coach_id: string
          created_at?: string
          feedback_text: string
          id?: string
          item_id: string
        }
        Update: {
          coach_id?: string
          created_at?: string
          feedback_text?: string
          id?: string
          item_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "portfolio_feedback_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "portfolio_items"
            referencedColumns: ["id"]
          },
        ]
      }
      portfolio_items: {
        Row: {
          created_at: string
          description: string | null
          file_url: string | null
          goal_number: number
          id: string
          link_url: string | null
          student_id: string
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          file_url?: string | null
          goal_number: number
          id?: string
          link_url?: string | null
          student_id: string
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          file_url?: string | null
          goal_number?: number
          id?: string
          link_url?: string | null
          student_id?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      push_subscriptions: {
        Row: {
          auth: string
          created_at: string
          endpoint: string
          id: string
          p256dh: string
          updated_at: string
          user_id: string
        }
        Insert: {
          auth: string
          created_at?: string
          endpoint: string
          id?: string
          p256dh: string
          updated_at?: string
          user_id: string
        }
        Update: {
          auth?: string
          created_at?: string
          endpoint?: string
          id?: string
          p256dh?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "push_subscriptions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      schedule_push_recipients: {
        Row: {
          id: string
          push_request_id: string
          responded: boolean
          responded_at: string | null
          student_id: string
        }
        Insert: {
          id?: string
          push_request_id: string
          responded?: boolean
          responded_at?: string | null
          student_id: string
        }
        Update: {
          id?: string
          push_request_id?: string
          responded?: boolean
          responded_at?: string | null
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "schedule_push_recipients_push_request_id_fkey"
            columns: ["push_request_id"]
            isOneToOne: false
            referencedRelation: "schedule_push_requests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "schedule_push_recipients_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      schedule_push_requests: {
        Row: {
          created_at: string
          created_by: string
          id: string
          message: string | null
          valid_from: string
          valid_until: string
        }
        Insert: {
          created_at?: string
          created_by: string
          id?: string
          message?: string | null
          valid_from: string
          valid_until: string
        }
        Update: {
          created_at?: string
          created_by?: string
          id?: string
          message?: string | null
          valid_from?: string
          valid_until?: string
        }
        Relationships: [
          {
            foreignKeyName: "schedule_push_requests_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      schedules: {
        Row: {
          admin_note: string | null
          created_at: string
          day_of_week: number
          end_time: string
          id: string
          push_request_id: string | null
          start_time: string
          status: Database["public"]["Enums"]["schedule_status"]
          submission_group: string | null
          updated_at: string
          user_id: string
          valid_from: string
          valid_until: string
        }
        Insert: {
          admin_note?: string | null
          created_at?: string
          day_of_week: number
          end_time: string
          id?: string
          push_request_id?: string | null
          start_time: string
          status?: Database["public"]["Enums"]["schedule_status"]
          submission_group?: string | null
          updated_at?: string
          user_id: string
          valid_from: string
          valid_until: string
        }
        Update: {
          admin_note?: string | null
          created_at?: string
          day_of_week?: number
          end_time?: string
          id?: string
          push_request_id?: string | null
          start_time?: string
          status?: Database["public"]["Enums"]["schedule_status"]
          submission_group?: string | null
          updated_at?: string
          user_id?: string
          valid_from?: string
          valid_until?: string
        }
        Relationships: [
          {
            foreignKeyName: "schedules_push_request_id_fkey"
            columns: ["push_request_id"]
            isOneToOne: false
            referencedRelation: "schedule_push_requests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "schedules_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      settings: {
        Row: {
          created_at: string
          id: string
          key: string
          updated_at: string
          value: string
        }
        Insert: {
          created_at?: string
          id?: string
          key: string
          updated_at?: string
          value: string
        }
        Update: {
          created_at?: string
          id?: string
          key?: string
          updated_at?: string
          value?: string
        }
        Relationships: []
      }
      student_development_goals: {
        Row: {
          goal_1_phase: number
          goal_2_phase: number
          goal_3_phase: number
          goal_4_phase: number
          goal_5_phase: number
          goal_6_phase: number
          student_id: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          goal_1_phase?: number
          goal_2_phase?: number
          goal_3_phase?: number
          goal_4_phase?: number
          goal_5_phase?: number
          goal_6_phase?: number
          student_id: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          goal_1_phase?: number
          goal_2_phase?: number
          goal_3_phase?: number
          goal_4_phase?: number
          goal_5_phase?: number
          goal_6_phase?: number
          student_id?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "student_development_goals_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_development_goals_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      student_work_submissions: {
        Row: {
          category: string | null
          coach_feedback: string | null
          coach_rating: number | null
          created_at: string
          description: string | null
          file_size: number | null
          file_type: string | null
          file_url: string
          id: string
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          student_id: string
          submitted_at: string
          tags: string[] | null
          title: string
          updated_at: string
        }
        Insert: {
          category?: string | null
          coach_feedback?: string | null
          coach_rating?: number | null
          created_at?: string
          description?: string | null
          file_size?: number | null
          file_type?: string | null
          file_url: string
          id?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          student_id: string
          submitted_at?: string
          tags?: string[] | null
          title: string
          updated_at?: string
        }
        Update: {
          category?: string | null
          coach_feedback?: string | null
          coach_rating?: number | null
          created_at?: string
          description?: string | null
          file_size?: number | null
          file_type?: string | null
          file_url?: string
          id?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          student_id?: string
          submitted_at?: string
          tags?: string[] | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "student_work_submissions_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_work_submissions_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      submission_comments: {
        Row: {
          comment_text: string
          created_at: string
          id: string
          submission_id: string
          user_id: string
        }
        Insert: {
          comment_text: string
          created_at?: string
          id?: string
          submission_id: string
          user_id: string
        }
        Update: {
          comment_text?: string
          created_at?: string
          id?: string
          submission_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "submission_comments_submission_id_fkey"
            columns: ["submission_id"]
            isOneToOne: false
            referencedRelation: "student_work_submissions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "submission_comments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          class_code: string | null
          coach_id: string | null
          cohort: string | null
          created_at: string
          email: string
          full_name: string
          ical_token: string
          id: string
          phone_number: string | null
          profile_photo_url: string | null
          role: Database["public"]["Enums"]["user_role"]
          roles: string[]
          updated_at: string
        }
        Insert: {
          class_code?: string | null
          coach_id?: string | null
          cohort?: string | null
          created_at?: string
          email: string
          full_name: string
          ical_token?: string
          id: string
          phone_number?: string | null
          profile_photo_url?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          roles?: string[]
          updated_at?: string
        }
        Update: {
          class_code?: string | null
          coach_id?: string | null
          cohort?: string | null
          created_at?: string
          email?: string
          full_name?: string
          ical_token?: string
          id?: string
          phone_number?: string | null
          profile_photo_url?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          roles?: string[]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "users_coach_id_fkey"
            columns: ["coach_id"]
            isOneToOne: false
            referencedRelation: "coaches"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      calculate_hours: {
        Args: { check_in: string; check_out: string }
        Returns: number
      }
      get_user_schedule: {
        Args: { p_date: string; p_user_id: string }
        Returns: {
          end_time: string
          id: string
          start_time: string
        }[]
      }
      get_weekly_hours: {
        Args: { student_id: string; week_start: string }
        Returns: number
      }
      is_admin: { Args: never; Returns: boolean }
      is_schedule_valid: {
        Args: { check_date: string; schedule_id: string }
        Returns: boolean
      }
    }
    Enums: {
      leave_reason: "sick" | "late" | "appointment"
      leave_status: "pending" | "approved" | "rejected"
      schedule_status: "pending" | "approved" | "rejected"
      user_role: "student" | "admin" | "coach" | "verzuim"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      leave_reason: ["sick", "late", "appointment"],
      leave_status: ["pending", "approved", "rejected"],
      schedule_status: ["pending", "approved", "rejected"],
      user_role: ["student", "admin", "coach", "verzuim"],
    },
  },
} as const

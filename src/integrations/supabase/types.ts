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
      applications: {
        Row: {
          applicant_name: string | null
          application_id: string | null
          application_status:
            | Database["public"]["Enums"]["application_status"]
            | null
          approver: string[] | null
          created_at: string | null
          date_of_white_list_approval: string | null
          email: string | null
          financial_assistance: string[] | null
          first_name: string | null
          id: string
          invoice_link: string | null
          last_modified: string | null
          notes: string | null
          overall: string[] | null
          phone_number: string | null
          reminders_sent: number | null
          role: Database["public"]["Enums"]["application_role"] | null
          room_preference: string[] | null
          scholar_status: Database["public"]["Enums"]["scholar_status"] | null
          staying: string[] | null
          submission_date: string | null
          telegram_followup:
            | Database["public"]["Enums"]["telegram_followup_status"]
            | null
          tg_socials: string | null
          visa_needed: string | null
          white_list: Database["public"]["Enums"]["white_list_status"] | null
        }
        Insert: {
          applicant_name?: string | null
          application_id?: string | null
          application_status?:
            | Database["public"]["Enums"]["application_status"]
            | null
          approver?: string[] | null
          created_at?: string | null
          date_of_white_list_approval?: string | null
          email?: string | null
          financial_assistance?: string[] | null
          first_name?: string | null
          id?: string
          invoice_link?: string | null
          last_modified?: string | null
          notes?: string | null
          overall?: string[] | null
          phone_number?: string | null
          reminders_sent?: number | null
          role?: Database["public"]["Enums"]["application_role"] | null
          room_preference?: string[] | null
          scholar_status?: Database["public"]["Enums"]["scholar_status"] | null
          staying?: string[] | null
          submission_date?: string | null
          telegram_followup?:
            | Database["public"]["Enums"]["telegram_followup_status"]
            | null
          tg_socials?: string | null
          visa_needed?: string | null
          white_list?: Database["public"]["Enums"]["white_list_status"] | null
        }
        Update: {
          applicant_name?: string | null
          application_id?: string | null
          application_status?:
            | Database["public"]["Enums"]["application_status"]
            | null
          approver?: string[] | null
          created_at?: string | null
          date_of_white_list_approval?: string | null
          email?: string | null
          financial_assistance?: string[] | null
          first_name?: string | null
          id?: string
          invoice_link?: string | null
          last_modified?: string | null
          notes?: string | null
          overall?: string[] | null
          phone_number?: string | null
          reminders_sent?: number | null
          role?: Database["public"]["Enums"]["application_role"] | null
          room_preference?: string[] | null
          scholar_status?: Database["public"]["Enums"]["scholar_status"] | null
          staying?: string[] | null
          submission_date?: string | null
          telegram_followup?:
            | Database["public"]["Enums"]["telegram_followup_status"]
            | null
          tg_socials?: string | null
          visa_needed?: string | null
          white_list?: Database["public"]["Enums"]["white_list_status"] | null
        }
        Relationships: []
      }
      bedrooms: {
        Row: {
          created_at: string
          description: string | null
          id: string
          location_id: string
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          location_id: string
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          location_id?: string
          name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "bedrooms_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
        ]
      }
      beds: {
        Row: {
          bed_type: string
          bedroom_id: string
          created_at: string
          description: string | null
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          bed_type: string
          bedroom_id: string
          created_at?: string
          description?: string | null
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          bed_type?: string
          bedroom_id?: string
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "beds_bedroom_id_fkey"
            columns: ["bedroom_id"]
            isOneToOne: false
            referencedRelation: "bedrooms"
            referencedColumns: ["id"]
          },
        ]
      }
      discounts: {
        Row: {
          active: boolean
          created_at: string
          discountName: string | null
          end_date: string | null
          id: string
          is_role_based: boolean
          percentage: number
          start_date: string | null
        }
        Insert: {
          active?: boolean
          created_at?: string
          discountName?: string | null
          end_date?: string | null
          id?: string
          is_role_based?: boolean
          percentage: number
          start_date?: string | null
        }
        Update: {
          active?: boolean
          created_at?: string
          discountName?: string | null
          end_date?: string | null
          id?: string
          is_role_based?: boolean
          percentage?: number
          start_date?: string | null
        }
        Relationships: []
      }
      display_codes: {
        Row: {
          code: string
          created_at: string
          expires_at: string | null
          id: string
          location_filter: string | null
          name: string
          tag_filter: string | null
          tag_filters: string[] | null
        }
        Insert: {
          code: string
          created_at?: string
          expires_at?: string | null
          id?: string
          location_filter?: string | null
          name: string
          tag_filter?: string | null
          tag_filters?: string[] | null
        }
        Update: {
          code?: string
          created_at?: string
          expires_at?: string | null
          id?: string
          location_filter?: string | null
          name?: string
          tag_filter?: string | null
          tag_filters?: string[] | null
        }
        Relationships: [
          {
            foreignKeyName: "display_codes_location_filter_fkey"
            columns: ["location_filter"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "display_codes_tag_filter_fkey"
            columns: ["tag_filter"]
            isOneToOne: false
            referencedRelation: "event_tags"
            referencedColumns: ["id"]
          },
        ]
      }
      event_co_hosts: {
        Row: {
          created_at: string
          created_by: string
          event_id: string
          id: string
          profile_id: string
        }
        Insert: {
          created_at?: string
          created_by: string
          event_id: string
          id?: string
          profile_id: string
        }
        Update: {
          created_at?: string
          created_by?: string
          event_id?: string
          id?: string
          profile_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_co_hosts_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_co_hosts_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_co_hosts_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      event_comments: {
        Row: {
          content: string
          created_at: string
          event_id: string
          id: string
          profile_id: string
          updated_at: string
        }
        Insert: {
          content: string
          created_at?: string
          event_id: string
          id?: string
          profile_id: string
          updated_at?: string
        }
        Update: {
          content?: string
          created_at?: string
          event_id?: string
          id?: string
          profile_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_comments_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_comments_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      event_rsvps: {
        Row: {
          created_at: string
          event_id: string
          id: string
          profile_id: string
        }
        Insert: {
          created_at?: string
          event_id: string
          id?: string
          profile_id: string
        }
        Update: {
          created_at?: string
          event_id?: string
          id?: string
          profile_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_rsvps_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_rsvps_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      event_tag_relations: {
        Row: {
          created_at: string
          event_id: string
          id: string
          tag_id: string
        }
        Insert: {
          created_at?: string
          event_id: string
          id?: string
          tag_id: string
        }
        Update: {
          created_at?: string
          event_id?: string
          id?: string
          tag_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_tag_relations_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_tag_relations_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "event_tags"
            referencedColumns: ["id"]
          },
        ]
      }
      event_tags: {
        Row: {
          color: string | null
          created_at: string
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          color?: string | null
          created_at?: string
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          color?: string | null
          created_at?: string
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      events: {
        Row: {
          av_needs: string | null
          color: string | null
          created_at: string
          created_by: string
          description: string | null
          end_date: string
          id: string
          instance_date: string | null
          is_all_day: boolean | null
          is_exception: boolean | null
          is_recurring_instance: boolean | null
          link: string | null
          location_id: string | null
          location_text: string | null
          meerkat_enabled: boolean | null
          meerkat_status: string | null
          meerkat_uid: string | null
          meerkat_url: string | null
          original_start_date: string | null
          parent_event_id: string | null
          recurring_pattern_id: string | null
          speakers: string | null
          start_date: string
          timezone: string
          title: string
          updated_at: string
        }
        Insert: {
          av_needs?: string | null
          color?: string | null
          created_at?: string
          created_by: string
          description?: string | null
          end_date: string
          id?: string
          instance_date?: string | null
          is_all_day?: boolean | null
          is_exception?: boolean | null
          is_recurring_instance?: boolean | null
          link?: string | null
          location_id?: string | null
          location_text?: string | null
          meerkat_enabled?: boolean | null
          meerkat_status?: string | null
          meerkat_uid?: string | null
          meerkat_url?: string | null
          original_start_date?: string | null
          parent_event_id?: string | null
          recurring_pattern_id?: string | null
          speakers?: string | null
          start_date: string
          timezone?: string
          title: string
          updated_at?: string
        }
        Update: {
          av_needs?: string | null
          color?: string | null
          created_at?: string
          created_by?: string
          description?: string | null
          end_date?: string
          id?: string
          instance_date?: string | null
          is_all_day?: boolean | null
          is_exception?: boolean | null
          is_recurring_instance?: boolean | null
          link?: string | null
          location_id?: string | null
          location_text?: string | null
          meerkat_enabled?: boolean | null
          meerkat_status?: string | null
          meerkat_uid?: string | null
          meerkat_url?: string | null
          original_start_date?: string | null
          parent_event_id?: string | null
          recurring_pattern_id?: string | null
          speakers?: string | null
          start_date?: string
          timezone?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "events_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "events_created_by_fkey1"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "events_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "events_parent_event_id_fkey"
            columns: ["parent_event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "events_recurring_pattern_id_fkey"
            columns: ["recurring_pattern_id"]
            isOneToOne: false
            referencedRelation: "recurring_event_patterns"
            referencedColumns: ["id"]
          },
        ]
      }
      invoices: {
        Row: {
          auth_user_id: string | null
          booking_details: Json | null
          checkin: string
          checkout: string
          created_at: string
          due_date: string | null
          email: string
          first_name: string
          id: string
          imported: boolean | null
          invoice_uid: string | null
          last_name: string
          last_reminder_sent: string | null
          paid_at: string | null
          payment_link: string | null
          payment_type: string | null
          price: number
          privy_id: string | null
          profile_id: string | null
          reminder_count: number | null
          request_invoice_id: string | null
          room_type: string
          status: string
        }
        Insert: {
          auth_user_id?: string | null
          booking_details?: Json | null
          checkin: string
          checkout: string
          created_at?: string
          due_date?: string | null
          email: string
          first_name: string
          id?: string
          imported?: boolean | null
          invoice_uid?: string | null
          last_name: string
          last_reminder_sent?: string | null
          paid_at?: string | null
          payment_link?: string | null
          payment_type?: string | null
          price: number
          privy_id?: string | null
          profile_id?: string | null
          reminder_count?: number | null
          request_invoice_id?: string | null
          room_type: string
          status?: string
        }
        Update: {
          auth_user_id?: string | null
          booking_details?: Json | null
          checkin?: string
          checkout?: string
          created_at?: string
          due_date?: string | null
          email?: string
          first_name?: string
          id?: string
          imported?: boolean | null
          invoice_uid?: string | null
          last_name?: string
          last_reminder_sent?: string | null
          paid_at?: string | null
          payment_link?: string | null
          payment_type?: string | null
          price?: number
          privy_id?: string | null
          profile_id?: string | null
          reminder_count?: number | null
          request_invoice_id?: string | null
          room_type?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "invoices_auth_user_id_fkey"
            columns: ["auth_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["auth_user_id"]
          },
          {
            foreignKeyName: "invoices_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      issue_attachments: {
        Row: {
          created_at: string
          file_path: string
          file_type: string
          id: string
          issue_id: string
        }
        Insert: {
          created_at?: string
          file_path: string
          file_type: string
          id?: string
          issue_id: string
        }
        Update: {
          created_at?: string
          file_path?: string
          file_type?: string
          id?: string
          issue_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "issue_attachments_issue_id_fkey"
            columns: ["issue_id"]
            isOneToOne: false
            referencedRelation: "issue_reports"
            referencedColumns: ["id"]
          },
        ]
      }
      issue_comments: {
        Row: {
          comment: string
          created_at: string
          id: string
          is_anonymous: boolean
          issue_id: string
          profile_id: string | null
        }
        Insert: {
          comment: string
          created_at?: string
          id?: string
          is_anonymous?: boolean
          issue_id: string
          profile_id?: string | null
        }
        Update: {
          comment?: string
          created_at?: string
          id?: string
          is_anonymous?: boolean
          issue_id?: string
          profile_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "issue_comments_issue_id_fkey"
            columns: ["issue_id"]
            isOneToOne: false
            referencedRelation: "issue_reports"
            referencedColumns: ["id"]
          },
        ]
      }
      issue_reports: {
        Row: {
          assignee_id: string | null
          category: Database["public"]["Enums"]["issue_category"]
          contact_info: Json | null
          created_at: string
          details: string | null
          id: string
          is_anonymous: boolean
          location: Database["public"]["Enums"]["issue_location"] | null
          location_detail: string | null
          reporter_id: string | null
          severity: Database["public"]["Enums"]["issue_severity"] | null
          status: Database["public"]["Enums"]["issue_status"]
          tags: string[] | null
          title: string
          tracking_code: string
          updated_at: string
        }
        Insert: {
          assignee_id?: string | null
          category: Database["public"]["Enums"]["issue_category"]
          contact_info?: Json | null
          created_at?: string
          details?: string | null
          id?: string
          is_anonymous?: boolean
          location?: Database["public"]["Enums"]["issue_location"] | null
          location_detail?: string | null
          reporter_id?: string | null
          severity?: Database["public"]["Enums"]["issue_severity"] | null
          status?: Database["public"]["Enums"]["issue_status"]
          tags?: string[] | null
          title: string
          tracking_code: string
          updated_at?: string
        }
        Update: {
          assignee_id?: string | null
          category?: Database["public"]["Enums"]["issue_category"]
          contact_info?: Json | null
          created_at?: string
          details?: string | null
          id?: string
          is_anonymous?: boolean
          location?: Database["public"]["Enums"]["issue_location"] | null
          location_detail?: string | null
          reporter_id?: string | null
          severity?: Database["public"]["Enums"]["issue_severity"] | null
          status?: Database["public"]["Enums"]["issue_status"]
          tags?: string[] | null
          title?: string
          tracking_code?: string
          updated_at?: string
        }
        Relationships: []
      }
      location_availability: {
        Row: {
          created_at: string
          end_time: string
          id: string
          is_available: boolean
          location_id: string
          start_time: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          end_time: string
          id?: string
          is_available?: boolean
          location_id: string
          start_time: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          end_time?: string
          id?: string
          is_available?: boolean
          location_id?: string
          start_time?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "location_availability_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
        ]
      }
      locations: {
        Row: {
          anyone_can_book: boolean
          building: string | null
          created_at: string
          description: string | null
          floor: string | null
          id: string
          max_occupancy: number | null
          name: string
          type: string
          updated_at: string
        }
        Insert: {
          anyone_can_book?: boolean
          building?: string | null
          created_at?: string
          description?: string | null
          floor?: string | null
          id?: string
          max_occupancy?: number | null
          name: string
          type?: string
          updated_at?: string
        }
        Update: {
          anyone_can_book?: boolean
          building?: string | null
          created_at?: string
          description?: string | null
          floor?: string | null
          id?: string
          max_occupancy?: number | null
          name?: string
          type?: string
          updated_at?: string
        }
        Relationships: []
      }
      prices: {
        Row: {
          created_at: string
          date: string | null
          duration: number | null
          id: string
          price: number
          room_code: string | null
          room_type: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          date?: string | null
          duration?: number | null
          id?: string
          price: number
          room_code?: string | null
          room_type: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          date?: string | null
          duration?: number | null
          id?: string
          price?: number
          room_code?: string | null
          room_type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "prices_room_code_fkey"
            columns: ["room_code"]
            isOneToOne: false
            referencedRelation: "room_types"
            referencedColumns: ["code"]
          },
        ]
      }
      profiles: {
        Row: {
          auth_token: string | null
          auth_user_id: string | null
          avatar_url: string | null
          created_at: string
          description: string | null
          email: string | null
          full_name: string | null
          housing_preferences: Json | null
          id: string
          is_guild_invited: boolean | null
          onboarding_progress: Json | null
          opt_in_directory: boolean | null
          packing_list: Json | null
          privacy_settings: Json | null
          privy_id: string | null
          role: Database["public"]["Enums"]["profile_role"] | null
          supabase_uid: string | null
          team_id: string | null
          updated_at: string
          username: string | null
        }
        Insert: {
          auth_token?: string | null
          auth_user_id?: string | null
          avatar_url?: string | null
          created_at?: string
          description?: string | null
          email?: string | null
          full_name?: string | null
          housing_preferences?: Json | null
          id: string
          is_guild_invited?: boolean | null
          onboarding_progress?: Json | null
          opt_in_directory?: boolean | null
          packing_list?: Json | null
          privacy_settings?: Json | null
          privy_id?: string | null
          role?: Database["public"]["Enums"]["profile_role"] | null
          supabase_uid?: string | null
          team_id?: string | null
          updated_at?: string
          username?: string | null
        }
        Update: {
          auth_token?: string | null
          auth_user_id?: string | null
          avatar_url?: string | null
          created_at?: string
          description?: string | null
          email?: string | null
          full_name?: string | null
          housing_preferences?: Json | null
          id?: string
          is_guild_invited?: boolean | null
          onboarding_progress?: Json | null
          opt_in_directory?: boolean | null
          packing_list?: Json | null
          privacy_settings?: Json | null
          privy_id?: string | null
          role?: Database["public"]["Enums"]["profile_role"] | null
          supabase_uid?: string | null
          team_id?: string | null
          updated_at?: string
          username?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      recurring_event_exceptions: {
        Row: {
          created_at: string | null
          exception_date: string
          id: string
          is_cancelled: boolean | null
          reason: string | null
          recurring_pattern_id: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          exception_date: string
          id?: string
          is_cancelled?: boolean | null
          reason?: string | null
          recurring_pattern_id?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          exception_date?: string
          id?: string
          is_cancelled?: boolean | null
          reason?: string | null
          recurring_pattern_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "recurring_event_exceptions_recurring_pattern_id_fkey"
            columns: ["recurring_pattern_id"]
            isOneToOne: false
            referencedRelation: "recurring_event_patterns"
            referencedColumns: ["id"]
          },
        ]
      }
      recurring_event_patterns: {
        Row: {
          created_at: string | null
          created_by: string
          day_of_month: number | null
          days_of_week: number[] | null
          end_date: string | null
          frequency: Database["public"]["Enums"]["event_recurrence_frequency"]
          id: string
          interval_count: number
          month_of_year: number | null
          start_date: string
          timezone: string
        }
        Insert: {
          created_at?: string | null
          created_by: string
          day_of_month?: number | null
          days_of_week?: number[] | null
          end_date?: string | null
          frequency: Database["public"]["Enums"]["event_recurrence_frequency"]
          id?: string
          interval_count?: number
          month_of_year?: number | null
          start_date: string
          timezone?: string
        }
        Update: {
          created_at?: string | null
          created_by?: string
          day_of_month?: number | null
          days_of_week?: number[] | null
          end_date?: string | null
          frequency?: Database["public"]["Enums"]["event_recurrence_frequency"]
          id?: string
          interval_count?: number
          month_of_year?: number | null
          start_date?: string
          timezone?: string
        }
        Relationships: [
          {
            foreignKeyName: "recurring_event_patterns_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      revoked_users: {
        Row: {
          email: string
          id: string
          privy_id: string | null
          reason: string | null
          revoked_at: string | null
          revoked_by: string | null
        }
        Insert: {
          email: string
          id?: string
          privy_id?: string | null
          reason?: string | null
          revoked_at?: string | null
          revoked_by?: string | null
        }
        Update: {
          email?: string
          id?: string
          privy_id?: string | null
          reason?: string | null
          revoked_at?: string | null
          revoked_by?: string | null
        }
        Relationships: []
      }
      room_assignment_profiles: {
        Row: {
          created_at: string
          id: string
          profile_id: string
          room_assignment_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          profile_id: string
          room_assignment_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          profile_id?: string
          room_assignment_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "room_assignment_profiles_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "room_assignment_profiles_room_assignment_id_fkey"
            columns: ["room_assignment_id"]
            isOneToOne: false
            referencedRelation: "room_assignments"
            referencedColumns: ["id"]
          },
        ]
      }
      room_assignments: {
        Row: {
          bed_id: string | null
          bedroom_id: string | null
          created_at: string
          end_date: string
          id: string
          location_id: string | null
          notes: string | null
          profile_id: string | null
          start_date: string
          updated_at: string
        }
        Insert: {
          bed_id?: string | null
          bedroom_id?: string | null
          created_at?: string
          end_date: string
          id?: string
          location_id?: string | null
          notes?: string | null
          profile_id?: string | null
          start_date: string
          updated_at?: string
        }
        Update: {
          bed_id?: string | null
          bedroom_id?: string | null
          created_at?: string
          end_date?: string
          id?: string
          location_id?: string | null
          notes?: string | null
          profile_id?: string | null
          start_date?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "room_assignments_apartment_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "room_assignments_bed_id_fkey"
            columns: ["bed_id"]
            isOneToOne: false
            referencedRelation: "beds"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "room_assignments_bedroom_id_fkey"
            columns: ["bedroom_id"]
            isOneToOne: false
            referencedRelation: "bedrooms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "room_assignments_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      room_types: {
        Row: {
          active: boolean | null
          code: string
          created_at: string
          description: string | null
          display_name: string
          id: string
          min_stay_days: number | null
          price_range_max: number | null
          price_range_min: number | null
          quantity: number
          updated_at: string
        }
        Insert: {
          active?: boolean | null
          code: string
          created_at?: string
          description?: string | null
          display_name: string
          id?: string
          min_stay_days?: number | null
          price_range_max?: number | null
          price_range_min?: number | null
          quantity?: number
          updated_at?: string
        }
        Update: {
          active?: boolean | null
          code?: string
          created_at?: string
          description?: string | null
          display_name?: string
          id?: string
          min_stay_days?: number | null
          price_range_max?: number | null
          price_range_min?: number | null
          quantity?: number
          updated_at?: string
        }
        Relationships: []
      }
      secrets: {
        Row: {
          created_at: string
          id: string
          name: string
          value: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          value: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          value?: string
        }
        Relationships: []
      }
      settings: {
        Row: {
          created_at: string
          description: string | null
          id: string
          key: string
          updated_at: string
          value: Json
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          key: string
          updated_at?: string
          value: Json
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          key?: string
          updated_at?: string
          value?: Json
        }
        Relationships: []
      }
      teams: {
        Row: {
          created_at: string
          description: string | null
          id: string
          logo_url: string | null
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          logo_url?: string | null
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          logo_url?: string | null
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      zulink_apps: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          created_at: string
          created_by: string
          description: string | null
          id: string
          image_url: string | null
          name: string
          status: string
          updated_at: string
          url: string
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          created_by: string
          description?: string | null
          id?: string
          image_url?: string | null
          name: string
          status?: string
          updated_at?: string
          url: string
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          created_by?: string
          description?: string | null
          id?: string
          image_url?: string | null
          name?: string
          status?: string
          updated_at?: string
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "zulink_apps_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "zulink_apps_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      zulink_projects: {
        Row: {
          benefit_to_zuitzerland: string
          contribution_type: Database["public"]["Enums"]["zulink_contribution_type"]
          created_at: string
          description: string
          flag: Database["public"]["Enums"]["zulink_flag_type"]
          github_link: string | null
          id: string
          implementation_url: string | null
          name: string
          profile_id: string
          status: Database["public"]["Enums"]["zulink_project_status"]
          submission_type: Database["public"]["Enums"]["zulink_submission_type"]
          support_needed: string | null
          telegram_handle: string | null
          updated_at: string
        }
        Insert: {
          benefit_to_zuitzerland: string
          contribution_type: Database["public"]["Enums"]["zulink_contribution_type"]
          created_at?: string
          description: string
          flag: Database["public"]["Enums"]["zulink_flag_type"]
          github_link?: string | null
          id?: string
          implementation_url?: string | null
          name: string
          profile_id: string
          status?: Database["public"]["Enums"]["zulink_project_status"]
          submission_type: Database["public"]["Enums"]["zulink_submission_type"]
          support_needed?: string | null
          telegram_handle?: string | null
          updated_at?: string
        }
        Update: {
          benefit_to_zuitzerland?: string
          contribution_type?: Database["public"]["Enums"]["zulink_contribution_type"]
          created_at?: string
          description?: string
          flag?: Database["public"]["Enums"]["zulink_flag_type"]
          github_link?: string | null
          id?: string
          implementation_url?: string | null
          name?: string
          profile_id?: string
          status?: Database["public"]["Enums"]["zulink_project_status"]
          submission_type?: Database["public"]["Enums"]["zulink_submission_type"]
          support_needed?: string | null
          telegram_handle?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_profile_zulink_projects"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      can_book_location: {
        Args: { location_id: string; user_role: string }
        Returns: boolean
      }
      clean_historical_data: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      generate_recurring_event_instances: {
        Args: {
          parent_event_id: string
          pattern_id: string
          pattern_frequency: Database["public"]["Enums"]["event_recurrence_frequency"]
          pattern_interval_count: number
          pattern_days_of_week: number[]
          pattern_start_date: string
          pattern_end_date: string
          event_timezone?: string
        }
        Returns: undefined
      }
      get_auth_context: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_bookable_locations: {
        Args: Record<PropertyKey, never>
        Returns: {
          id: string
          name: string
          building: string
          floor: string
          type: string
          description: string
          max_occupancy: number
          created_at: string
          updated_at: string
          anyone_can_book: boolean
        }[]
      }
      get_bookable_locations_for_user: {
        Args: { user_role: string }
        Returns: {
          id: string
          name: string
          building: string
          floor: string
          type: string
          description: string
          max_occupancy: number
          created_at: string
          updated_at: string
          anyone_can_book: boolean
        }[]
      }
      get_invoice_status_distribution: {
        Args: { time_filter?: string }
        Returns: {
          status: string
          count: number
          revenue: number
        }[]
      }
      get_monthly_revenue: {
        Args: { year_filter: number }
        Returns: {
          month: string
          revenue: number
          invoice_count: number
          avg_value: number
        }[]
      }
      get_user_role: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      has_role: {
        Args: { user_id: string; role: Database["public"]["Enums"]["app_role"] }
        Returns: boolean
      }
      increment_reminder_count: {
        Args: { invoice_id: string }
        Returns: number
      }
      is_admin_user: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      is_event_co_host: {
        Args: { event_id: string; user_profile_id: string }
        Returns: boolean
      }
      sync_application_from_airtable: {
        Args: {
          p_application_id: string
          p_applicant_name: string
          p_email: string
          p_phone_number: string
          p_submission_date: string
          p_application_status: string
          p_notes: string
          p_approver: string[]
          p_room_preference: string[]
          p_financial_assistance: string[]
          p_overall: string[]
          p_staying: string[]
          p_first_name: string
          p_white_list: string
          p_role: string
          p_invoice_link: string
          p_date_of_white_list_approval: string
          p_reminders_sent: number
          p_visa_needed: string
          p_telegram_followup: string
          p_tg_socials: string
          p_scholar_status: string
        }
        Returns: string
      }
      update_auth_token: {
        Args: { profile_id: string; new_token: string }
        Returns: undefined
      }
    }
    Enums: {
      app_role: "admin" | "co-designer" | "co-curator"
      application_role:
        | "co-curator"
        | "co-designer"
        | "possible co-curator"
        | "possible sponsor contact"
        | "Attendee"
        | "possible scholarship"
        | "Partner / Plus One of Participant"
        | "Full Scholarship"
        | "Partial Scholarship"
        | "Possible volunteer"
      application_status:
        | "Pending"
        | "Reviewed"
        | "Approved"
        | "Paid"
        | "Rejected"
        | "Wait"
        | "borderline"
      event_recurrence_frequency: "daily" | "weekly" | "monthly" | "yearly"
      invoice_status: "pending" | "paid" | "overdue"
      issue_category:
        | "technical"
        | "interpersonal"
        | "safety"
        | "resource"
        | "feedback"
        | "other"
      issue_location:
        | "common_areas"
        | "tent_cabin"
        | "event_venue"
        | "not_sure"
        | "other"
      issue_severity: "minor" | "moderate" | "urgent"
      issue_status:
        | "submitted"
        | "in_review"
        | "in_progress"
        | "resolved"
        | "closed"
      profile_role: "admin" | "co-designer" | "co-curator" | "attendee"
      room_type:
        | "hotel_room_queen"
        | "apartment_3br_couple"
        | "apartment_3_4br_queen_single"
        | "apartment_3_4br_twin_single"
        | "apartment_2br_twin_single"
        | "apartment_2br_triple"
      scholar_status:
        | "Scholarship requested / Pending approval"
        | "Probably accept"
        | "Partial scholarship approved"
        | "Full scholarship approved"
        | "None"
        | "Scholarship to be Rejected"
      telegram_followup_status: "Done" | "Not coming" | "Scholar"
      white_list_status: "yes" | "no"
      zulink_contribution_type:
        | "Tooling"
        | "Framework"
        | "dacc"
        | "Software"
        | "Social"
        | "Other"
        | "Governance"
        | "Practical Tooling"
        | "Visionary Tech"
        | "ZuLink Bounty"
      zulink_flag_type: "Green" | "Grey" | "Yellow" | "Swiss"
      zulink_project_status: "pending" | "approved" | "rejected" | "implemented"
      zulink_submission_type: "project_to_implement" | "project_idea"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "co-designer", "co-curator"],
      application_role: [
        "co-curator",
        "co-designer",
        "possible co-curator",
        "possible sponsor contact",
        "Attendee",
        "possible scholarship",
        "Partner / Plus One of Participant",
        "Full Scholarship",
        "Partial Scholarship",
        "Possible volunteer",
      ],
      application_status: [
        "Pending",
        "Reviewed",
        "Approved",
        "Paid",
        "Rejected",
        "Wait",
        "borderline",
      ],
      event_recurrence_frequency: ["daily", "weekly", "monthly", "yearly"],
      invoice_status: ["pending", "paid", "overdue"],
      issue_category: [
        "technical",
        "interpersonal",
        "safety",
        "resource",
        "feedback",
        "other",
      ],
      issue_location: [
        "common_areas",
        "tent_cabin",
        "event_venue",
        "not_sure",
        "other",
      ],
      issue_severity: ["minor", "moderate", "urgent"],
      issue_status: [
        "submitted",
        "in_review",
        "in_progress",
        "resolved",
        "closed",
      ],
      profile_role: ["admin", "co-designer", "co-curator", "attendee"],
      room_type: [
        "hotel_room_queen",
        "apartment_3br_couple",
        "apartment_3_4br_queen_single",
        "apartment_3_4br_twin_single",
        "apartment_2br_twin_single",
        "apartment_2br_triple",
      ],
      scholar_status: [
        "Scholarship requested / Pending approval",
        "Probably accept",
        "Partial scholarship approved",
        "Full scholarship approved",
        "None",
        "Scholarship to be Rejected",
      ],
      telegram_followup_status: ["Done", "Not coming", "Scholar"],
      white_list_status: ["yes", "no"],
      zulink_contribution_type: [
        "Tooling",
        "Framework",
        "dacc",
        "Software",
        "Social",
        "Other",
        "Governance",
        "Practical Tooling",
        "Visionary Tech",
        "ZuLink Bounty",
      ],
      zulink_flag_type: ["Green", "Grey", "Yellow", "Swiss"],
      zulink_project_status: ["pending", "approved", "rejected", "implemented"],
      zulink_submission_type: ["project_to_implement", "project_idea"],
    },
  },
} as const

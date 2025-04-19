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
      apartments: {
        Row: {
          building: string | null
          created_at: string
          description: string | null
          floor: string | null
          id: string
          max_occupancy: number | null
          name: string
          updated_at: string
        }
        Insert: {
          building?: string | null
          created_at?: string
          description?: string | null
          floor?: string | null
          id?: string
          max_occupancy?: number | null
          name: string
          updated_at?: string
        }
        Update: {
          building?: string | null
          created_at?: string
          description?: string | null
          floor?: string | null
          id?: string
          max_occupancy?: number | null
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
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
          apartment_id: string
          created_at: string
          description: string | null
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          apartment_id: string
          created_at?: string
          description?: string | null
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          apartment_id?: string
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "bedrooms_apartment_id_fkey"
            columns: ["apartment_id"]
            isOneToOne: false
            referencedRelation: "apartments"
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
      events: {
        Row: {
          color: string | null
          created_at: string
          created_by: string
          description: string | null
          end_date: string
          id: string
          is_all_day: boolean | null
          location: string | null
          start_date: string
          title: string
          updated_at: string
        }
        Insert: {
          color?: string | null
          created_at?: string
          created_by: string
          description?: string | null
          end_date: string
          id?: string
          is_all_day?: boolean | null
          location?: string | null
          start_date: string
          title: string
          updated_at?: string
        }
        Update: {
          color?: string | null
          created_at?: string
          created_by?: string
          description?: string | null
          end_date?: string
          id?: string
          is_all_day?: boolean | null
          location?: string | null
          start_date?: string
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
      room_assignments: {
        Row: {
          apartment_id: string | null
          bed_id: string | null
          bedroom_id: string | null
          created_at: string
          end_date: string
          id: string
          notes: string | null
          profile_id: string
          start_date: string
          updated_at: string
        }
        Insert: {
          apartment_id?: string | null
          bed_id?: string | null
          bedroom_id?: string | null
          created_at?: string
          end_date: string
          id?: string
          notes?: string | null
          profile_id: string
          start_date: string
          updated_at?: string
        }
        Update: {
          apartment_id?: string | null
          bed_id?: string | null
          bedroom_id?: string | null
          created_at?: string
          end_date?: string
          id?: string
          notes?: string | null
          profile_id?: string
          start_date?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "room_assignments_apartment_id_fkey"
            columns: ["apartment_id"]
            isOneToOne: false
            referencedRelation: "apartments"
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
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_auth_context: {
        Args: Record<PropertyKey, never>
        Returns: string
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
      invoice_status: "pending" | "paid" | "overdue"
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
      invoice_status: ["pending", "paid", "overdue"],
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
    },
  },
} as const

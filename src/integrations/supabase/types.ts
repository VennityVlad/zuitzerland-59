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
      discounts: {
        Row: {
          active: boolean
          created_at: string
          id: string
          is_role_based: boolean
          month: string
          percentage: number
        }
        Insert: {
          active?: boolean
          created_at?: string
          id?: string
          is_role_based?: boolean
          month: string
          percentage: number
        }
        Update: {
          active?: boolean
          created_at?: string
          id?: string
          is_role_based?: boolean
          month?: string
          percentage?: number
        }
        Relationships: []
      }
      invoices: {
        Row: {
          auth_user_id: string | null
          booking_details: Json
          checkin: string
          checkout: string
          created_at: string
          due_date: string
          email: string
          first_name: string
          id: string
          invoice_uid: string
          last_name: string
          payment_link: string
          payment_type: string
          price: number
          privy_id: string | null
          request_invoice_id: string
          room_type: string
          status: string
        }
        Insert: {
          auth_user_id?: string | null
          booking_details: Json
          checkin: string
          checkout: string
          created_at?: string
          due_date: string
          email: string
          first_name: string
          id?: string
          invoice_uid: string
          last_name: string
          payment_link: string
          payment_type: string
          price: number
          privy_id?: string | null
          request_invoice_id: string
          room_type: string
          status?: string
        }
        Update: {
          auth_user_id?: string | null
          booking_details?: Json
          checkin?: string
          checkout?: string
          created_at?: string
          due_date?: string
          email?: string
          first_name?: string
          id?: string
          invoice_uid?: string
          last_name?: string
          payment_link?: string
          payment_type?: string
          price?: number
          privy_id?: string | null
          request_invoice_id?: string
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
          id: string
          privy_id: string | null
          role: Database["public"]["Enums"]["profile_role"] | null
          supabase_uid: string | null
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
          id: string
          privy_id?: string | null
          role?: Database["public"]["Enums"]["profile_role"] | null
          supabase_uid?: string | null
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
          id?: string
          privy_id?: string | null
          role?: Database["public"]["Enums"]["profile_role"] | null
          supabase_uid?: string | null
          updated_at?: string
          username?: string | null
        }
        Relationships: []
      }
      room_types: {
        Row: {
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
      has_role: {
        Args: {
          user_id: string
          role: Database["public"]["Enums"]["app_role"]
        }
        Returns: boolean
      }
      update_auth_token: {
        Args: {
          profile_id: string
          new_token: string
        }
        Returns: undefined
      }
    }
    Enums: {
      app_role: "admin" | "co-designer" | "co-curator"
      invoice_status: "pending" | "paid" | "overdue"
      profile_role: "admin" | "co-designer" | "co-curator"
      room_type:
        | "hotel_room_queen"
        | "apartment_3br_couple"
        | "apartment_3_4br_queen_single"
        | "apartment_3_4br_twin_single"
        | "apartment_2br_twin_single"
        | "apartment_2br_triple"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type PublicSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
        PublicSchema["Views"])
    ? (PublicSchema["Tables"] &
        PublicSchema["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof PublicSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
    ? PublicSchema["Enums"][PublicEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof PublicSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof PublicSchema["CompositeTypes"]
    ? PublicSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

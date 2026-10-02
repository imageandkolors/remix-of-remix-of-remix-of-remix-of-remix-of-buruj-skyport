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
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      applications: {
        Row: {
          address: string | null
          admin_notes: string | null
          consent: boolean
          created_at: string
          current_class: string | null
          current_school: string | null
          date_of_birth: string | null
          gender: string | null
          guardian_email: string | null
          guardian_name: string
          guardian_phone: string
          guardian_relationship: string | null
          id: string
          medical_notes: string | null
          motivation: string | null
          player_name: string
          position: string | null
          programme: string
          reference_number: string
          reviewer_id: string | null
          status: string
          status_changed_at: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          address?: string | null
          admin_notes?: string | null
          consent?: boolean
          created_at?: string
          current_class?: string | null
          current_school?: string | null
          date_of_birth?: string | null
          gender?: string | null
          guardian_email?: string | null
          guardian_name: string
          guardian_phone: string
          guardian_relationship?: string | null
          id?: string
          medical_notes?: string | null
          motivation?: string | null
          player_name: string
          position?: string | null
          programme: string
          reference_number?: string
          reviewer_id?: string | null
          status?: string
          status_changed_at?: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          address?: string | null
          admin_notes?: string | null
          consent?: boolean
          created_at?: string
          current_class?: string | null
          current_school?: string | null
          date_of_birth?: string | null
          gender?: string | null
          guardian_email?: string | null
          guardian_name?: string
          guardian_phone?: string
          guardian_relationship?: string | null
          id?: string
          medical_notes?: string | null
          motivation?: string | null
          player_name?: string
          position?: string | null
          programme?: string
          reference_number?: string
          reviewer_id?: string | null
          status?: string
          status_changed_at?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "applications_reviewer_id_fkey"
            columns: ["reviewer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      enquiries: {
        Row: {
          created_at: string
          email: string | null
          id: string
          message: string
          name: string
          phone: string | null
          programme: string | null
          status: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          id?: string
          message: string
          name: string
          phone?: string | null
          programme?: string | null
          status?: string
        }
        Update: {
          created_at?: string
          email?: string | null
          id?: string
          message?: string
          name?: string
          phone?: string | null
          programme?: string | null
          status?: string
        }
        Relationships: []
      }
      news_posts: {
        Row: {
          body: string | null
          created_at: string
          excerpt: string | null
          id: string
          published: boolean
          published_at: string | null
          title: string
        }
        Insert: {
          body?: string | null
          created_at?: string
          excerpt?: string | null
          id?: string
          published?: boolean
          published_at?: string | null
          title: string
        }
        Update: {
          body?: string | null
          created_at?: string
          excerpt?: string | null
          id?: string
          published?: boolean
          published_at?: string | null
          title?: string
        }
        Relationships: []
      }
      player_profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string
          date_of_birth: string | null
          full_name: string
          height_cm: number | null
          id: string
          is_published: boolean
          jersey_number: number | null
          nationality: string | null
          position: string
          preferred_foot: string | null
          programme: string | null
          secondary_position: string | null
          slug: string
          updated_at: string
          user_id: string | null
          weight_kg: number | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          date_of_birth?: string | null
          full_name: string
          height_cm?: number | null
          id?: string
          is_published?: boolean
          jersey_number?: number | null
          nationality?: string | null
          position?: string
          preferred_foot?: string | null
          programme?: string | null
          secondary_position?: string | null
          slug: string
          updated_at?: string
          user_id?: string | null
          weight_kg?: number | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          date_of_birth?: string | null
          full_name?: string
          height_cm?: number | null
          id?: string
          is_published?: boolean
          jersey_number?: number | null
          nationality?: string | null
          position?: string
          preferred_foot?: string | null
          programme?: string | null
          secondary_position?: string | null
          slug?: string
          updated_at?: string
          user_id?: string | null
          weight_kg?: number | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          approved: boolean
          created_at: string
          full_name: string | null
          id: string
          phone: string | null
        }
        Insert: {
          approved?: boolean
          created_at?: string
          full_name?: string | null
          id: string
          phone?: string | null
        }
        Update: {
          approved?: boolean
          created_at?: string
          full_name?: string | null
          id?: string
          phone?: string | null
        }
        Relationships: []
      }
      programmes: {
        Row: {
          age_range: string | null
          fee_amount: number | null
          fee_confirmed: boolean
          fee_period: string | null
          id: string
          inclusions: string[]
          name: string
          slug: string
          updated_at: string
        }
        Insert: {
          age_range?: string | null
          fee_amount?: number | null
          fee_confirmed?: boolean
          fee_period?: string | null
          id?: string
          inclusions?: string[]
          name: string
          slug: string
          updated_at?: string
        }
        Update: {
          age_range?: string | null
          fee_amount?: number | null
          fee_confirmed?: boolean
          fee_period?: string | null
          id?: string
          inclusions?: string[]
          name?: string
          slug?: string
          updated_at?: string
        }
        Relationships: []
      }
      trial_registrations: {
        Row: {
          created_at: string
          date_of_birth: string | null
          guardian_email: string | null
          guardian_name: string
          guardian_phone: string
          id: string
          player_name: string
          position: string | null
          programme: string | null
          status: string
        }
        Insert: {
          created_at?: string
          date_of_birth?: string | null
          guardian_email?: string | null
          guardian_name: string
          guardian_phone: string
          id?: string
          player_name: string
          position?: string | null
          programme?: string | null
          status?: string
        }
        Update: {
          created_at?: string
          date_of_birth?: string | null
          guardian_email?: string | null
          guardian_name?: string
          guardian_phone?: string
          id?: string
          player_name?: string
          position?: string | null
          programme?: string | null
          status?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
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
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_admin: { Args: { _user_id: string }; Returns: boolean }
      is_staff: { Args: { _user_id: string }; Returns: boolean }
    }
    Enums: {
      app_role: "parent" | "player" | "coach" | "admin" | "owner"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
      app_role: ["parent", "player", "coach", "admin", "owner"],
    },
  },
} as const

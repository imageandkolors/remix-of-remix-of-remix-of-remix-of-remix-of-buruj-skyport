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
      player_compliance: {
        Row: {
          fifa_connect_id: string | null
          medical_clearance_expiry: string | null
          nff_registration_id: string | null
          passport_expiry: string | null
          passport_status: string
          player_id: string
          travel_consent_date: string | null
          updated_at: string
          yellow_fever_expiry: string | null
        }
        Insert: {
          fifa_connect_id?: string | null
          medical_clearance_expiry?: string | null
          nff_registration_id?: string | null
          passport_expiry?: string | null
          passport_status?: string
          player_id: string
          travel_consent_date?: string | null
          updated_at?: string
          yellow_fever_expiry?: string | null
        }
        Update: {
          fifa_connect_id?: string | null
          medical_clearance_expiry?: string | null
          nff_registration_id?: string | null
          passport_expiry?: string | null
          passport_status?: string
          player_id?: string
          travel_consent_date?: string | null
          updated_at?: string
          yellow_fever_expiry?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "player_compliance_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: true
            referencedRelation: "player_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      player_documents: {
        Row: {
          created_at: string
          created_by: string
          document_type: string
          expires_on: string | null
          id: string
          mime_type: string
          original_filename: string
          player_id: string
          size_bytes: number
          storage_path: string
        }
        Insert: {
          created_at?: string
          created_by: string
          document_type: string
          expires_on?: string | null
          id?: string
          mime_type: string
          original_filename: string
          player_id: string
          size_bytes: number
          storage_path: string
        }
        Update: {
          created_at?: string
          created_by?: string
          document_type?: string
          expires_on?: string | null
          id?: string
          mime_type?: string
          original_filename?: string
          player_id?: string
          size_bytes?: number
          storage_path?: string
        }
        Relationships: [
          {
            foreignKeyName: "player_documents_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "player_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      player_media: {
        Row: {
          caption: string | null
          created_at: string
          id: string
          kind: string
          player_id: string
          sort: number
          url: string
        }
        Insert: {
          caption?: string | null
          created_at?: string
          id?: string
          kind: string
          player_id: string
          sort?: number
          url: string
        }
        Update: {
          caption?: string | null
          created_at?: string
          id?: string
          kind?: string
          player_id?: string
          sort?: number
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "player_media_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "player_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      player_milestones: {
        Row: {
          created_at: string
          description: string | null
          event_date: string | null
          id: string
          phase: string
          player_id: string
          sort: number
          title: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          event_date?: string | null
          id?: string
          phase: string
          player_id: string
          sort?: number
          title: string
        }
        Update: {
          created_at?: string
          description?: string | null
          event_date?: string | null
          id?: string
          phase?: string
          player_id?: string
          sort?: number
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "player_milestones_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "player_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      player_profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string
          cv_summary: string | null
          date_of_birth: string | null
          finishing: number | null
          full_name: string
          height_cm: number | null
          id: string
          is_published: boolean
          jersey_number: number | null
          joined_on: string | null
          nationality: string | null
          overall_rating: number | null
          pace: number | null
          passing: number | null
          physical: number | null
          position: string
          preferred_foot: string | null
          programme: string | null
          secondary_position: string | null
          slug: string
          tactical: number | null
          technical: number | null
          updated_at: string
          user_id: string | null
          video_cv_url: string | null
          weight_kg: number | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          cv_summary?: string | null
          date_of_birth?: string | null
          finishing?: number | null
          full_name: string
          height_cm?: number | null
          id?: string
          is_published?: boolean
          jersey_number?: number | null
          joined_on?: string | null
          nationality?: string | null
          overall_rating?: number | null
          pace?: number | null
          passing?: number | null
          physical?: number | null
          position?: string
          preferred_foot?: string | null
          programme?: string | null
          secondary_position?: string | null
          slug: string
          tactical?: number | null
          technical?: number | null
          updated_at?: string
          user_id?: string | null
          video_cv_url?: string | null
          weight_kg?: number | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          cv_summary?: string | null
          date_of_birth?: string | null
          finishing?: number | null
          full_name?: string
          height_cm?: number | null
          id?: string
          is_published?: boolean
          jersey_number?: number | null
          joined_on?: string | null
          nationality?: string | null
          overall_rating?: number | null
          pace?: number | null
          passing?: number | null
          physical?: number | null
          position?: string
          preferred_foot?: string | null
          programme?: string | null
          secondary_position?: string | null
          slug?: string
          tactical?: number | null
          technical?: number | null
          updated_at?: string
          user_id?: string | null
          video_cv_url?: string | null
          weight_kg?: number | null
        }
        Relationships: []
      }
      player_registration_history: {
        Row: {
          created_at: string
          end_date: string | null
          id: string
          notes: string | null
          organisation: string
          player_id: string
          registration_body: string | null
          registration_number: string | null
          start_date: string
        }
        Insert: {
          created_at?: string
          end_date?: string | null
          id?: string
          notes?: string | null
          organisation: string
          player_id: string
          registration_body?: string | null
          registration_number?: string | null
          start_date: string
        }
        Update: {
          created_at?: string
          end_date?: string | null
          id?: string
          notes?: string | null
          organisation?: string
          player_id?: string
          registration_body?: string | null
          registration_number?: string | null
          start_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "player_registration_history_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "player_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      player_season_stats: {
        Row: {
          appearances: number
          assists: number
          clean_sheets: number
          created_at: string
          goals: number
          id: string
          minutes: number
          motm: number
          player_id: string
          red_cards: number
          season: string
          yellow_cards: number
        }
        Insert: {
          appearances?: number
          assists?: number
          clean_sheets?: number
          created_at?: string
          goals?: number
          id?: string
          minutes?: number
          motm?: number
          player_id: string
          red_cards?: number
          season: string
          yellow_cards?: number
        }
        Update: {
          appearances?: number
          assists?: number
          clean_sheets?: number
          created_at?: string
          goals?: number
          id?: string
          minutes?: number
          motm?: number
          player_id?: string
          red_cards?: number
          season?: string
          yellow_cards?: number
        }
        Relationships: [
          {
            foreignKeyName: "player_season_stats_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "player_profiles"
            referencedColumns: ["id"]
          },
        ]
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
          cta_body: string | null
          cta_label: string | null
          cta_title: string | null
          display_order: number
          fee_amount: number | null
          fee_confirmed: boolean
          fee_period: string | null
          id: string
          inclusions: string[]
          intro: string | null
          is_published: boolean
          name: string
          non_refundable: boolean
          note: string | null
          sections: Json
          session_label: string | null
          slug: string
          tagline: string | null
          trial_countries: string[]
          updated_at: string
        }
        Insert: {
          age_range?: string | null
          cta_body?: string | null
          cta_label?: string | null
          cta_title?: string | null
          display_order?: number
          fee_amount?: number | null
          fee_confirmed?: boolean
          fee_period?: string | null
          id?: string
          inclusions?: string[]
          intro?: string | null
          is_published?: boolean
          name: string
          non_refundable?: boolean
          note?: string | null
          sections?: Json
          session_label?: string | null
          slug: string
          tagline?: string | null
          trial_countries?: string[]
          updated_at?: string
        }
        Update: {
          age_range?: string | null
          cta_body?: string | null
          cta_label?: string | null
          cta_title?: string | null
          display_order?: number
          fee_amount?: number | null
          fee_confirmed?: boolean
          fee_period?: string | null
          id?: string
          inclusions?: string[]
          intro?: string | null
          is_published?: boolean
          name?: string
          non_refundable?: boolean
          note?: string | null
          sections?: Json
          session_label?: string | null
          slug?: string
          tagline?: string | null
          trial_countries?: string[]
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
      can_access_player: { Args: { _player: string }; Returns: boolean }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_admin: { Args: { _user_id: string }; Returns: boolean }
      is_staff: { Args: { _user_id: string }; Returns: boolean }
      player_is_public: { Args: { _player: string }; Returns: boolean }
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

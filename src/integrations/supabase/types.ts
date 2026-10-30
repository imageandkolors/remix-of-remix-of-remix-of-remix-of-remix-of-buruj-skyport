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
      about_sections: {
        Row: {
          accent_color: string
          bg_color: string
          body_html: string
          created_at: string
          eyebrow: string | null
          id: string
          image_alt: string | null
          image_path: string | null
          is_active: boolean
          layout: string
          section_key: string
          sort: number
          text_color: string
          title: string
          updated_at: string
        }
        Insert: {
          accent_color?: string
          bg_color?: string
          body_html?: string
          created_at?: string
          eyebrow?: string | null
          id?: string
          image_alt?: string | null
          image_path?: string | null
          is_active?: boolean
          layout?: string
          section_key: string
          sort?: number
          text_color?: string
          title: string
          updated_at?: string
        }
        Update: {
          accent_color?: string
          bg_color?: string
          body_html?: string
          created_at?: string
          eyebrow?: string | null
          id?: string
          image_alt?: string | null
          image_path?: string | null
          is_active?: boolean
          layout?: string
          section_key?: string
          sort?: number
          text_color?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      application_documents: {
        Row: {
          application_id: string
          created_at: string
          document_type: string
          id: string
          mime_type: string
          original_filename: string
          size_bytes: number
          storage_path: string
        }
        Insert: {
          application_id: string
          created_at?: string
          document_type: string
          id?: string
          mime_type: string
          original_filename: string
          size_bytes: number
          storage_path: string
        }
        Update: {
          application_id?: string
          created_at?: string
          document_type?: string
          id?: string
          mime_type?: string
          original_filename?: string
          size_bytes?: number
          storage_path?: string
        }
        Relationships: [
          {
            foreignKeyName: "application_documents_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "applicants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "application_documents_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "applications"
            referencedColumns: ["id"]
          },
        ]
      }
      application_upload_tickets: {
        Row: {
          application_id: string
          completed_at: string | null
          created_at: string
          document_type: string
          expected_mime_type: string
          expected_size: number
          expires_at: string
          id: string
          original_filename: string
          status: string
          storage_path: string
        }
        Insert: {
          application_id: string
          completed_at?: string | null
          created_at?: string
          document_type: string
          expected_mime_type: string
          expected_size: number
          expires_at?: string
          id?: string
          original_filename: string
          status?: string
          storage_path: string
        }
        Update: {
          application_id?: string
          completed_at?: string | null
          created_at?: string
          document_type?: string
          expected_mime_type?: string
          expected_size?: number
          expires_at?: string
          id?: string
          original_filename?: string
          status?: string
          storage_path?: string
        }
        Relationships: [
          {
            foreignKeyName: "application_upload_tickets_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "applicants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "application_upload_tickets_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "applications"
            referencedColumns: ["id"]
          },
        ]
      }
      applications: {
        Row: {
          address: string | null
          admin_notes: string | null
          ai_assessed_at: string | null
          ai_assessment: Json | null
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
          ai_assessed_at?: string | null
          ai_assessment?: Json | null
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
          ai_assessed_at?: string | null
          ai_assessment?: Json | null
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
      contact_locations: {
        Row: {
          address: string
          created_at: string
          email: string | null
          id: string
          is_active: boolean
          map_url: string | null
          name: string
          phone: string | null
          sort: number
          updated_at: string
          whatsapp: string | null
        }
        Insert: {
          address: string
          created_at?: string
          email?: string | null
          id?: string
          is_active?: boolean
          map_url?: string | null
          name: string
          phone?: string | null
          sort?: number
          updated_at?: string
          whatsapp?: string | null
        }
        Update: {
          address?: string
          created_at?: string
          email?: string | null
          id?: string
          is_active?: boolean
          map_url?: string | null
          name?: string
          phone?: string | null
          sort?: number
          updated_at?: string
          whatsapp?: string | null
        }
        Relationships: []
      }
      content_categories: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          name: string
          slug: string
          sort: number
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          slug: string
          sort?: number
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          slug?: string
          sort?: number
        }
        Relationships: []
      }
      content_tags: {
        Row: {
          created_at: string
          id: string
          name: string
          slug: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          slug: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          slug?: string
        }
        Relationships: []
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
      gallery_media: {
        Row: {
          caption: string | null
          category: string
          created_at: string
          external_url: string | null
          id: string
          is_active: boolean
          kind: string
          mime_type: string | null
          sort: number
          storage_path: string | null
          title: string
        }
        Insert: {
          caption?: string | null
          category?: string
          created_at?: string
          external_url?: string | null
          id?: string
          is_active?: boolean
          kind: string
          mime_type?: string | null
          sort?: number
          storage_path?: string | null
          title: string
        }
        Update: {
          caption?: string | null
          category?: string
          created_at?: string
          external_url?: string | null
          id?: string
          is_active?: boolean
          kind?: string
          mime_type?: string | null
          sort?: number
          storage_path?: string | null
          title?: string
        }
        Relationships: []
      }
      news_post_media: {
        Row: {
          alt_text: string | null
          caption: string | null
          created_at: string
          external_url: string | null
          id: string
          kind: string
          mime_type: string | null
          post_id: string
          sort: number
          storage_path: string | null
        }
        Insert: {
          alt_text?: string | null
          caption?: string | null
          created_at?: string
          external_url?: string | null
          id?: string
          kind: string
          mime_type?: string | null
          post_id: string
          sort?: number
          storage_path?: string | null
        }
        Update: {
          alt_text?: string | null
          caption?: string | null
          created_at?: string
          external_url?: string | null
          id?: string
          kind?: string
          mime_type?: string | null
          post_id?: string
          sort?: number
          storage_path?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "news_post_media_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "news_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      news_posts: {
        Row: {
          article_section: string | null
          author: string | null
          body: string | null
          body_html: string | null
          canonical_url: string | null
          category: string
          cover_fit: string
          cover_path: string | null
          cover_position: string
          created_at: string
          excerpt: string | null
          id: string
          is_featured: boolean
          meta_description: string | null
          meta_title: string | null
          published: boolean
          published_at: string | null
          schema_publisher: string | null
          seo_author: string | null
          seo_keywords: string | null
          slug: string | null
          social_image_path: string | null
          tags: string[]
          title: string
        }
        Insert: {
          article_section?: string | null
          author?: string | null
          body?: string | null
          body_html?: string | null
          canonical_url?: string | null
          category?: string
          cover_fit?: string
          cover_path?: string | null
          cover_position?: string
          created_at?: string
          excerpt?: string | null
          id?: string
          is_featured?: boolean
          meta_description?: string | null
          meta_title?: string | null
          published?: boolean
          published_at?: string | null
          schema_publisher?: string | null
          seo_author?: string | null
          seo_keywords?: string | null
          slug?: string | null
          social_image_path?: string | null
          tags?: string[]
          title: string
        }
        Update: {
          article_section?: string | null
          author?: string | null
          body?: string | null
          body_html?: string | null
          canonical_url?: string | null
          category?: string
          cover_fit?: string
          cover_path?: string | null
          cover_position?: string
          created_at?: string
          excerpt?: string | null
          id?: string
          is_featured?: boolean
          meta_description?: string | null
          meta_title?: string | null
          published?: boolean
          published_at?: string | null
          schema_publisher?: string | null
          seo_author?: string | null
          seo_keywords?: string | null
          slug?: string | null
          social_image_path?: string | null
          tags?: string[]
          title?: string
        }
        Relationships: []
      }
      page_seo: {
        Row: {
          canonical_url: string | null
          description: string
          id: string
          keywords: string | null
          og_description: string | null
          og_image_path: string | null
          og_title: string | null
          og_type: string
          page_key: string
          page_path: string
          robots: string
          title: string
          twitter_card: string
          updated_at: string
        }
        Insert: {
          canonical_url?: string | null
          description?: string
          id?: string
          keywords?: string | null
          og_description?: string | null
          og_image_path?: string | null
          og_title?: string | null
          og_type?: string
          page_key: string
          page_path: string
          robots?: string
          title: string
          twitter_card?: string
          updated_at?: string
        }
        Update: {
          canonical_url?: string | null
          description?: string
          id?: string
          keywords?: string | null
          og_description?: string | null
          og_image_path?: string | null
          og_title?: string | null
          og_type?: string
          page_key?: string
          page_path?: string
          robots?: string
          title?: string
          twitter_card?: string
          updated_at?: string
        }
        Relationships: []
      }
      parent_access_requests: {
        Row: {
          created_at: string
          email: string
          guardian_name: string | null
          id: string
          reference_number: string
          sent_at: string | null
          status: string
        }
        Insert: {
          created_at?: string
          email: string
          guardian_name?: string | null
          id?: string
          reference_number: string
          sent_at?: string | null
          status?: string
        }
        Update: {
          created_at?: string
          email?: string
          guardian_name?: string | null
          id?: string
          reference_number?: string
          sent_at?: string | null
          status?: string
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
      player_cv_requests: {
        Row: {
          country: string | null
          created_at: string
          email: string
          id: string
          message: string | null
          organisation: string
          player_id: string
          purpose: string
          requester_name: string
          role: string | null
          status: string
        }
        Insert: {
          country?: string | null
          created_at?: string
          email: string
          id?: string
          message?: string | null
          organisation: string
          player_id: string
          purpose: string
          requester_name: string
          role?: string | null
          status?: string
        }
        Update: {
          country?: string | null
          created_at?: string
          email?: string
          id?: string
          message?: string | null
          organisation?: string
          player_id?: string
          purpose?: string
          requester_name?: string
          role?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "player_cv_requests_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
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
      public_intake_rate_limits: {
        Row: {
          created_at: string
          identifier_hash: string
          operation: string
          request_count: number
          updated_at: string
          window_start: string
        }
        Insert: {
          created_at?: string
          identifier_hash: string
          operation: string
          request_count: number
          updated_at?: string
          window_start: string
        }
        Update: {
          created_at?: string
          identifier_hash?: string
          operation?: string
          request_count?: number
          updated_at?: string
          window_start?: string
        }
        Relationships: []
      }
      site_settings: {
        Row: {
          contact_heading: string
          contact_intro: string
          email: string
          facebook: string | null
          footer_bg: string
          footer_fg: string
          header_bg: string
          header_fg: string
          id: number
          instagram: string | null
          phone: string | null
          tiktok: string | null
          updated_at: string
          whatsapp: string
          x_url: string | null
          youtube: string | null
        }
        Insert: {
          contact_heading?: string
          contact_intro?: string
          email?: string
          facebook?: string | null
          footer_bg?: string
          footer_fg?: string
          header_bg?: string
          header_fg?: string
          id?: number
          instagram?: string | null
          phone?: string | null
          tiktok?: string | null
          updated_at?: string
          whatsapp?: string
          x_url?: string | null
          youtube?: string | null
        }
        Update: {
          contact_heading?: string
          contact_intro?: string
          email?: string
          facebook?: string | null
          footer_bg?: string
          footer_fg?: string
          header_bg?: string
          header_fg?: string
          id?: number
          instagram?: string | null
          phone?: string | null
          tiktok?: string | null
          updated_at?: string
          whatsapp?: string
          x_url?: string | null
          youtube?: string | null
        }
        Relationships: []
      }
      social_feed_items: {
        Row: {
          created_at: string
          feed_id: string
          id: string
          is_active: boolean
          sort: number
          thumbnail_url: string | null
          title: string
          video_url: string
        }
        Insert: {
          created_at?: string
          feed_id: string
          id?: string
          is_active?: boolean
          sort?: number
          thumbnail_url?: string | null
          title?: string
          video_url: string
        }
        Update: {
          created_at?: string
          feed_id?: string
          id?: string
          is_active?: boolean
          sort?: number
          thumbnail_url?: string | null
          title?: string
          video_url?: string
        }
        Relationships: [
          {
            foreignKeyName: "social_feed_items_feed_id_fkey"
            columns: ["feed_id"]
            isOneToOne: false
            referencedRelation: "social_feeds"
            referencedColumns: ["id"]
          },
        ]
      }
      social_feeds: {
        Row: {
          created_at: string
          display_limit: number
          id: string
          is_active: boolean
          label: string
          platform: string
          sort: number
          source_url: string
        }
        Insert: {
          created_at?: string
          display_limit?: number
          id?: string
          is_active?: boolean
          label: string
          platform: string
          sort?: number
          source_url: string
        }
        Update: {
          created_at?: string
          display_limit?: number
          id?: string
          is_active?: boolean
          label?: string
          platform?: string
          sort?: number
          source_url?: string
        }
        Relationships: []
      }
      splash_slides: {
        Row: {
          alt_text: string | null
          bg_color: string
          created_at: string
          id: string
          image_path: string | null
          is_active: boolean
          kind: string
          link_url: string | null
          media_kind: string
          sort: number
          subtitle: string | null
          title: string | null
          video_path: string | null
          youtube_url: string | null
        }
        Insert: {
          alt_text?: string | null
          bg_color?: string
          created_at?: string
          id?: string
          image_path?: string | null
          is_active?: boolean
          kind?: string
          link_url?: string | null
          media_kind?: string
          sort?: number
          subtitle?: string | null
          title?: string | null
          video_path?: string | null
          youtube_url?: string | null
        }
        Update: {
          alt_text?: string | null
          bg_color?: string
          created_at?: string
          id?: string
          image_path?: string | null
          is_active?: boolean
          kind?: string
          link_url?: string | null
          media_kind?: string
          sort?: number
          subtitle?: string | null
          title?: string | null
          video_path?: string | null
          youtube_url?: string | null
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
      applicants: {
        Row: {
          created_at: string | null
          email: string | null
          first_name: string | null
          id: string | null
          last_name: string | null
          programme: string | null
          school: string | null
          status: string | null
        }
        Insert: {
          created_at?: string | null
          email?: string | null
          first_name?: never
          id?: string | null
          last_name?: never
          programme?: string | null
          school?: string | null
          status?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string | null
          first_name?: never
          id?: string | null
          last_name?: never
          programme?: string | null
          school?: string | null
          status?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      consume_public_intake_rate_limit: {
        Args: {
          p_identifier_hash: string
          p_max_requests: number
          p_operation: string
          p_window_seconds: number
        }
        Returns: boolean
      }
      create_parent_access_request_limited: {
        Args: {
          p_email: string
          p_guardian_name: string
          p_reference_number: string
        }
        Returns: boolean
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_admin: { Args: { _user_id: string }; Returns: boolean }
      is_staff: { Args: { _user_id: string }; Returns: boolean }
      replace_news_post_media: {
        Args: { p_media: Json; p_post_id: string }
        Returns: undefined
      }
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

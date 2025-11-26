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
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      admin_activity_logs: {
        Row: {
          action: string
          admin_id: string
          created_at: string
          details: Json | null
          id: string
          ip_address: unknown
          resource_id: string | null
          resource_type: string | null
          user_agent: string | null
        }
        Insert: {
          action: string
          admin_id: string
          created_at?: string
          details?: Json | null
          id?: string
          ip_address?: unknown
          resource_id?: string | null
          resource_type?: string | null
          user_agent?: string | null
        }
        Update: {
          action?: string
          admin_id?: string
          created_at?: string
          details?: Json | null
          id?: string
          ip_address?: unknown
          resource_id?: string | null
          resource_type?: string | null
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "admin_activity_logs_admin_id_fkey"
            columns: ["admin_id"]
            isOneToOne: false
            referencedRelation: "admins"
            referencedColumns: ["id"]
          },
        ]
      }
      admin_sessions: {
        Row: {
          admin_id: string
          created_at: string
          expires_at: string
          id: string
          ip_address: unknown
          is_active: boolean
          last_activity: string
          session_token: string
          user_agent: string | null
        }
        Insert: {
          admin_id: string
          created_at?: string
          expires_at?: string
          id?: string
          ip_address?: unknown
          is_active?: boolean
          last_activity?: string
          session_token: string
          user_agent?: string | null
        }
        Update: {
          admin_id?: string
          created_at?: string
          expires_at?: string
          id?: string
          ip_address?: unknown
          is_active?: boolean
          last_activity?: string
          session_token?: string
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "admin_sessions_admin_id_fkey"
            columns: ["admin_id"]
            isOneToOne: false
            referencedRelation: "admins"
            referencedColumns: ["id"]
          },
        ]
      }
      admins: {
        Row: {
          created_at: string
          email: string
          failed_login_attempts: number | null
          full_name: string | null
          id: string
          is_super_admin: boolean | null
          last_sign_in_at: string | null
          locked_until: string | null
          must_change_password: boolean | null
          password_changed_at: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          email: string
          failed_login_attempts?: number | null
          full_name?: string | null
          id: string
          is_super_admin?: boolean | null
          last_sign_in_at?: string | null
          locked_until?: string | null
          must_change_password?: boolean | null
          password_changed_at?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string
          failed_login_attempts?: number | null
          full_name?: string | null
          id?: string
          is_super_admin?: boolean | null
          last_sign_in_at?: string | null
          locked_until?: string | null
          must_change_password?: boolean | null
          password_changed_at?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      audit_logs: {
        Row: {
          action_details: Json
          actor_id: string | null
          anomaly_flags: Json | null
          compliance_tags: string[] | null
          created_at: string
          current_hash: string | null
          event_timestamp: string
          event_type: Database["public"]["Enums"]["audit_event_type"]
          id: string
          ip_address: unknown
          location_data: Json | null
          previous_hash: string | null
          reason: string | null
          resource_id: string | null
          resource_type: string | null
          session_id: string | null
          severity: Database["public"]["Enums"]["audit_severity"]
          target_id: string | null
          user_agent: string | null
        }
        Insert: {
          action_details: Json
          actor_id?: string | null
          anomaly_flags?: Json | null
          compliance_tags?: string[] | null
          created_at?: string
          current_hash?: string | null
          event_timestamp?: string
          event_type: Database["public"]["Enums"]["audit_event_type"]
          id?: string
          ip_address?: unknown
          location_data?: Json | null
          previous_hash?: string | null
          reason?: string | null
          resource_id?: string | null
          resource_type?: string | null
          session_id?: string | null
          severity?: Database["public"]["Enums"]["audit_severity"]
          target_id?: string | null
          user_agent?: string | null
        }
        Update: {
          action_details?: Json
          actor_id?: string | null
          anomaly_flags?: Json | null
          compliance_tags?: string[] | null
          created_at?: string
          current_hash?: string | null
          event_timestamp?: string
          event_type?: Database["public"]["Enums"]["audit_event_type"]
          id?: string
          ip_address?: unknown
          location_data?: Json | null
          previous_hash?: string | null
          reason?: string | null
          resource_id?: string | null
          resource_type?: string | null
          session_id?: string | null
          severity?: Database["public"]["Enums"]["audit_severity"]
          target_id?: string | null
          user_agent?: string | null
        }
        Relationships: []
      }
      auth_tokens: {
        Row: {
          created_at: string | null
          expires_at: string
          id: string
          token_hash: string
          token_type: string
          updated_at: string | null
          used_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          expires_at: string
          id?: string
          token_hash: string
          token_type: string
          updated_at?: string | null
          used_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          expires_at?: string
          id?: string
          token_hash?: string
          token_type?: string
          updated_at?: string | null
          used_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      blog_posts: {
        Row: {
          author_bio: string | null
          author_email: string
          author_image: string | null
          author_name: string
          category: string
          content: string
          created_at: string | null
          excerpt: string | null
          featured_image: string | null
          id: string
          meta_description: string | null
          published_at: string | null
          read_time: number | null
          scheduled_for: string | null
          slug: string
          social_image: string | null
          status: string | null
          tags: string[] | null
          title: string
          updated_at: string | null
          view_count: number | null
        }
        Insert: {
          author_bio?: string | null
          author_email: string
          author_image?: string | null
          author_name: string
          category: string
          content: string
          created_at?: string | null
          excerpt?: string | null
          featured_image?: string | null
          id?: string
          meta_description?: string | null
          published_at?: string | null
          read_time?: number | null
          scheduled_for?: string | null
          slug: string
          social_image?: string | null
          status?: string | null
          tags?: string[] | null
          title: string
          updated_at?: string | null
          view_count?: number | null
        }
        Update: {
          author_bio?: string | null
          author_email?: string
          author_image?: string | null
          author_name?: string
          category?: string
          content?: string
          created_at?: string | null
          excerpt?: string | null
          featured_image?: string | null
          id?: string
          meta_description?: string | null
          published_at?: string | null
          read_time?: number | null
          scheduled_for?: string | null
          slug?: string
          social_image?: string | null
          status?: string | null
          tags?: string[] | null
          title?: string
          updated_at?: string | null
          view_count?: number | null
        }
        Relationships: []
      }
      bookings: {
        Row: {
          actual_end_date: string | null
          car_id: string
          commission_amount: number | null
          commission_status: string | null
          created_at: string
          early_return: boolean | null
          end_date: string
          end_time: string | null
          host_preparation_completed: boolean | null
          id: string
          is_test_booking: boolean | null
          latitude: number | null
          longitude: number | null
          preparation_reminder_sent: boolean | null
          renter_id: string
          renter_preparation_completed: boolean | null
          start_date: string
          start_time: string | null
          status: Database["public"]["Enums"]["booking_status"]
          total_price: number
          updated_at: string
        }
        Insert: {
          actual_end_date?: string | null
          car_id: string
          commission_amount?: number | null
          commission_status?: string | null
          created_at?: string
          early_return?: boolean | null
          end_date: string
          end_time?: string | null
          host_preparation_completed?: boolean | null
          id?: string
          is_test_booking?: boolean | null
          latitude?: number | null
          longitude?: number | null
          preparation_reminder_sent?: boolean | null
          renter_id: string
          renter_preparation_completed?: boolean | null
          start_date: string
          start_time?: string | null
          status?: Database["public"]["Enums"]["booking_status"]
          total_price: number
          updated_at?: string
        }
        Update: {
          actual_end_date?: string | null
          car_id?: string
          commission_amount?: number | null
          commission_status?: string | null
          created_at?: string
          early_return?: boolean | null
          end_date?: string
          end_time?: string | null
          host_preparation_completed?: boolean | null
          id?: string
          is_test_booking?: boolean | null
          latitude?: number | null
          longitude?: number | null
          preparation_reminder_sent?: boolean | null
          renter_id?: string
          renter_preparation_completed?: boolean | null
          start_date?: string
          start_time?: string | null
          status?: Database["public"]["Enums"]["booking_status"]
          total_price?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "bookings_car_id_fkey"
            columns: ["car_id"]
            isOneToOne: false
            referencedRelation: "cars"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_renter_id_fkey"
            columns: ["renter_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      car_images: {
        Row: {
          car_id: string
          created_at: string
          id: string
          image_url: string
          is_primary: boolean | null
          updated_at: string
        }
        Insert: {
          car_id: string
          created_at?: string
          id?: string
          image_url: string
          is_primary?: boolean | null
          updated_at?: string
        }
        Update: {
          car_id?: string
          created_at?: string
          id?: string
          image_url?: string
          is_primary?: boolean | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "car_images_car_id_fkey"
            columns: ["car_id"]
            isOneToOne: false
            referencedRelation: "cars"
            referencedColumns: ["id"]
          },
        ]
      }
      cars: {
        Row: {
          brand: string
          created_at: string
          description: string | null
          features: string[] | null
          fuel: string
          id: string
          image_url: string | null
          is_available: boolean | null
          is_sharing_location: boolean | null
          last_location_update: string | null
          latitude: number | null
          location: string
          location_sharing_scope: string | null
          longitude: number | null
          model: string
          owner_id: string
          price_per_day: number
          seats: number
          transmission: string
          updated_at: string
          vehicle_type: Database["public"]["Enums"]["vehicle_type"]
          year: number
        }
        Insert: {
          brand: string
          created_at?: string
          description?: string | null
          features?: string[] | null
          fuel: string
          id?: string
          image_url?: string | null
          is_available?: boolean | null
          is_sharing_location?: boolean | null
          last_location_update?: string | null
          latitude?: number | null
          location: string
          location_sharing_scope?: string | null
          longitude?: number | null
          model: string
          owner_id: string
          price_per_day: number
          seats: number
          transmission: string
          updated_at?: string
          vehicle_type: Database["public"]["Enums"]["vehicle_type"]
          year: number
        }
        Update: {
          brand?: string
          created_at?: string
          description?: string | null
          features?: string[] | null
          fuel?: string
          id?: string
          image_url?: string | null
          is_available?: boolean | null
          is_sharing_location?: boolean | null
          last_location_update?: string | null
          latitude?: number | null
          location?: string
          location_sharing_scope?: string | null
          longitude?: number | null
          model?: string
          owner_id?: string
          price_per_day?: number
          seats?: number
          transmission?: string
          updated_at?: string
          vehicle_type?: Database["public"]["Enums"]["vehicle_type"]
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "cars_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      commission_rates: {
        Row: {
          created_at: string
          effective_from: string
          effective_until: string | null
          id: string
          rate: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          effective_from?: string
          effective_until?: string | null
          id?: string
          rate?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          effective_from?: string
          effective_until?: string | null
          id?: string
          rate?: number
          updated_at?: string
        }
        Relationships: []
      }
      conversation_messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string
          delivered_at: string | null
          delivery_status: Database["public"]["Enums"]["message_delivery_status"]
          edited: boolean | null
          edited_at: string | null
          encrypted_content: string | null
          encryption_key_id: string | null
          id: string
          is_encrypted: boolean | null
          message_type: string
          metadata: Json | null
          read_at: string | null
          related_car_id: string | null
          reply_to_message_id: string | null
          sender_id: string
          sent_at: string
          updated_at: string
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string
          delivered_at?: string | null
          delivery_status?: Database["public"]["Enums"]["message_delivery_status"]
          edited?: boolean | null
          edited_at?: string | null
          encrypted_content?: string | null
          encryption_key_id?: string | null
          id?: string
          is_encrypted?: boolean | null
          message_type?: string
          metadata?: Json | null
          read_at?: string | null
          related_car_id?: string | null
          reply_to_message_id?: string | null
          sender_id: string
          sent_at?: string
          updated_at?: string
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string
          delivered_at?: string | null
          delivery_status?: Database["public"]["Enums"]["message_delivery_status"]
          edited?: boolean | null
          edited_at?: string | null
          encrypted_content?: string | null
          encryption_key_id?: string | null
          id?: string
          is_encrypted?: boolean | null
          message_type?: string
          metadata?: Json | null
          read_at?: string | null
          related_car_id?: string | null
          reply_to_message_id?: string | null
          sender_id?: string
          sent_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversation_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversation_messages_related_car_id_fkey"
            columns: ["related_car_id"]
            isOneToOne: false
            referencedRelation: "cars"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversation_messages_reply_to_message_id_fkey"
            columns: ["reply_to_message_id"]
            isOneToOne: false
            referencedRelation: "conversation_messages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversation_messages_reply_to_message_id_fkey"
            columns: ["reply_to_message_id"]
            isOneToOne: false
            referencedRelation: "conversation_messages_with_replies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversation_messages_reply_to_message_id_fkey"
            columns: ["reply_to_message_id"]
            isOneToOne: false
            referencedRelation: "conversation_messages_with_replies"
            referencedColumns: ["reply_original_id"]
          },
          {
            foreignKeyName: "fk_conversation_messages_sender_id"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      conversation_participants: {
        Row: {
          conversation_id: string
          id: string
          is_admin: boolean | null
          joined_at: string
          last_read_at: string | null
          user_id: string
        }
        Insert: {
          conversation_id: string
          id?: string
          is_admin?: boolean | null
          joined_at?: string
          last_read_at?: string | null
          user_id: string
        }
        Update: {
          conversation_id?: string
          id?: string
          is_admin?: boolean | null
          joined_at?: string
          last_read_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversation_participants_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversation_participants_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      conversations: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          last_message_at: string | null
          title: string | null
          type: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          last_message_at?: string | null
          title?: string | null
          type?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          last_message_at?: string | null
          title?: string | null
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversations_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      device_tokens: {
        Row: {
          created_at: string | null
          device_info: Json | null
          device_token: string
          device_type: string
          id: string
          is_active: boolean | null
          last_used_at: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          device_info?: Json | null
          device_token: string
          device_type: string
          id?: string
          is_active?: boolean | null
          last_used_at?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          device_info?: Json | null
          device_token?: string
          device_type?: string
          id?: string
          is_active?: boolean | null
          last_used_at?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      documents: {
        Row: {
          created_at: string
          document_type: string
          file_url: string
          id: string
          rejection_reason: string | null
          status: Database["public"]["Enums"]["document_status"]
          updated_at: string
          uploaded_at: string
          user_id: string
          verified_at: string | null
          verified_by: string | null
        }
        Insert: {
          created_at?: string
          document_type: string
          file_url: string
          id?: string
          rejection_reason?: string | null
          status?: Database["public"]["Enums"]["document_status"]
          updated_at?: string
          uploaded_at?: string
          user_id: string
          verified_at?: string | null
          verified_by?: string | null
        }
        Update: {
          created_at?: string
          document_type?: string
          file_url?: string
          id?: string
          rejection_reason?: string | null
          status?: Database["public"]["Enums"]["document_status"]
          updated_at?: string
          uploaded_at?: string
          user_id?: string
          verified_at?: string | null
          verified_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "documents_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_verified_by_fkey"
            columns: ["verified_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      email_analytics_daily: {
        Row: {
          average_latency_ms: number | null
          bounce_rate: number | null
          click_rate: number | null
          complaint_rate: number | null
          created_at: string | null
          date: string
          delivery_rate: number | null
          id: string
          open_rate: number | null
          provider: string
          template_id: string | null
          total_bounced: number | null
          total_clicked: number | null
          total_complained: number | null
          total_delivered: number | null
          total_failed: number | null
          total_opened: number | null
          total_sent: number | null
          updated_at: string | null
        }
        Insert: {
          average_latency_ms?: number | null
          bounce_rate?: number | null
          click_rate?: number | null
          complaint_rate?: number | null
          created_at?: string | null
          date: string
          delivery_rate?: number | null
          id?: string
          open_rate?: number | null
          provider: string
          template_id?: string | null
          total_bounced?: number | null
          total_clicked?: number | null
          total_complained?: number | null
          total_delivered?: number | null
          total_failed?: number | null
          total_opened?: number | null
          total_sent?: number | null
          updated_at?: string | null
        }
        Update: {
          average_latency_ms?: number | null
          bounce_rate?: number | null
          click_rate?: number | null
          complaint_rate?: number | null
          created_at?: string | null
          date?: string
          delivery_rate?: number | null
          id?: string
          open_rate?: number | null
          provider?: string
          template_id?: string | null
          total_bounced?: number | null
          total_clicked?: number | null
          total_complained?: number | null
          total_delivered?: number | null
          total_failed?: number | null
          total_opened?: number | null
          total_sent?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      email_delivery_logs: {
        Row: {
          bounced_at: string | null
          clicked_at: string | null
          complained_at: string | null
          correlation_id: string | null
          created_at: string | null
          delivered_at: string | null
          error_message: string | null
          failed_at: string | null
          id: string
          message_id: string
          metadata: Json | null
          opened_at: string | null
          provider: string
          recipient_email: string
          retry_count: number | null
          sender_email: string
          sent_at: string | null
          status: string
          subject: string
          template_id: string | null
          updated_at: string | null
        }
        Insert: {
          bounced_at?: string | null
          clicked_at?: string | null
          complained_at?: string | null
          correlation_id?: string | null
          created_at?: string | null
          delivered_at?: string | null
          error_message?: string | null
          failed_at?: string | null
          id?: string
          message_id: string
          metadata?: Json | null
          opened_at?: string | null
          provider: string
          recipient_email: string
          retry_count?: number | null
          sender_email: string
          sent_at?: string | null
          status: string
          subject: string
          template_id?: string | null
          updated_at?: string | null
        }
        Update: {
          bounced_at?: string | null
          clicked_at?: string | null
          complained_at?: string | null
          correlation_id?: string | null
          created_at?: string | null
          delivered_at?: string | null
          error_message?: string | null
          failed_at?: string | null
          id?: string
          message_id?: string
          metadata?: Json | null
          opened_at?: string | null
          provider?: string
          recipient_email?: string
          retry_count?: number | null
          sender_email?: string
          sent_at?: string | null
          status?: string
          subject?: string
          template_id?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      email_performance_metrics: {
        Row: {
          circuit_breaker_state: string | null
          created_at: string | null
          error_message: string | null
          error_type: string | null
          fallback_used: boolean | null
          id: string
          latency_ms: number
          operation_type: string
          provider: string
          request_size_bytes: number | null
          response_size_bytes: number | null
          success: boolean
        }
        Insert: {
          circuit_breaker_state?: string | null
          created_at?: string | null
          error_message?: string | null
          error_type?: string | null
          fallback_used?: boolean | null
          id?: string
          latency_ms: number
          operation_type: string
          provider: string
          request_size_bytes?: number | null
          response_size_bytes?: number | null
          success: boolean
        }
        Update: {
          circuit_breaker_state?: string | null
          created_at?: string | null
          error_message?: string | null
          error_type?: string | null
          fallback_used?: boolean | null
          id?: string
          latency_ms?: number
          operation_type?: string
          provider?: string
          request_size_bytes?: number | null
          response_size_bytes?: number | null
          success?: boolean
        }
        Relationships: []
      }
      email_suppressions: {
        Row: {
          created_at: string | null
          email_address: string
          expires_at: string | null
          id: string
          message_id: string | null
          metadata: Json | null
          provider: string
          reason: string | null
          suppressed_at: string | null
          suppression_type: string
        }
        Insert: {
          created_at?: string | null
          email_address: string
          expires_at?: string | null
          id?: string
          message_id?: string | null
          metadata?: Json | null
          provider: string
          reason?: string | null
          suppressed_at?: string | null
          suppression_type: string
        }
        Update: {
          created_at?: string | null
          email_address?: string
          expires_at?: string | null
          id?: string
          message_id?: string | null
          metadata?: Json | null
          provider?: string
          reason?: string | null
          suppressed_at?: string | null
          suppression_type?: string
        }
        Relationships: []
      }
      email_webhook_events: {
        Row: {
          created_at: string | null
          event_timestamp: string
          event_type: string
          id: string
          message_id: string
          processed: boolean | null
          processing_error: string | null
          provider: string
          raw_payload: Json
          recipient_email: string
          webhook_received_at: string | null
        }
        Insert: {
          created_at?: string | null
          event_timestamp: string
          event_type: string
          id?: string
          message_id: string
          processed?: boolean | null
          processing_error?: string | null
          provider: string
          raw_payload: Json
          recipient_email: string
          webhook_received_at?: string | null
        }
        Update: {
          created_at?: string | null
          event_timestamp?: string
          event_type?: string
          id?: string
          message_id?: string
          processed?: boolean | null
          processing_error?: string | null
          provider?: string
          raw_payload?: Json
          recipient_email?: string
          webhook_received_at?: string | null
        }
        Relationships: []
      }
      file_encryption: {
        Row: {
          created_at: string | null
          encryption_key_encrypted: string
          file_hash: string
          file_id: string
          file_size: number
          id: string
          message_id: string | null
          mime_type: string
          original_filename: string
        }
        Insert: {
          created_at?: string | null
          encryption_key_encrypted: string
          file_hash: string
          file_id: string
          file_size: number
          id?: string
          message_id?: string | null
          mime_type: string
          original_filename: string
        }
        Update: {
          created_at?: string | null
          encryption_key_encrypted?: string
          file_hash?: string
          file_id?: string
          file_size?: number
          id?: string
          message_id?: string | null
          mime_type?: string
          original_filename?: string
        }
        Relationships: [
          {
            foreignKeyName: "file_encryption_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "conversation_messages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "file_encryption_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "conversation_messages_with_replies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "file_encryption_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "conversation_messages_with_replies"
            referencedColumns: ["reply_original_id"]
          },
        ]
      }
      guides: {
        Row: {
          content: Json
          created_at: string | null
          description: string | null
          id: string
          is_popular: boolean | null
          read_time: string | null
          role: string
          section: string
          sort_order: number | null
          title: string
          updated_at: string | null
        }
        Insert: {
          content?: Json
          created_at?: string | null
          description?: string | null
          id?: string
          is_popular?: boolean | null
          read_time?: string | null
          role: string
          section: string
          sort_order?: number | null
          title: string
          updated_at?: string | null
        }
        Update: {
          content?: Json
          created_at?: string | null
          description?: string | null
          id?: string
          is_popular?: boolean | null
          read_time?: string | null
          role?: string
          section?: string
          sort_order?: number | null
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      handover_sessions: {
        Row: {
          booking_id: string
          created_at: string | null
          handover_completed: boolean | null
          handover_type: Database["public"]["Enums"]["handover_type"]
          host_id: string
          host_location: Json | null
          host_ready: boolean | null
          id: string
          renter_id: string
          renter_location: Json | null
          renter_ready: boolean | null
          updated_at: string | null
        }
        Insert: {
          booking_id: string
          created_at?: string | null
          handover_completed?: boolean | null
          handover_type?: Database["public"]["Enums"]["handover_type"]
          host_id: string
          host_location?: Json | null
          host_ready?: boolean | null
          id?: string
          renter_id: string
          renter_location?: Json | null
          renter_ready?: boolean | null
          updated_at?: string | null
        }
        Update: {
          booking_id?: string
          created_at?: string | null
          handover_completed?: boolean | null
          handover_type?: Database["public"]["Enums"]["handover_type"]
          host_id?: string
          host_location?: Json | null
          host_ready?: boolean | null
          id?: string
          renter_id?: string
          renter_location?: Json | null
          renter_ready?: boolean | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "handover_sessions_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "handover_sessions_host_id_fkey"
            columns: ["host_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "handover_sessions_renter_id_fkey"
            columns: ["renter_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      handover_step_completion: {
        Row: {
          completed_at: string | null
          completed_by: string | null
          completion_data: Json | null
          created_at: string
          handover_session_id: string | null
          id: string
          is_completed: boolean | null
          step_name: string
          step_order: number
          updated_at: string
        }
        Insert: {
          completed_at?: string | null
          completed_by?: string | null
          completion_data?: Json | null
          created_at?: string
          handover_session_id?: string | null
          id?: string
          is_completed?: boolean | null
          step_name: string
          step_order: number
          updated_at?: string
        }
        Update: {
          completed_at?: string | null
          completed_by?: string | null
          completion_data?: Json | null
          created_at?: string
          handover_session_id?: string | null
          id?: string
          is_completed?: boolean | null
          step_name?: string
          step_order?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "handover_step_completion_completed_by_fkey"
            columns: ["completed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "handover_step_completion_handover_session_id_fkey"
            columns: ["handover_session_id"]
            isOneToOne: false
            referencedRelation: "handover_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      host_wallets: {
        Row: {
          balance: number
          created_at: string
          currency: string
          host_id: string
          id: string
          updated_at: string
        }
        Insert: {
          balance?: number
          created_at?: string
          currency?: string
          host_id: string
          id?: string
          updated_at?: string
        }
        Update: {
          balance?: number
          created_at?: string
          currency?: string
          host_id?: string
          id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "host_wallets_host_id_fkey"
            columns: ["host_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      identity_keys: {
        Row: {
          created_at: string | null
          id: string
          private_identity_key_encrypted: string
          public_identity_key: string
          registration_id: number
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          private_identity_key_encrypted: string
          public_identity_key: string
          registration_id: number
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          private_identity_key_encrypted?: string
          public_identity_key?: string
          registration_id?: number
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      identity_verification_checks: {
        Row: {
          created_at: string
          handover_session_id: string | null
          id: string
          license_photo_url: string | null
          updated_at: string
          verification_notes: string | null
          verification_photo_url: string | null
          verification_status: string | null
          verified_at: string | null
          verified_user_id: string | null
          verifier_id: string | null
        }
        Insert: {
          created_at?: string
          handover_session_id?: string | null
          id?: string
          license_photo_url?: string | null
          updated_at?: string
          verification_notes?: string | null
          verification_photo_url?: string | null
          verification_status?: string | null
          verified_at?: string | null
          verified_user_id?: string | null
          verifier_id?: string | null
        }
        Update: {
          created_at?: string
          handover_session_id?: string | null
          id?: string
          license_photo_url?: string | null
          updated_at?: string
          verification_notes?: string | null
          verification_photo_url?: string | null
          verification_status?: string | null
          verified_at?: string | null
          verified_user_id?: string | null
          verifier_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "identity_verification_checks_handover_session_id_fkey"
            columns: ["handover_session_id"]
            isOneToOne: false
            referencedRelation: "handover_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "identity_verification_checks_verified_user_id_fkey"
            columns: ["verified_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "identity_verification_checks_verifier_id_fkey"
            columns: ["verifier_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      license_verifications: {
        Row: {
          back_image_path: string | null
          country_of_issue: string | null
          created_at: string
          date_of_birth: string | null
          expiry_date: string | null
          front_image_path: string | null
          id: string
          license_number: string | null
          rejection_reason: string | null
          status: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          back_image_path?: string | null
          country_of_issue?: string | null
          created_at?: string
          date_of_birth?: string | null
          expiry_date?: string | null
          front_image_path?: string | null
          id?: string
          license_number?: string | null
          rejection_reason?: string | null
          status?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          back_image_path?: string | null
          country_of_issue?: string | null
          created_at?: string
          date_of_birth?: string | null
          expiry_date?: string | null
          front_image_path?: string | null
          id?: string
          license_number?: string | null
          rejection_reason?: string | null
          status?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "license_verifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      locations: {
        Row: {
          created_at: string
          id: string
          latitude: string | null
          longitude: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          latitude?: string | null
          longitude?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          latitude?: string | null
          longitude?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      message_operations: {
        Row: {
          created_at: string | null
          id: string
          message_id: string
          operation_data: Json | null
          operation_type: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          message_id: string
          operation_data?: Json | null
          operation_type: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          message_id?: string
          operation_data?: Json | null
          operation_type?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "message_operations_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "messages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "message_operations_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "messages_with_replies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "message_operations_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "messages_with_replies"
            referencedColumns: ["reply_to_message_id"]
          },
        ]
      }
      messages: {
        Row: {
          content: string
          created_at: string
          forwarded: boolean | null
          forwarded_at: string | null
          forwarded_from: Json | null
          id: string
          migrated_to_conversation_id: string | null
          pinned: boolean | null
          receiver_id: string
          related_car_id: string | null
          replying_to_message_id: string | null
          selected: boolean | null
          sender_id: string
          starred: boolean | null
          status: Database["public"]["Enums"]["message_status"] | null
          updated_at: string
        }
        Insert: {
          content: string
          created_at?: string
          forwarded?: boolean | null
          forwarded_at?: string | null
          forwarded_from?: Json | null
          id?: string
          migrated_to_conversation_id?: string | null
          pinned?: boolean | null
          receiver_id: string
          related_car_id?: string | null
          replying_to_message_id?: string | null
          selected?: boolean | null
          sender_id: string
          starred?: boolean | null
          status?: Database["public"]["Enums"]["message_status"] | null
          updated_at?: string
        }
        Update: {
          content?: string
          created_at?: string
          forwarded?: boolean | null
          forwarded_at?: string | null
          forwarded_from?: Json | null
          id?: string
          migrated_to_conversation_id?: string | null
          pinned?: boolean | null
          receiver_id?: string
          related_car_id?: string | null
          replying_to_message_id?: string | null
          selected?: boolean | null
          sender_id?: string
          starred?: boolean | null
          status?: Database["public"]["Enums"]["message_status"] | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_migrated_to_conversation_id_fkey"
            columns: ["migrated_to_conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_receiver_id_fkey"
            columns: ["receiver_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_related_car_id_fkey"
            columns: ["related_car_id"]
            isOneToOne: false
            referencedRelation: "cars"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_replying_to_message_id_fkey"
            columns: ["replying_to_message_id"]
            isOneToOne: false
            referencedRelation: "messages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_replying_to_message_id_fkey"
            columns: ["replying_to_message_id"]
            isOneToOne: false
            referencedRelation: "messages_with_replies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_replying_to_message_id_fkey"
            columns: ["replying_to_message_id"]
            isOneToOne: false
            referencedRelation: "messages_with_replies"
            referencedColumns: ["reply_to_message_id"]
          },
          {
            foreignKeyName: "messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      messages_backup_20250930_093926: {
        Row: {
          content: string | null
          created_at: string | null
          id: string | null
          migrated_to_conversation_id: string | null
          receiver_id: string | null
          related_car_id: string | null
          sender_id: string | null
          status: Database["public"]["Enums"]["message_status"] | null
          updated_at: string | null
        }
        Insert: {
          content?: string | null
          created_at?: string | null
          id?: string | null
          migrated_to_conversation_id?: string | null
          receiver_id?: string | null
          related_car_id?: string | null
          sender_id?: string | null
          status?: Database["public"]["Enums"]["message_status"] | null
          updated_at?: string | null
        }
        Update: {
          content?: string | null
          created_at?: string | null
          id?: string | null
          migrated_to_conversation_id?: string | null
          receiver_id?: string | null
          related_car_id?: string | null
          sender_id?: string | null
          status?: Database["public"]["Enums"]["message_status"] | null
          updated_at?: string | null
        }
        Relationships: []
      }
      notification_cleanup_log: {
        Row: {
          cleanup_details: Json | null
          created_at: string | null
          deleted_count: number
          id: number
        }
        Insert: {
          cleanup_details?: Json | null
          created_at?: string | null
          deleted_count?: number
          id?: number
        }
        Update: {
          cleanup_details?: Json | null
          created_at?: string | null
          deleted_count?: number
          id?: number
        }
        Relationships: []
      }
      notification_expiration_policies: {
        Row: {
          auto_cleanup_enabled: boolean | null
          created_at: string | null
          default_expiration_hours: number | null
          id: number
          notification_type: Database["public"]["Enums"]["notification_type"]
          updated_at: string | null
        }
        Insert: {
          auto_cleanup_enabled?: boolean | null
          created_at?: string | null
          default_expiration_hours?: number | null
          id?: number
          notification_type: Database["public"]["Enums"]["notification_type"]
          updated_at?: string | null
        }
        Update: {
          auto_cleanup_enabled?: boolean | null
          created_at?: string | null
          default_expiration_hours?: number | null
          id?: number
          notification_type?: Database["public"]["Enums"]["notification_type"]
          updated_at?: string | null
        }
        Relationships: []
      }
      notification_preferences: {
        Row: {
          booking_notifications: boolean | null
          created_at: string | null
          email_notifications: boolean | null
          id: string
          marketing_notifications: boolean | null
          notification_frequency: string | null
          payment_notifications: boolean | null
          push_notifications: boolean | null
          quiet_hours_end: string | null
          quiet_hours_start: string | null
          sms_notifications: boolean | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          booking_notifications?: boolean | null
          created_at?: string | null
          email_notifications?: boolean | null
          id?: string
          marketing_notifications?: boolean | null
          notification_frequency?: string | null
          payment_notifications?: boolean | null
          push_notifications?: boolean | null
          quiet_hours_end?: string | null
          quiet_hours_start?: string | null
          sms_notifications?: boolean | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          booking_notifications?: boolean | null
          created_at?: string | null
          email_notifications?: boolean | null
          id?: string
          marketing_notifications?: boolean | null
          notification_frequency?: string | null
          payment_notifications?: boolean | null
          push_notifications?: boolean | null
          quiet_hours_end?: string | null
          quiet_hours_start?: string | null
          sms_notifications?: boolean | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          content: string | null
          created_at: string | null
          description: string | null
          expires_at: string | null
          id: number
          is_read: boolean | null
          metadata: Json | null
          related_booking_id: string | null
          related_car_id: string | null
          role_target: Database["public"]["Enums"]["notification_role"] | null
          title: string
          type: Database["public"]["Enums"]["notification_type"]
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          content?: string | null
          created_at?: string | null
          description?: string | null
          expires_at?: string | null
          id?: never
          is_read?: boolean | null
          metadata?: Json | null
          related_booking_id?: string | null
          related_car_id?: string | null
          role_target?: Database["public"]["Enums"]["notification_role"] | null
          title: string
          type: Database["public"]["Enums"]["notification_type"]
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          content?: string | null
          created_at?: string | null
          description?: string | null
          expires_at?: string | null
          id?: never
          is_read?: boolean | null
          metadata?: Json | null
          related_booking_id?: string | null
          related_car_id?: string | null
          role_target?: Database["public"]["Enums"]["notification_role"] | null
          title?: string
          type?: Database["public"]["Enums"]["notification_type"]
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "notifications_related_booking_id_fkey"
            columns: ["related_booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_related_car_id_fkey"
            columns: ["related_car_id"]
            isOneToOne: false
            referencedRelation: "cars"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications_backup: {
        Row: {
          content: string
          created_at: string
          id: string
          is_read: boolean | null
          related_booking_id: string | null
          related_car_id: string | null
          type: Database["public"]["Enums"]["old_notification_type"]
          updated_at: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          is_read?: boolean | null
          related_booking_id?: string | null
          related_car_id?: string | null
          type: Database["public"]["Enums"]["old_notification_type"]
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          is_read?: boolean | null
          related_booking_id?: string | null
          related_car_id?: string | null
          type?: Database["public"]["Enums"]["old_notification_type"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_related_booking_id_fkey"
            columns: ["related_booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_related_car_id_fkey"
            columns: ["related_car_id"]
            isOneToOne: false
            referencedRelation: "cars"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      pending_confirmations: {
        Row: {
          created_at: string | null
          email: string
          expires_at: string
          full_name: string
          id: string
          password: string
          phone_number: string | null
          token: string
        }
        Insert: {
          created_at?: string | null
          email: string
          expires_at: string
          full_name: string
          id?: string
          password: string
          phone_number?: string | null
          token: string
        }
        Update: {
          created_at?: string | null
          email?: string
          expires_at?: string
          full_name?: string
          id?: string
          password?: string
          phone_number?: string | null
          token?: string
        }
        Relationships: []
      }
      phone_verifications: {
        Row: {
          attempt_count: number | null
          country_code: string
          expires_at: string | null
          id: string
          is_verified: boolean | null
          last_attempt_at: string | null
          phone_number: string
          user_id: string
          verification_code: string | null
          verified_at: string | null
        }
        Insert: {
          attempt_count?: number | null
          country_code: string
          expires_at?: string | null
          id?: string
          is_verified?: boolean | null
          last_attempt_at?: string | null
          phone_number: string
          user_id: string
          verification_code?: string | null
          verified_at?: string | null
        }
        Update: {
          attempt_count?: number | null
          country_code?: string
          expires_at?: string | null
          id?: string
          is_verified?: boolean | null
          last_attempt_at?: string | null
          phone_number?: string
          user_id?: string
          verification_code?: string | null
          verified_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "phone_verifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      pre_keys: {
        Row: {
          created_at: string | null
          id: string
          is_signed: boolean | null
          is_used: boolean | null
          key_id: number
          private_key_encrypted: string
          public_key: string
          signature: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_signed?: boolean | null
          is_used?: boolean | null
          key_id: number
          private_key_encrypted: string
          public_key: string
          signature?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          is_signed?: boolean | null
          is_used?: boolean | null
          key_id?: number
          private_key_encrypted?: string
          public_key?: string
          signature?: string | null
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          account_locked_until: string | null
          avatar_url: string | null
          created_at: string
          email_confirmed: boolean | null
          email_confirmed_at: string | null
          emergency_contact_name: string | null
          emergency_contact_phone: string | null
          failed_login_attempts: number | null
          full_name: string | null
          id: string
          id_photo_url: string | null
          is_sharing_location: boolean | null
          last_login_attempt: string | null
          latitude: number | null
          location_sharing_scope: string | null
          longitude: number | null
          phone_number: string | null
          role: Database["public"]["Enums"]["user_role"]
          updated_at: string
          verification_completed_at: string | null
          verification_rejected_reason: string | null
          verification_status:
            | Database["public"]["Enums"]["verification_status"]
            | null
        }
        Insert: {
          account_locked_until?: string | null
          avatar_url?: string | null
          created_at?: string
          email_confirmed?: boolean | null
          email_confirmed_at?: string | null
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          failed_login_attempts?: number | null
          full_name?: string | null
          id: string
          id_photo_url?: string | null
          is_sharing_location?: boolean | null
          last_login_attempt?: string | null
          latitude?: number | null
          location_sharing_scope?: string | null
          longitude?: number | null
          phone_number?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
          verification_completed_at?: string | null
          verification_rejected_reason?: string | null
          verification_status?:
            | Database["public"]["Enums"]["verification_status"]
            | null
        }
        Update: {
          account_locked_until?: string | null
          avatar_url?: string | null
          created_at?: string
          email_confirmed?: boolean | null
          email_confirmed_at?: string | null
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          failed_login_attempts?: number | null
          full_name?: string | null
          id?: string
          id_photo_url?: string | null
          is_sharing_location?: boolean | null
          last_login_attempt?: string | null
          latitude?: number | null
          location_sharing_scope?: string | null
          longitude?: number | null
          phone_number?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
          verification_completed_at?: string | null
          verification_rejected_reason?: string | null
          verification_status?:
            | Database["public"]["Enums"]["verification_status"]
            | null
        }
        Relationships: []
      }
      provider_health_metrics: {
        Row: {
          average_latency_ms: number | null
          circuit_breaker_state: string | null
          consecutive_failures: number | null
          created_at: string | null
          failed_requests: number | null
          health_check_status: boolean | null
          id: string
          last_failure_at: string | null
          last_success_at: string | null
          provider: string
          success_rate: number | null
          successful_requests: number | null
          total_requests: number | null
          updated_at: string | null
        }
        Insert: {
          average_latency_ms?: number | null
          circuit_breaker_state?: string | null
          consecutive_failures?: number | null
          created_at?: string | null
          failed_requests?: number | null
          health_check_status?: boolean | null
          id?: string
          last_failure_at?: string | null
          last_success_at?: string | null
          provider: string
          success_rate?: number | null
          successful_requests?: number | null
          total_requests?: number | null
          updated_at?: string | null
        }
        Update: {
          average_latency_ms?: number | null
          circuit_breaker_state?: string | null
          consecutive_failures?: number | null
          created_at?: string | null
          failed_requests?: number | null
          health_check_status?: boolean | null
          id?: string
          last_failure_at?: string | null
          last_success_at?: string | null
          provider?: string
          success_rate?: number | null
          successful_requests?: number | null
          total_requests?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      push_subscriptions: {
        Row: {
          auth: string
          created_at: string | null
          endpoint: string
          id: string
          p256dh: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          auth: string
          created_at?: string | null
          endpoint: string
          id?: string
          p256dh: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          auth?: string
          created_at?: string | null
          endpoint?: string
          id?: string
          p256dh?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      rate_limits: {
        Row: {
          action: string | null
          attempts: number | null
          created_at: string | null
          endpoint: string
          expires_at: string | null
          id: string
          identifier: string
          updated_at: string | null
          window_start: string | null
        }
        Insert: {
          action?: string | null
          attempts?: number | null
          created_at?: string | null
          endpoint: string
          expires_at?: string | null
          id?: string
          identifier: string
          updated_at?: string | null
          window_start?: string | null
        }
        Update: {
          action?: string | null
          attempts?: number | null
          created_at?: string | null
          endpoint?: string
          expires_at?: string | null
          id?: string
          identifier?: string
          updated_at?: string | null
          window_start?: string | null
        }
        Relationships: []
      }
      real_time_locations: {
        Row: {
          accuracy: number | null
          car_id: string
          created_at: string | null
          expires_at: string | null
          heading: number | null
          host_id: string
          id: string
          latitude: number
          longitude: number
          sharing_scope: string
          speed: number | null
          trip_id: string | null
        }
        Insert: {
          accuracy?: number | null
          car_id: string
          created_at?: string | null
          expires_at?: string | null
          heading?: number | null
          host_id: string
          id?: string
          latitude: number
          longitude: number
          sharing_scope?: string
          speed?: number | null
          trip_id?: string | null
        }
        Update: {
          accuracy?: number | null
          car_id?: string
          created_at?: string | null
          expires_at?: string | null
          heading?: number | null
          host_id?: string
          id?: string
          latitude?: number
          longitude?: number
          sharing_scope?: string
          speed?: number | null
          trip_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "real_time_locations_car_id_fkey"
            columns: ["car_id"]
            isOneToOne: false
            referencedRelation: "cars"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "real_time_locations_host_id_fkey"
            columns: ["host_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "real_time_locations_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
        ]
      }
      reviews: {
        Row: {
          booking_id: string | null
          car_id: string | null
          category_ratings: Json | null
          comment: string | null
          created_at: string
          id: string
          rating: number
          response: string | null
          response_at: string | null
          review_images: string[] | null
          review_type: Database["public"]["Enums"]["review_type"]
          reviewee_id: string
          reviewer_id: string
          status: string | null
          updated_at: string
        }
        Insert: {
          booking_id?: string | null
          car_id?: string | null
          category_ratings?: Json | null
          comment?: string | null
          created_at?: string
          id?: string
          rating: number
          response?: string | null
          response_at?: string | null
          review_images?: string[] | null
          review_type: Database["public"]["Enums"]["review_type"]
          reviewee_id: string
          reviewer_id: string
          status?: string | null
          updated_at?: string
        }
        Update: {
          booking_id?: string | null
          car_id?: string | null
          category_ratings?: Json | null
          comment?: string | null
          created_at?: string
          id?: string
          rating?: number
          response?: string | null
          response_at?: string | null
          review_images?: string[] | null
          review_type?: Database["public"]["Enums"]["review_type"]
          reviewee_id?: string
          reviewer_id?: string
          status?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "reviews_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_car_id_fkey"
            columns: ["car_id"]
            isOneToOne: false
            referencedRelation: "cars"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_reviewee_id_fkey"
            columns: ["reviewee_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_reviewer_id_fkey"
            columns: ["reviewer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      saved_cars: {
        Row: {
          car_id: string
          created_at: string
          id: string
          user_id: string
        }
        Insert: {
          car_id: string
          created_at?: string
          id?: string
          user_id: string
        }
        Update: {
          car_id?: string
          created_at?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "saved_cars_car_id_fkey"
            columns: ["car_id"]
            isOneToOne: false
            referencedRelation: "cars"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "saved_cars_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      signal_sessions: {
        Row: {
          contact_user_id: string
          created_at: string | null
          id: string
          identity_key: string
          one_time_pre_keys: string[] | null
          session_data: Json
          signed_pre_key: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          contact_user_id: string
          created_at?: string | null
          id?: string
          identity_key: string
          one_time_pre_keys?: string[] | null
          session_data: Json
          signed_pre_key: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          contact_user_id?: string
          created_at?: string | null
          id?: string
          identity_key?: string
          one_time_pre_keys?: string[] | null
          session_data?: Json
          signed_pre_key?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_public_keys: {
        Row: {
          created_at: string | null
          id: string
          public_key: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          public_key: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          public_key?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_restrictions: {
        Row: {
          active: boolean
          created_at: string | null
          created_by: string | null
          ends_at: string | null
          id: string
          reason: string | null
          restriction_type: Database["public"]["Enums"]["restriction_type_enum"]
          starts_at: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          active?: boolean
          created_at?: string | null
          created_by?: string | null
          ends_at?: string | null
          id?: string
          reason?: string | null
          restriction_type: Database["public"]["Enums"]["restriction_type_enum"]
          starts_at?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          active?: boolean
          created_at?: string | null
          created_by?: string | null
          ends_at?: string | null
          id?: string
          reason?: string | null
          restriction_type?: Database["public"]["Enums"]["restriction_type_enum"]
          starts_at?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_restrictions_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_verifications: {
        Row: {
          address_confirmed: boolean | null
          admin_notes: string | null
          completed_at: string | null
          current_step: Database["public"]["Enums"]["verification_step"] | null
          documents_completed: boolean | null
          id: string
          last_updated_at: string | null
          overall_status:
            | Database["public"]["Enums"]["verification_status"]
            | null
          personal_info: Json | null
          personal_info_completed: boolean | null
          phone_verified: boolean | null
          rejection_reasons: string[] | null
          selfie_completed: boolean | null
          started_at: string | null
          user_id: string
        }
        Insert: {
          address_confirmed?: boolean | null
          admin_notes?: string | null
          completed_at?: string | null
          current_step?: Database["public"]["Enums"]["verification_step"] | null
          documents_completed?: boolean | null
          id?: string
          last_updated_at?: string | null
          overall_status?:
            | Database["public"]["Enums"]["verification_status"]
            | null
          personal_info?: Json | null
          personal_info_completed?: boolean | null
          phone_verified?: boolean | null
          rejection_reasons?: string[] | null
          selfie_completed?: boolean | null
          started_at?: string | null
          user_id: string
        }
        Update: {
          address_confirmed?: boolean | null
          admin_notes?: string | null
          completed_at?: string | null
          current_step?: Database["public"]["Enums"]["verification_step"] | null
          documents_completed?: boolean | null
          id?: string
          last_updated_at?: string | null
          overall_status?:
            | Database["public"]["Enums"]["verification_status"]
            | null
          personal_info?: Json | null
          personal_info_completed?: boolean | null
          phone_verified?: boolean | null
          rejection_reasons?: string[] | null
          selfie_completed?: boolean | null
          started_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_verifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      vehicle_condition_reports: {
        Row: {
          acknowledged_at: string | null
          additional_notes: string | null
          booking_id: string | null
          car_id: string | null
          created_at: string
          damage_reports: Json | null
          digital_signature_data: string | null
          exterior_condition_notes: string | null
          fuel_level: number | null
          handover_session_id: string | null
          id: string
          interior_condition_notes: string | null
          is_acknowledged: boolean | null
          mileage: number | null
          report_type: string
          reporter_id: string | null
          updated_at: string
          vehicle_photos: Json | null
        }
        Insert: {
          acknowledged_at?: string | null
          additional_notes?: string | null
          booking_id?: string | null
          car_id?: string | null
          created_at?: string
          damage_reports?: Json | null
          digital_signature_data?: string | null
          exterior_condition_notes?: string | null
          fuel_level?: number | null
          handover_session_id?: string | null
          id?: string
          interior_condition_notes?: string | null
          is_acknowledged?: boolean | null
          mileage?: number | null
          report_type: string
          reporter_id?: string | null
          updated_at?: string
          vehicle_photos?: Json | null
        }
        Update: {
          acknowledged_at?: string | null
          additional_notes?: string | null
          booking_id?: string | null
          car_id?: string | null
          created_at?: string
          damage_reports?: Json | null
          digital_signature_data?: string | null
          exterior_condition_notes?: string | null
          fuel_level?: number | null
          handover_session_id?: string | null
          id?: string
          interior_condition_notes?: string | null
          is_acknowledged?: boolean | null
          mileage?: number | null
          report_type?: string
          reporter_id?: string | null
          updated_at?: string
          vehicle_photos?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "vehicle_condition_reports_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vehicle_condition_reports_car_id_fkey"
            columns: ["car_id"]
            isOneToOne: false
            referencedRelation: "cars"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vehicle_condition_reports_handover_session_id_fkey"
            columns: ["handover_session_id"]
            isOneToOne: false
            referencedRelation: "handover_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vehicle_condition_reports_reporter_id_fkey"
            columns: ["reporter_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      verification_address: {
        Row: {
          area_suburb: string
          city: string
          confirmation_method: Database["public"]["Enums"]["verification_method"]
          confirmed_at: string | null
          confirmed_by: string | null
          country: string
          created_at: string | null
          id: string
          is_confirmed: boolean
          postal_code: string | null
          rejection_reason: string | null
          street_address: string
          supporting_document_id: string | null
          updated_at: string | null
          validation_notes: string | null
          verification_id: string
        }
        Insert: {
          area_suburb: string
          city: string
          confirmation_method: Database["public"]["Enums"]["verification_method"]
          confirmed_at?: string | null
          confirmed_by?: string | null
          country?: string
          created_at?: string | null
          id?: string
          is_confirmed?: boolean
          postal_code?: string | null
          rejection_reason?: string | null
          street_address: string
          supporting_document_id?: string | null
          updated_at?: string | null
          validation_notes?: string | null
          verification_id: string
        }
        Update: {
          area_suburb?: string
          city?: string
          confirmation_method?: Database["public"]["Enums"]["verification_method"]
          confirmed_at?: string | null
          confirmed_by?: string | null
          country?: string
          created_at?: string | null
          id?: string
          is_confirmed?: boolean
          postal_code?: string | null
          rejection_reason?: string | null
          street_address?: string
          supporting_document_id?: string | null
          updated_at?: string | null
          validation_notes?: string | null
          verification_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "verification_address_confirmed_by_fkey"
            columns: ["confirmed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "verification_address_supporting_document_id_fkey"
            columns: ["supporting_document_id"]
            isOneToOne: false
            referencedRelation: "verification_documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "verification_address_verification_id_fkey"
            columns: ["verification_id"]
            isOneToOne: true
            referencedRelation: "user_verifications"
            referencedColumns: ["id"]
          },
        ]
      }
      verification_bypass_logs: {
        Row: {
          action: string
          additional_data: Json | null
          bypass_reason: string | null
          client_ip: string | null
          created_at: string | null
          id: string
          session_id: string | null
          user_agent: string | null
          user_id: string
        }
        Insert: {
          action: string
          additional_data?: Json | null
          bypass_reason?: string | null
          client_ip?: string | null
          created_at?: string | null
          id?: string
          session_id?: string | null
          user_agent?: string | null
          user_id: string
        }
        Update: {
          action?: string
          additional_data?: Json | null
          bypass_reason?: string | null
          client_ip?: string | null
          created_at?: string | null
          id?: string
          session_id?: string | null
          user_agent?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "verification_bypass_logs_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "verification_bypass_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      verification_bypass_sessions: {
        Row: {
          bypass_reason: string
          client_ip: string | null
          created_at: string | null
          expires_at: string
          id: string
          is_active: boolean | null
          session_token: string
          updated_at: string | null
          user_agent: string | null
          user_id: string
        }
        Insert: {
          bypass_reason: string
          client_ip?: string | null
          created_at?: string | null
          expires_at: string
          id?: string
          is_active?: boolean | null
          session_token: string
          updated_at?: string | null
          user_agent?: string | null
          user_id: string
        }
        Update: {
          bypass_reason?: string
          client_ip?: string | null
          created_at?: string | null
          expires_at?: string
          id?: string
          is_active?: boolean | null
          session_token?: string
          updated_at?: string | null
          user_agent?: string | null
          user_id?: string
        }
        Relationships: []
      }
      verification_documents: {
        Row: {
          document_number: string | null
          document_type: Database["public"]["Enums"]["document_type"]
          expiry_date: string | null
          file_name: string
          file_path: string
          file_size: number
          id: string
          rejection_reason: string | null
          status: Database["public"]["Enums"]["verification_status"] | null
          uploaded_at: string | null
          user_id: string
          verified_at: string | null
        }
        Insert: {
          document_number?: string | null
          document_type: Database["public"]["Enums"]["document_type"]
          expiry_date?: string | null
          file_name: string
          file_path: string
          file_size: number
          id?: string
          rejection_reason?: string | null
          status?: Database["public"]["Enums"]["verification_status"] | null
          uploaded_at?: string | null
          user_id: string
          verified_at?: string | null
        }
        Update: {
          document_number?: string | null
          document_type?: Database["public"]["Enums"]["document_type"]
          expiry_date?: string | null
          file_name?: string
          file_path?: string
          file_size?: number
          id?: string
          rejection_reason?: string | null
          status?: Database["public"]["Enums"]["verification_status"] | null
          uploaded_at?: string | null
          user_id?: string
          verified_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "verification_documents_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      wallet_transactions: {
        Row: {
          amount: number
          balance_after: number
          balance_before: number
          booking_id: string | null
          booking_reference: string | null
          commission_rate: number | null
          created_at: string
          description: string | null
          id: string
          payment_method: string | null
          payment_reference: string | null
          status: string
          transaction_type: string
          updated_at: string
          wallet_id: string
        }
        Insert: {
          amount: number
          balance_after: number
          balance_before: number
          booking_id?: string | null
          booking_reference?: string | null
          commission_rate?: number | null
          created_at?: string
          description?: string | null
          id?: string
          payment_method?: string | null
          payment_reference?: string | null
          status?: string
          transaction_type: string
          updated_at?: string
          wallet_id: string
        }
        Update: {
          amount?: number
          balance_after?: number
          balance_before?: number
          booking_id?: string | null
          booking_reference?: string | null
          commission_rate?: number | null
          created_at?: string
          description?: string | null
          id?: string
          payment_method?: string | null
          payment_reference?: string | null
          status?: string
          transaction_type?: string
          updated_at?: string
          wallet_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "wallet_transactions_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wallet_transactions_wallet_id_fkey"
            columns: ["wallet_id"]
            isOneToOne: false
            referencedRelation: "host_wallets"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      audit_analytics: {
        Row: {
          compliance_tags: string[] | null
          date: string | null
          event_count: number | null
          event_type: Database["public"]["Enums"]["audit_event_type"] | null
          severity: Database["public"]["Enums"]["audit_severity"] | null
          unique_actors: number | null
          unique_targets: number | null
        }
        Relationships: []
      }
      conversation_messages_with_replies: {
        Row: {
          content: string | null
          conversation_id: string | null
          created_at: string | null
          delivered_at: string | null
          delivery_status:
            | Database["public"]["Enums"]["message_delivery_status"]
            | null
          edited: boolean | null
          edited_at: string | null
          encrypted_content: string | null
          encryption_key_id: string | null
          id: string | null
          is_encrypted: boolean | null
          message_type: string | null
          metadata: Json | null
          read_at: string | null
          related_car_id: string | null
          reply_count: number | null
          reply_original_id: string | null
          reply_to_content: string | null
          reply_to_created_at: string | null
          reply_to_message_id: string | null
          reply_to_message_type: string | null
          reply_to_preview: string | null
          reply_to_sender_id: string | null
          sender_id: string | null
          sent_at: string | null
          updated_at: string | null
        }
        Relationships: [
          {
            foreignKeyName: "conversation_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversation_messages_related_car_id_fkey"
            columns: ["related_car_id"]
            isOneToOne: false
            referencedRelation: "cars"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversation_messages_reply_to_message_id_fkey"
            columns: ["reply_to_message_id"]
            isOneToOne: false
            referencedRelation: "conversation_messages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversation_messages_reply_to_message_id_fkey"
            columns: ["reply_to_message_id"]
            isOneToOne: false
            referencedRelation: "conversation_messages_with_replies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversation_messages_reply_to_message_id_fkey"
            columns: ["reply_to_message_id"]
            isOneToOne: false
            referencedRelation: "conversation_messages_with_replies"
            referencedColumns: ["reply_original_id"]
          },
          {
            foreignKeyName: "fk_conversation_messages_sender_id"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_conversation_messages_sender_id"
            columns: ["reply_to_sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      email_analytics_summary: {
        Row: {
          avg_bounce_rate: number | null
          avg_click_rate: number | null
          avg_complaint_rate: number | null
          avg_delivery_rate: number | null
          avg_latency_ms: number | null
          avg_open_rate: number | null
          month: string | null
          provider: string | null
          total_bounced: number | null
          total_clicked: number | null
          total_complained: number | null
          total_delivered: number | null
          total_failed: number | null
          total_opened: number | null
          total_sent: number | null
        }
        Relationships: []
      }
      messages_with_replies: {
        Row: {
          content: string | null
          created_at: string | null
          id: string | null
          migrated_to_conversation_id: string | null
          receiver_id: string | null
          related_car_id: string | null
          reply_count: number | null
          reply_to_content: string | null
          reply_to_created_at: string | null
          reply_to_message_id: string | null
          reply_to_sender_id: string | null
          replying_to_message_id: string | null
          sender_id: string | null
          status: Database["public"]["Enums"]["message_status"] | null
          updated_at: string | null
        }
        Relationships: [
          {
            foreignKeyName: "messages_migrated_to_conversation_id_fkey"
            columns: ["migrated_to_conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_receiver_id_fkey"
            columns: ["receiver_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_related_car_id_fkey"
            columns: ["related_car_id"]
            isOneToOne: false
            referencedRelation: "cars"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_replying_to_message_id_fkey"
            columns: ["replying_to_message_id"]
            isOneToOne: false
            referencedRelation: "messages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_replying_to_message_id_fkey"
            columns: ["replying_to_message_id"]
            isOneToOne: false
            referencedRelation: "messages_with_replies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_replying_to_message_id_fkey"
            columns: ["replying_to_message_id"]
            isOneToOne: false
            referencedRelation: "messages_with_replies"
            referencedColumns: ["reply_to_message_id"]
          },
          {
            foreignKeyName: "messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_sender_id_fkey"
            columns: ["reply_to_sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      provider_performance_summary: {
        Row: {
          average_latency_ms: number | null
          circuit_breaker_state: string | null
          consecutive_failures: number | null
          health_check_status: boolean | null
          last_failure_at: string | null
          last_success_at: string | null
          provider: string | null
          recent_events_24h: number | null
          success_rate: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      analyze_conversation_query_performance: {
        Args: never
        Returns: {
          estimated_cost: number
          index_usage: string
          query_type: string
          recommendations: string
          table_name: string
        }[]
      }
      auth_uid_test: {
        Args: never
        Returns: {
          current_user_id: string
          is_authenticated: boolean
          session_info: string
        }[]
      }
      bytea_to_text: { Args: { data: string }; Returns: string }
      calculate_car_rating: { Args: { car_uuid: string }; Returns: number }
      calculate_category_ratings: { Args: { car_uuid: string }; Returns: Json }
      calculate_commission: {
        Args: { booking_total: number; rate?: number }
        Returns: number
      }
      calculate_handover_progress: {
        Args: { handover_session_id_param: string }
        Returns: Json
      }
      calculate_user_rating: { Args: { user_uuid: string }; Returns: number }
      check_column_exists: {
        Args: { column_name: string; table_name: string }
        Returns: boolean
      }
      check_conversation_access: {
        Args: { p_conversation_id: string; p_user_id?: string }
        Returns: boolean
      }
      check_host_wallet_balance: {
        Args: { host_uuid: string; required_commission: number }
        Returns: boolean
      }
      check_verification_completion: {
        Args: { user_uuid: string }
        Returns: boolean
      }
      cleanup_expired_admin_sessions: { Args: never; Returns: undefined }
      cleanup_expired_bypass_sessions: { Args: never; Returns: number }
      cleanup_expired_confirmations: { Args: never; Returns: undefined }
      cleanup_expired_notifications_enhanced: {
        Args: never
        Returns: {
          cleanup_details: Json
          expired_by_policy: number
          expired_by_timestamp: number
          total_deleted: number
        }[]
      }
      cleanup_expired_tokens: { Args: never; Returns: undefined }
      cleanup_rate_limits: { Args: never; Returns: undefined }
      cleanup_verification_temp: {
        Args: never
        Returns: {
          deleted_count: number
          error_message: string
        }[]
      }
      count_unread_notifications: { Args: never; Returns: number }
      create_booking_notification:
        | {
            Args: {
              p_booking_id: string
              p_description: string
              p_host_notification_type: Database["public"]["Enums"]["notification_type"]
              p_metadata?: Json
              p_renter_notification_type: Database["public"]["Enums"]["notification_type"]
              p_title: string
            }
            Returns: undefined
          }
        | {
            Args: {
              p_booking_id: string
              p_description: string
              p_host_notification_type: Database["public"]["Enums"]["notification_type"]
              p_metadata?: Json
              p_renter_notification_type: Database["public"]["Enums"]["notification_type"]
              p_role_target?: Database["public"]["Enums"]["notification_role"]
              p_title: string
            }
            Returns: undefined
          }
        | {
            Args: {
              p_booking_id: string
              p_content: string
              p_notification_type: string
            }
            Returns: undefined
          }
      create_check_column_function: { Args: never; Returns: undefined }
      create_conversation_secure: {
        Args: {
          p_created_by_id?: string
          p_participant_ids?: string[]
          p_title?: string
          p_type?: string
        }
        Returns: Json
      }
      create_conversation_with_participants: {
        Args: {
          p_created_by: string
          p_participant_ids: string[]
          p_title?: string
          p_type?: string
        }
        Returns: {
          created_at: string
          created_by: string
          id: string
          title: string
          type: string
          updated_at: string
        }[]
      }
      create_handover_notification:
        | {
            Args: {
              p_car_brand: string
              p_car_model: string
              p_handover_type: string
              p_location: string
              p_progress_percentage?: number
              p_status?: string
              p_step_name?: string
              p_user_id: string
            }
            Returns: number
          }
        | {
            Args: {
              p_booking_id: string
              p_handover_type: string
              p_location?: string
              p_user_id: string
            }
            Returns: undefined
          }
      create_handover_progress_notification:
        | {
            Args: {
              p_completed_steps: number
              p_handover_session_id: string
              p_total_steps: number
            }
            Returns: number
          }
        | { Args: { p_handover_session_id: string }; Returns: undefined }
      create_handover_step_notification:
        | {
            Args: {
              p_handover_session_id: string
              p_step_name: string
              p_step_status: string
            }
            Returns: number
          }
        | {
            Args: {
              p_completed_by: string
              p_handover_session_id: string
              p_step_name: string
            }
            Returns: undefined
          }
      create_message_notification: {
        Args: {
          p_message_preview?: string
          p_recipient_id: string
          p_sender_name: string
        }
        Returns: undefined
      }
      create_navigation_notification: {
        Args: {
          p_booking_id: string
          p_location_data?: Json
          p_notification_type: string
          p_user_id: string
        }
        Returns: undefined
      }
      create_notification_with_expiration: {
        Args: {
          p_content?: string
          p_custom_expiration_hours?: number
          p_description?: string
          p_metadata?: Json
          p_priority?: number
          p_related_booking_id?: string
          p_related_car_id?: string
          p_related_user_id?: string
          p_role_target?: Database["public"]["Enums"]["notification_role"]
          p_title?: string
          p_type: Database["public"]["Enums"]["notification_type"]
          p_user_id: string
        }
        Returns: number
      }
      create_payment_notification: {
        Args: {
          p_amount: number
          p_booking_id?: string
          p_description?: string
          p_payment_type: string
          p_user_id: string
        }
        Returns: undefined
      }
      create_renter_arrival_notification: {
        Args: { p_booking_id: string; p_renter_id: string }
        Returns: string
      }
      create_system_notification: {
        Args: {
          p_description: string
          p_metadata?: Json
          p_title: string
          p_user_id: string
        }
        Returns: undefined
      }
      create_wallet_notification:
        | {
            Args: {
              p_amount: number
              p_description?: string
              p_host_id: string
              p_type: string
            }
            Returns: undefined
          }
        | {
            Args: {
              p_description: string
              p_metadata?: Json
              p_role_target?: Database["public"]["Enums"]["notification_role"]
              p_title: string
              p_type: Database["public"]["Enums"]["notification_type"]
              p_user_id: string
              p_wallet_transaction_id: string
            }
            Returns: undefined
          }
      delete_old_notifications: {
        Args: { p_days_old?: number }
        Returns: number
      }
      generate_audit_hash: {
        Args: {
          action_details: Json
          actor_id: string
          event_timestamp: string
          event_type: Database["public"]["Enums"]["audit_event_type"]
          previous_hash?: string
          target_id: string
        }
        Returns: string
      }
      get_bypass_statistics: {
        Args: { p_end_date?: string; p_start_date?: string }
        Returns: {
          active_sessions: number
          avg_session_duration: unknown
          expired_sessions: number
          most_common_reason: string
          total_sessions: number
          unique_users: number
        }[]
      }
      get_conversation_messages: {
        Args: { p_conversation_id: string; p_user_id?: string }
        Returns: {
          content: string
          created_at: string
          id: string
          sender_id: string
          updated_at: string
        }[]
      }
      get_notification_expiration_info: {
        Args: {
          p_notification_type: Database["public"]["Enums"]["notification_type"]
        }
        Returns: {
          auto_cleanup_enabled: boolean
          default_expiration_hours: number
          estimated_expiration: string
          notification_type: Database["public"]["Enums"]["notification_type"]
        }[]
      }
      get_public_profile: {
        Args: { user_uuid: string }
        Returns: {
          avatar_url: string
          full_name: string
          id: string
        }[]
      }
      get_reply_chain: {
        Args: { p_max_depth?: number; p_message_id: string }
        Returns: {
          content: string
          conversation_id: string
          created_at: string
          depth: number
          message_id: string
          reply_to_message_id: string
          sender_id: string
        }[]
      }
      get_reply_counts: {
        Args: { conversation_id_param: string; message_ids: string[] }
        Returns: {
          message_id: string
          reply_count: number
        }[]
      }
      get_user_conversations:
        | {
            Args: {
              p_page?: number
              p_page_size?: number
              p_search_term?: string
            }
            Returns: {
              conversation_id: string
              last_message: string
              last_message_at: string
              participants: Json
              title: string
              type: string
            }[]
          }
        | {
            Args: { p_user_id?: string }
            Returns: {
              conversation_id: string
              created_at: string
              is_creator: boolean
              is_participant: boolean
              title: string
              updated_at: string
            }[]
          }
      get_user_email_for_notification: {
        Args: { user_uuid: string }
        Returns: string
      }
      get_user_notifications: {
        Args: { p_only_unread?: boolean; p_page?: number; p_page_size?: number }
        Returns: {
          created_at: string
          description: string
          expires_at: string
          id: number
          is_read: boolean
          metadata: Json
          role_target: Database["public"]["Enums"]["notification_role"]
          title: string
          type: Database["public"]["Enums"]["notification_type"]
        }[]
      }
      get_user_push_subscriptions: {
        Args: { user_id: string }
        Returns: {
          auth: string
          created_at: string
          endpoint: string
          id: string
          p256dh: string
        }[]
      }
      get_user_review_stats: { Args: { user_uuid: string }; Returns: Json }
      handle_new_user: { Args: { user_id?: string }; Returns: Json }
      has_active_bypass_session: {
        Args: { p_user_id: string }
        Returns: boolean
      }
      http: {
        Args: { request: Database["public"]["CompositeTypes"]["http_request"] }
        Returns: Database["public"]["CompositeTypes"]["http_response"]
        SetofOptions: {
          from: "http_request"
          to: "http_response"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      http_delete:
        | {
            Args: { uri: string }
            Returns: Database["public"]["CompositeTypes"]["http_response"]
            SetofOptions: {
              from: "*"
              to: "http_response"
              isOneToOne: true
              isSetofReturn: false
            }
          }
        | {
            Args: { content: string; content_type: string; uri: string }
            Returns: Database["public"]["CompositeTypes"]["http_response"]
            SetofOptions: {
              from: "*"
              to: "http_response"
              isOneToOne: true
              isSetofReturn: false
            }
          }
      http_get:
        | {
            Args: { uri: string }
            Returns: Database["public"]["CompositeTypes"]["http_response"]
            SetofOptions: {
              from: "*"
              to: "http_response"
              isOneToOne: true
              isSetofReturn: false
            }
          }
        | {
            Args: { data: Json; uri: string }
            Returns: Database["public"]["CompositeTypes"]["http_response"]
            SetofOptions: {
              from: "*"
              to: "http_response"
              isOneToOne: true
              isSetofReturn: false
            }
          }
      http_head: {
        Args: { uri: string }
        Returns: Database["public"]["CompositeTypes"]["http_response"]
        SetofOptions: {
          from: "*"
          to: "http_response"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      http_header: {
        Args: { field: string; value: string }
        Returns: Database["public"]["CompositeTypes"]["http_header"]
        SetofOptions: {
          from: "*"
          to: "http_header"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      http_list_curlopt: {
        Args: never
        Returns: {
          curlopt: string
          value: string
        }[]
      }
      http_patch: {
        Args: { content: string; content_type: string; uri: string }
        Returns: Database["public"]["CompositeTypes"]["http_response"]
        SetofOptions: {
          from: "*"
          to: "http_response"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      http_post:
        | {
            Args: { content: string; content_type: string; uri: string }
            Returns: Database["public"]["CompositeTypes"]["http_response"]
            SetofOptions: {
              from: "*"
              to: "http_response"
              isOneToOne: true
              isSetofReturn: false
            }
          }
        | {
            Args: { data: Json; uri: string }
            Returns: Database["public"]["CompositeTypes"]["http_response"]
            SetofOptions: {
              from: "*"
              to: "http_response"
              isOneToOne: true
              isSetofReturn: false
            }
          }
      http_put: {
        Args: { content: string; content_type: string; uri: string }
        Returns: Database["public"]["CompositeTypes"]["http_response"]
        SetofOptions: {
          from: "*"
          to: "http_response"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      http_reset_curlopt: { Args: never; Returns: boolean }
      http_set_curlopt: {
        Args: { curlopt: string; value: string }
        Returns: boolean
      }
      initialize_conversation: {
        Args: {
          p_participant_ids?: string[]
          p_title?: string
          p_type?: string
        }
        Returns: string
      }
      is_admin:
        | { Args: { user_uuid: string }; Returns: boolean }
        | { Args: never; Returns: boolean }
      is_conversation_admin: {
        Args: { _conversation_id: string; _user_id: string }
        Returns: boolean
      }
      is_conversation_creator: {
        Args: { _conversation_id: string; _user_id: string }
        Returns: boolean
      }
      is_conversation_participant: {
        Args: { _conversation_id: string; _user_id: string }
        Returns: boolean
      }
      log_admin_activity:
        | {
            Args: {
              p_action: string
              p_admin_id: string
              p_details?: Json
              p_resource_id?: string
              p_resource_type?: string
            }
            Returns: undefined
          }
        | {
            Args: {
              p_action: string
              p_admin_id: string
              p_details?: Json
              p_resource_id?: string
              p_resource_type?: string
            }
            Returns: undefined
          }
      log_audit_event: {
        Args: {
          p_action_details?: Json
          p_actor_id?: string
          p_anomaly_flags?: Json
          p_compliance_tags?: string[]
          p_event_type: Database["public"]["Enums"]["audit_event_type"]
          p_ip_address?: unknown
          p_location_data?: Json
          p_reason?: string
          p_resource_id?: string
          p_resource_type?: string
          p_session_id?: string
          p_severity?: Database["public"]["Enums"]["audit_severity"]
          p_target_id?: string
          p_user_agent?: string
        }
        Returns: string
      }
      mark_notifications_read: {
        Args: { p_notification_ids: number[] }
        Returns: number
      }
      migrate_legacy_messages: { Args: never; Returns: undefined }
      migrate_legacy_messages_to_conversations: {
        Args: never
        Returns: undefined
      }
      save_push_subscription: {
        Args: {
          auth_key: string
          endpoint: string
          p256dh_key: string
          user_id: string
        }
        Returns: undefined
      }
      send_conversation_message: {
        Args: {
          p_content: string
          p_conversation_id: string
          p_message_type?: string
          p_metadata?: Json
          p_related_car_id?: string
          p_reply_to_message_id?: string
        }
        Returns: Json
      }
      text_to_bytea: { Args: { data: string }; Returns: string }
      toggle_message_reaction: {
        Args: { p_emoji: string; p_message_id: string }
        Returns: Json
      }
      update_notification_expiration_policy: {
        Args: {
          p_auto_cleanup_enabled?: boolean
          p_expiration_hours?: number
          p_notification_type: Database["public"]["Enums"]["notification_type"]
        }
        Returns: boolean
      }
      update_user_location: {
        Args: { lat: number; lng: number; user_id: string }
        Returns: boolean
      }
      update_verification_step: {
        Args: {
          new_step: Database["public"]["Enums"]["verification_step"]
          user_uuid: string
        }
        Returns: boolean
      }
      urlencode:
        | { Args: { data: Json }; Returns: string }
        | {
            Args: { string: string }
            Returns: {
              error: true
            } & "Could not choose the best candidate function between: public.urlencode(string => bytea), public.urlencode(string => varchar). Try renaming the parameters or the function itself in the database so function overloading can be resolved"
          }
        | {
            Args: { string: string }
            Returns: {
              error: true
            } & "Could not choose the best candidate function between: public.urlencode(string => bytea), public.urlencode(string => varchar). Try renaming the parameters or the function itself in the database so function overloading can be resolved"
          }
      user_owns_verification: {
        Args: { verification_uuid: string }
        Returns: boolean
      }
      validate_admin_session: {
        Args: { p_session_token: string }
        Returns: boolean
      }
      validate_conversation_access: {
        Args: { p_conversation_id: string; p_user_id?: string }
        Returns: Json
      }
      validate_step_dependencies: {
        Args: {
          handover_session_id_param: string
          step_name_param: string
          step_order_param: number
        }
        Returns: boolean
      }
      verify_audit_chain_integrity: {
        Args: never
        Returns: {
          actual_hash: string
          audit_id: string
          chain_valid: boolean
          event_timestamp: string
          expected_hash: string
        }[]
      }
      verify_conversation_policies: {
        Args: never
        Returns: {
          details: string
          status: string
          test_name: string
        }[]
      }
      verify_no_recursion_policies: {
        Args: never
        Returns: {
          has_cross_references: boolean
          policy_count: number
          table_name: string
        }[]
      }
      verify_no_recursive_policies: {
        Args: never
        Returns: {
          policy_definition: string
          policy_name: string
          table_name: string
        }[]
      }
    }
    Enums: {
      audit_event_type:
        | "user_restriction_created"
        | "user_restriction_updated"
        | "user_restriction_removed"
        | "user_deleted"
        | "user_password_reset"
        | "vehicle_transferred"
        | "vehicle_deleted"
        | "admin_login"
        | "admin_logout"
        | "system_config_changed"
        | "notification_campaign_created"
        | "notification_sent"
        | "verification_approved"
        | "verification_rejected"
        | "booking_cancelled_admin"
        | "payment_refunded_admin"
      audit_severity: "low" | "medium" | "high" | "critical"
      booking_status:
        | "pending"
        | "confirmed"
        | "cancelled"
        | "completed"
        | "expired"
      document_status: "pending" | "verified" | "rejected"
      document_type:
        | "national_id_front"
        | "national_id_back"
        | "driving_license_front"
        | "driving_license_back"
        | "proof_of_address"
        | "vehicle_registration"
        | "vehicle_ownership"
        | "proof_of_income"
        | "selfie_photo"
      handover_type: "pickup" | "return"
      message_delivery_status: "sent" | "delivered" | "read"
      message_status: "sent" | "delivered" | "read"
      notification_role: "host_only" | "renter_only" | "system_wide"
      notification_type:
        | "booking_request_received"
        | "booking_request_sent"
        | "booking_confirmed_host"
        | "booking_confirmed_renter"
        | "booking_cancelled_host"
        | "booking_cancelled_renter"
        | "pickup_reminder_host"
        | "pickup_reminder_renter"
        | "return_reminder_host"
        | "return_reminder_renter"
        | "wallet_topup"
        | "wallet_deduction"
        | "message_received"
        | "handover_ready"
        | "payment_received"
        | "payment_failed"
        | "system_notification"
        | "navigation_started"
        | "pickup_location_shared"
        | "return_location_shared"
        | "arrival_notification"
        | "early_return_notification"
        | "pickup_reminder"
        | "return_reminder"
      old_notification_type:
        | "booking_cancelled"
        | "booking_confirmed"
        | "booking_request"
        | "message_received"
        | "booking_reminder"
        | "wallet_topup"
        | "wallet_deduction"
        | "handover_ready"
        | "payment_received"
        | "payment_failed"
        | "booking_request_sent"
        | "pickup_reminder"
        | "return_reminder"
      restriction_type_enum:
        | "login_block"
        | "booking_block"
        | "messaging_block"
        | "suspension"
      review_type: "car" | "renter" | "host_to_renter" | "renter_to_host"
      user_role: "host" | "renter" | "admin" | "super_admin"
      vehicle_type:
        | "Basic"
        | "Standard"
        | "Executive"
        | "4x4"
        | "SUV"
        | "Electric"
        | "Exotic"
      verification_method: "document" | "utility_bill" | "bank_statement"
      verification_status:
        | "not_started"
        | "in_progress"
        | "completed"
        | "failed"
        | "rejected"
        | "pending_review"
      verification_step:
        | "personal_info"
        | "document_upload"
        | "selfie_verification"
        | "phone_verification"
        | "address_confirmation"
        | "review_submit"
        | "processing_status"
        | "completion"
        | "ADDRESS_CONFIRMATION"
    }
    CompositeTypes: {
      http_header: {
        field: string | null
        value: string | null
      }
      http_request: {
        method: unknown
        uri: string | null
        headers: Database["public"]["CompositeTypes"]["http_header"][] | null
        content_type: string | null
        content: string | null
      }
      http_response: {
        status: number | null
        content_type: string | null
        headers: Database["public"]["CompositeTypes"]["http_header"][] | null
        content: string | null
      }
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
      audit_event_type: [
        "user_restriction_created",
        "user_restriction_updated",
        "user_restriction_removed",
        "user_deleted",
        "user_password_reset",
        "vehicle_transferred",
        "vehicle_deleted",
        "admin_login",
        "admin_logout",
        "system_config_changed",
        "notification_campaign_created",
        "notification_sent",
        "verification_approved",
        "verification_rejected",
        "booking_cancelled_admin",
        "payment_refunded_admin",
      ],
      audit_severity: ["low", "medium", "high", "critical"],
      booking_status: [
        "pending",
        "confirmed",
        "cancelled",
        "completed",
        "expired",
      ],
      document_status: ["pending", "verified", "rejected"],
      document_type: [
        "national_id_front",
        "national_id_back",
        "driving_license_front",
        "driving_license_back",
        "proof_of_address",
        "vehicle_registration",
        "vehicle_ownership",
        "proof_of_income",
        "selfie_photo",
      ],
      handover_type: ["pickup", "return"],
      message_delivery_status: ["sent", "delivered", "read"],
      message_status: ["sent", "delivered", "read"],
      notification_role: ["host_only", "renter_only", "system_wide"],
      notification_type: [
        "booking_request_received",
        "booking_request_sent",
        "booking_confirmed_host",
        "booking_confirmed_renter",
        "booking_cancelled_host",
        "booking_cancelled_renter",
        "pickup_reminder_host",
        "pickup_reminder_renter",
        "return_reminder_host",
        "return_reminder_renter",
        "wallet_topup",
        "wallet_deduction",
        "message_received",
        "handover_ready",
        "payment_received",
        "payment_failed",
        "system_notification",
        "navigation_started",
        "pickup_location_shared",
        "return_location_shared",
        "arrival_notification",
        "early_return_notification",
        "pickup_reminder",
        "return_reminder",
      ],
      old_notification_type: [
        "booking_cancelled",
        "booking_confirmed",
        "booking_request",
        "message_received",
        "booking_reminder",
        "wallet_topup",
        "wallet_deduction",
        "handover_ready",
        "payment_received",
        "payment_failed",
        "booking_request_sent",
        "pickup_reminder",
        "return_reminder",
      ],
      restriction_type_enum: [
        "login_block",
        "booking_block",
        "messaging_block",
        "suspension",
      ],
      review_type: ["car", "renter", "host_to_renter", "renter_to_host"],
      user_role: ["host", "renter", "admin", "super_admin"],
      vehicle_type: [
        "Basic",
        "Standard",
        "Executive",
        "4x4",
        "SUV",
        "Electric",
        "Exotic",
      ],
      verification_method: ["document", "utility_bill", "bank_statement"],
      verification_status: [
        "not_started",
        "in_progress",
        "completed",
        "failed",
        "rejected",
        "pending_review",
      ],
      verification_step: [
        "personal_info",
        "document_upload",
        "selfie_verification",
        "phone_verification",
        "address_confirmation",
        "review_submit",
        "processing_status",
        "completion",
        "ADDRESS_CONFIRMATION",
      ],
    },
  },
} as const

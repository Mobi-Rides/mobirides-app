export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      admins: {
        Row: {
          created_at: string
          email: string
          full_name: string | null
          id: string
          is_super_admin: boolean | null
          last_sign_in_at: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          email: string
          full_name?: string | null
          id: string
          is_super_admin?: boolean | null
          last_sign_in_at?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string
          full_name?: string | null
          id?: string
          is_super_admin?: boolean | null
          last_sign_in_at?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      bookings: {
        Row: {
          car_id: string
          commission_amount: number | null
          commission_status: string | null
          created_at: string
          end_date: string
          host_preparation_completed: boolean | null
          id: string
          latitude: number | null
          longitude: number | null
          preparation_reminder_sent: boolean | null
          renter_id: string
          renter_preparation_completed: boolean | null
          start_date: string
          status: Database["public"]["Enums"]["booking_status"]
          total_price: number
          updated_at: string
        }
        Insert: {
          car_id: string
          commission_amount?: number | null
          commission_status?: string | null
          created_at?: string
          end_date: string
          host_preparation_completed?: boolean | null
          id?: string
          latitude?: number | null
          longitude?: number | null
          preparation_reminder_sent?: boolean | null
          renter_id: string
          renter_preparation_completed?: boolean | null
          start_date: string
          status?: Database["public"]["Enums"]["booking_status"]
          total_price: number
          updated_at?: string
        }
        Update: {
          car_id?: string
          commission_amount?: number | null
          commission_status?: string | null
          created_at?: string
          end_date?: string
          host_preparation_completed?: boolean | null
          id?: string
          latitude?: number | null
          longitude?: number | null
          preparation_reminder_sent?: boolean | null
          renter_id?: string
          renter_preparation_completed?: boolean | null
          start_date?: string
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
          latitude: number | null
          location: string
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
          latitude?: number | null
          location: string
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
          latitude?: number | null
          location?: string
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
      handover_sessions: {
        Row: {
          booking_id: string
          created_at: string | null
          handover_completed: boolean | null
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
      messages: {
        Row: {
          content: string
          created_at: string
          id: string
          receiver_id: string
          related_car_id: string | null
          sender_id: string
          status: Database["public"]["Enums"]["message_status"] | null
          updated_at: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          receiver_id: string
          related_car_id?: string | null
          sender_id: string
          status?: Database["public"]["Enums"]["message_status"] | null
          updated_at?: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          receiver_id?: string
          related_car_id?: string | null
          sender_id?: string
          status?: Database["public"]["Enums"]["message_status"] | null
          updated_at?: string
        }
        Relationships: [
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
            foreignKeyName: "messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          content: string
          created_at: string
          id: string
          is_read: boolean | null
          related_booking_id: string | null
          related_car_id: string | null
          type: Database["public"]["Enums"]["notification_type"]
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
          type: Database["public"]["Enums"]["notification_type"]
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
          type?: Database["public"]["Enums"]["notification_type"]
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
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          emergency_contact_name: string | null
          emergency_contact_phone: string | null
          full_name: string | null
          id: string
          id_photo_url: string | null
          is_sharing_location: boolean | null
          latitude: number | null
          location_sharing_scope: string | null
          longitude: number | null
          phone_number: string | null
          role: Database["public"]["Enums"]["user_role"]
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          full_name?: string | null
          id: string
          id_photo_url?: string | null
          is_sharing_location?: boolean | null
          latitude?: number | null
          location_sharing_scope?: string | null
          longitude?: number | null
          phone_number?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          full_name?: string | null
          id?: string
          id_photo_url?: string | null
          is_sharing_location?: boolean | null
          latitude?: number | null
          location_sharing_scope?: string | null
          longitude?: number | null
          phone_number?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
        }
        Relationships: []
      }
      reviews: {
        Row: {
          booking_id: string | null
          car_id: string | null
          comment: string | null
          created_at: string
          id: string
          rating: number
          review_type: Database["public"]["Enums"]["review_type"]
          reviewee_id: string
          reviewer_id: string
          updated_at: string
        }
        Insert: {
          booking_id?: string | null
          car_id?: string | null
          comment?: string | null
          created_at?: string
          id?: string
          rating: number
          review_type: Database["public"]["Enums"]["review_type"]
          reviewee_id: string
          reviewer_id: string
          updated_at?: string
        }
        Update: {
          booking_id?: string | null
          car_id?: string | null
          comment?: string | null
          created_at?: string
          id?: string
          rating?: number
          review_type?: Database["public"]["Enums"]["review_type"]
          reviewee_id?: string
          reviewer_id?: string
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
      user_verifications: {
        Row: {
          address_confirmed: boolean | null
          admin_notes: string | null
          completed_at: string | null
          created_at: string
          current_step: string
          documents_completed: boolean | null
          id: string
          last_updated_at: string
          overall_status: string
          personal_info: Json | null
          personal_info_completed: boolean | null
          phone_verified: boolean | null
          rejection_reasons: string[] | null
          selfie_completed: boolean | null
          user_id: string
          user_role: string
        }
        Insert: {
          address_confirmed?: boolean | null
          admin_notes?: string | null
          completed_at?: string | null
          created_at?: string
          current_step?: string
          documents_completed?: boolean | null
          id?: string
          last_updated_at?: string
          overall_status?: string
          personal_info?: Json | null
          personal_info_completed?: boolean | null
          phone_verified?: boolean | null
          rejection_reasons?: string[] | null
          selfie_completed?: boolean | null
          user_id: string
          user_role?: string
        }
        Update: {
          address_confirmed?: boolean | null
          admin_notes?: string | null
          completed_at?: string | null
          created_at?: string
          current_step?: string
          documents_completed?: boolean | null
          id?: string
          last_updated_at?: string
          overall_status?: string
          personal_info?: Json | null
          personal_info_completed?: boolean | null
          phone_verified?: boolean | null
          rejection_reasons?: string[] | null
          selfie_completed?: boolean | null
          user_id?: string
          user_role?: string
        }
        Relationships: []
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
      [_ in never]: never
    }
    Functions: {
      calculate_car_rating: {
        Args: { car_uuid: string }
        Returns: number
      }
      calculate_commission: {
        Args: { booking_total: number; rate?: number }
        Returns: number
      }
      calculate_user_rating: {
        Args: { user_uuid: string }
        Returns: number
      }
      check_host_wallet_balance: {
        Args: { host_uuid: string; required_commission: number }
        Returns: boolean
      }
    }
    Enums: {
      booking_status:
        | "pending"
        | "confirmed"
        | "cancelled"
        | "completed"
        | "expired"
      message_status: "sent" | "delivered" | "read"
      notification_type:
        | "booking_cancelled"
        | "booking_confirmed"
        | "booking_request"
        | "message_received"
        | "booking_reminder"
      review_type: "car" | "renter"
      user_role: "host" | "renter"
      vehicle_type:
        | "Basic"
        | "Standard"
        | "Executive"
        | "4x4"
        | "SUV"
        | "Electric"
        | "Exotic"
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
      booking_status: [
        "pending",
        "confirmed",
        "cancelled",
        "completed",
        "expired",
      ],
      message_status: ["sent", "delivered", "read"],
      notification_type: [
        "booking_cancelled",
        "booking_confirmed",
        "booking_request",
        "message_received",
        "booking_reminder",
      ],
      review_type: ["car", "renter"],
      user_role: ["host", "renter"],
      vehicle_type: [
        "Basic",
        "Standard",
        "Executive",
        "4x4",
        "SUV",
        "Electric",
        "Exotic",
      ],
    },
  },
} as const

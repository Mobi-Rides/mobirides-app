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
          id: string
          latitude: number | null
          longitude: number | null
          renter_id: string
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
          id?: string
          latitude?: number | null
          longitude?: number | null
          renter_id: string
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
          id?: string
          latitude?: number | null
          longitude?: number | null
          renter_id?: string
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
          full_name: string | null
          id: string
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
          full_name?: string | null
          id: string
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
          full_name?: string | null
          id?: string
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

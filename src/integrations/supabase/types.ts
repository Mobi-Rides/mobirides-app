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
      bookings: {
        Row: {
          car_id: string
          created_at: string
          end_date: string
          id: string
          renter_id: string
          start_date: string
          status: Database["public"]["Enums"]["booking_status"]
          total_price: number
          updated_at: string
        }
        Insert: {
          car_id: string
          created_at?: string
          end_date: string
          id?: string
          renter_id: string
          start_date: string
          status?: Database["public"]["Enums"]["booking_status"]
          total_price: number
          updated_at?: string
        }
        Update: {
          car_id?: string
          created_at?: string
          end_date?: string
          id?: string
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
          registration_url: string | null
          insurance_url: string | null
          additional_docs_urls: string[] | null
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
          registration_url?: string | null
          insurance_url?: string | null
          additional_docs_urls?: string[] | null
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
          registration_url?: string | null
          insurance_url?: string | null
          additional_docs_urls?: string[] | null
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
          role: Database["public"]["Enums"]["user_role"]
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id: string
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
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
          updated_at: string
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
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      calculate_car_rating: {
        Args: {
          car_uuid: string
        }
        Returns: number
      }
      calculate_user_rating: {
        Args: {
          user_uuid: string
        }
        Returns: number
      }
    }
    Enums: {
      booking_status: "pending" | "confirmed" | "cancelled" | "completed"
      message_status: "sent" | "delivered" | "read"
      notification_type:
        | "booking_cancelled"
        | "booking_confirmed"
        | "booking_request"
        | "message_received"
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

export interface Brand {
  id: string;
  name: string;
  logo_url: string;
  created_at: string;
  updated_at: string;
}

export const defaultBrands: Brand[] = [
  {
    id: "1",
    name: "Mercedes",
    logo_url: "/lovable-uploads/20b26fd6-f9f4-41a4-92ad-fa89b23d550a.png",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: "2", 
    name: "Range Rover",
    logo_url: "/lovable-uploads/5d0fc73a-ec2c-49fd-9df9-c3830953bff2.png",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: "3",
    name: "BMW",
    logo_url: "/lovable-uploads/48a404b4-eb67-41a1-a871-1aac9e63b593.png",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: "4",
    name: "Ford",
    logo_url: "/lovable-uploads/ae1ca97d-b526-4528-aee1-ded897ae8104.png",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: "5",
    name: "Toyota",
    logo_url: "/lovable-uploads/a4381118-18b6-449d-b488-361109d8fe18.png",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: "6",
    name: "Mazda",
    logo_url: "/lovable-uploads/58c1573d-83c6-4203-a665-c5d46b8babd8.png",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: "7",
    name: "Nissan",
    logo_url: "/lovable-uploads/33445c94-40ae-4ebd-94e7-8946c1f0fea7.png",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: "8",
    name: "Volkswagen",
    logo_url: "/lovable-uploads/4c2133f4-1dcb-40ba-93ad-942445cfb8c7.png",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: "9",
    name: "Honda",
    logo_url: "/lovable-uploads/68572b00-e59e-40d5-b244-51d908224722.png",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: "10",
    name: "Audi",
    logo_url: "/lovable-uploads/574a84d0-4eb3-4bf9-bc39-d352211f4e36.png",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
];

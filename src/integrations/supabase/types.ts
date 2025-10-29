export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          full_name: string | null
          emergency_contact_name: string | null
          emergency_contact_phone: string | null
        }
        Insert: {
          id: string
          full_name?: string | null
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
        }
        Update: {
          full_name?: string | null
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
        }
      }
      user_verifications: {
        Row: {
          id: string
          user_id: string
          personal_info: {
            dateOfBirth?: string
            nationalIdNumber?: string
            emergencyContact?: {
              name?: string
              phoneNumber?: string
            }
            address?: unknown
          } | null
          last_updated_at: string | null
        }
        Insert: {
          user_id: string
          personal_info?: Database["public"]["Tables"]["user_verifications"]["Row"]["personal_info"]
          last_updated_at?: string | null
        }
        Update: {
          personal_info?: Database["public"]["Tables"]["user_verifications"]["Row"]["personal_info"]
          last_updated_at?: string | null
        }
      }
      user_restrictions: {
        Row: {
          id: number
          user_id: string
          active: boolean
          reason: string | null
          created_at: string
          expires_at: string | null
        }
        Insert: {
          user_id: string
          active?: boolean
          reason?: string | null
          created_at?: string
          expires_at?: string | null
        }
        Update: {
          active?: boolean
          reason?: string | null
          expires_at?: string | null
        }
      }
      cars: {
        Row: {
          id: string
          brand: string
          model: string
          year: number
          price_per_day: number
          location: string
          is_available: boolean
          created_at: string
          owner_id: string
          description: string | null
          transmission: string | null
          fuel: string | null
          seats: number | null
          vehicle_type: Database["public"]["Enums"]["vehicle_type"] | null
          rating: number | null
          features: string[] | null
          image_url: string | null
          latitude: number | null
          longitude: number | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          brand: string
          model: string
          year: number
          price_per_day: number
          location: string
          is_available?: boolean
          created_at?: string
          owner_id: string
          description?: string | null
          transmission?: string | null
          fuel?: string | null
          seats?: number | null
          vehicle_type?: Database["public"]["Enums"]["vehicle_type"] | null
          rating?: number | null
          features?: string[] | null
          image_url?: string | null
          latitude?: number | null
          longitude?: number | null
          updated_at?: string | null
        }
        Update: {
          brand?: string
          model?: string
          year?: number
          price_per_day?: number
          location?: string
          is_available?: boolean
          created_at?: string
          owner_id?: string
          description?: string | null
          transmission?: string | null
          fuel?: string | null
          seats?: number | null
          vehicle_type?: Database["public"]["Enums"]["vehicle_type"] | null
          rating?: number | null
          features?: string[] | null
          image_url?: string | null
          latitude?: number | null
          longitude?: number | null
          updated_at?: string | null
        }
      }
    }
    Views: {}
    Functions: {}
    Enums: {
      vehicle_type: string
    }
  }
}
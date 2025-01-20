export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type UserRole = "host" | "renter"

export interface Profile {
  avatar_url: string | null
  created_at: string
  full_name: string | null
  id: string
  role: UserRole
  updated_at: string
}
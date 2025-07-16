// src/types/profile.ts
import { Database } from "@/integrations/supabase/types";

export interface Profile {
  id: string;
  full_name: string | null;
  email: string | null;
  // Add any other properties your profile has, e.g.,
  // avatar_url: string | null;
  // role: 'renter' | 'host' | 'admin'; // If you store roles
}

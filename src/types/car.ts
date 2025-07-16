import { Database } from "@/integrations/supabase/types";
import { Profile } from './profile'; // Assuming Profile type is used for owner_profile

export type Car = Database["public"]["Tables"]["cars"]["Row"] & {
  isSaved?: boolean;
  owner_profile?: Profile | null; // This property is present when you do `cars(owner_profile(*))`
  // New specification fields
  engine_size?: string | null;
  horsepower?: string | null;
  mileage?: number | null;
  color?: string | null;
  doors?: number | null;
  fuel_efficiency?: string | null;
  max_speed?: string | null;
  acceleration?: string | null;
  weight?: string | null;
  length?: string | null;
  width?: string | null;
  height?: string | null;
  trunk_capacity?: string | null;
  ground_clearance?: string | null;
  warranty?: string | null;
  maintenance_history?: string | null;
};

export interface CarQueryResponse {
  data: Car[];
  nextPage: number | undefined;
  count: number | null;
}
// src/types/car.ts


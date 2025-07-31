import { Database } from "@/integrations/supabase/types";

// Original type from Supabase
export type Car = Database["public"]["Tables"]["cars"]["Row"] & {
  isSaved?: boolean;
};

// SafeCar type with guaranteed non-null values
export interface SafeCar {
  id: string;
  brand: string;
  model: string;
  year: number;
  price_per_day: number;
  location: string;
  transmission: string;
  fuel: string;
  seats: number;
  vehicle_type: Database["public"]["Enums"]["vehicle_type"];
  description: string;
  features: string[];
  image_url: string;
  latitude: number;
  longitude: number;
  is_available: boolean;
  owner_id: string;
  created_at: string;
  updated_at: string;
  isSaved?: boolean;
}

// Utility function to convert Car to SafeCar with defaults
// Enhanced toSafeCar function with better validation
export const toSafeCar = (car: Car): SafeCar => {
  if (!car || typeof car !== 'object') {
    throw new Error('Invalid car object provided to toSafeCar');
  }
  
  return {
    ...car,
    description: car.description ?? "No description available",
    features: car.features ?? [],
    image_url: car.image_url ?? "/placeholder-car.jpg",
    latitude: car.latitude ?? 0,
    longitude: car.longitude ?? 0,
    is_available: car.is_available ?? true,
  };
};

// Type guard for Car
export const isValidCar = (car: any): car is Car => {
  return car && 
    typeof car.id === 'string' && 
    typeof car.brand === 'string' && 
    typeof car.model === 'string' &&
    typeof car.price_per_day === 'number';
};

export interface CarQueryResponse {
  data: Car[];
  nextPage: number | undefined;
  count: number | null;
}
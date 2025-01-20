import type { Database } from "@/integrations/supabase/types";

export type Car = Database["public"]["Tables"]["cars"]["Row"];
export type CarInsert = Database["public"]["Tables"]["cars"]["Insert"];
export type CarUpdate = Database["public"]["Tables"]["cars"]["Update"];

export type CarImage = Database["public"]["Tables"]["car_images"]["Row"];
export type CarImageInsert = Database["public"]["Tables"]["car_images"]["Insert"];
export type CarImageUpdate = Database["public"]["Tables"]["car_images"]["Update"];

export type SavedCar = Database["public"]["Tables"]["saved_cars"]["Row"];
export type SavedCarInsert = Database["public"]["Tables"]["saved_cars"]["Insert"];
export type SavedCarUpdate = Database["public"]["Tables"]["saved_cars"]["Update"];
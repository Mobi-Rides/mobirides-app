import { supabase } from "@/integrations/supabase/client";
import { BaseService, ApiResponse } from "./BaseService";
import { Car } from "@/types/car";

export interface CarWithDetails extends Car {
  profiles: {
    id: string;
    full_name: string | null;
    avatar_url: string | null;
  };
  car_images: Array<{
    id: string;
    image_url: string;
    is_primary: boolean;
  }>;
  reviews?: Array<{
    id: string;
    rating: number;
    comment: string | null;
    reviewer_id: string;
  }>;
}

export interface CarFilters {
  brand?: string;
  vehicleType?: string;
  priceRange?: [number, number];
  location?: string;
  features?: string[];
  availability?: boolean;
}

export class CarService extends BaseService {
  // Get all cars with filters
  static async getCars(filters?: CarFilters): Promise<ApiResponse<CarWithDetails[]>> {
    return this.handleRequest(async () => {
      let query = supabase
        .from("cars")
        .select(`
          *,
          profiles!cars_owner_id_fkey (
            id,
            full_name,
            avatar_url
          ),
          car_images (
            id,
            image_url,
            is_primary
          ),
          reviews (
            id,
            rating,
            comment,
            reviewer_id
          )
        `);

      // Apply filters
      if (filters?.brand) {
        query = query.ilike("brand", `%${filters.brand}%`);
      }

      if (filters?.vehicleType) {
        query = query.eq("vehicle_type", filters.vehicleType as any);
      }

      if (filters?.location) {
        query = query.ilike("location", `%${filters.location}%`);
      }

      if (filters?.availability !== undefined) {
        query = query.eq("is_available", filters.availability);
      }

      if (filters?.priceRange) {
        query = query
          .gte("price_per_day", filters.priceRange[0])
          .lte("price_per_day", filters.priceRange[1]);
      }

      const { data, error } = await query.order("created_at", { ascending: false });

      return { data: data || [], error };
    });
  }

  // Get car by ID
  static async getCarById(carId: string): Promise<ApiResponse<CarWithDetails>> {
    return this.handleRequest(async () => {
      const { data, error } = await supabase
        .from("cars")
        .select(`
          *,
          profiles!cars_owner_id_fkey (
            id,
            full_name,
            avatar_url
          ),
          car_images (
            id,
            image_url,
            is_primary
          ),
          reviews (
            id,
            rating,
            comment,
            reviewer_id
          )
        `)
        .eq("id", carId)
        .single();

      return { data, error };
    });
  }

  // Get cars by owner
  static async getCarsByOwner(ownerId: string): Promise<ApiResponse<CarWithDetails[]>> {
    return this.handleRequest(async () => {
      const { data, error } = await supabase
        .from("cars")
        .select(`
          *,
          profiles!cars_owner_id_fkey (
            id,
            full_name,
            avatar_url
          ),
          car_images (
            id,
            image_url,
            is_primary
          ),
          reviews (
            id,
            rating,
            comment,
            reviewer_id
          )
        `)
        .eq("owner_id", ownerId)
        .order("created_at", { ascending: false });

      return { data: data || [], error };
    });
  }

  // Update car availability
  static async updateCarAvailability(carId: string, isAvailable: boolean): Promise<ApiResponse<void>> {
    return this.handleRequest(async () => {
      const { data, error } = await supabase
        .from("cars")
        .update({ is_available: isAvailable })
        .eq("id", carId);

      return { data, error };
    });
  }

  // Get saved cars for user
  static async getSavedCars(userId: string): Promise<ApiResponse<CarWithDetails[]>> {
    return this.handleRequest(async () => {
      const { data, error } = await supabase
        .from("saved_cars")
        .select(`
          cars (
            *,
            profiles!cars_owner_id_fkey (
              id,
              full_name,
              avatar_url
            ),
            car_images (
              id,
              image_url,
              is_primary
            ),
            reviews (
              id,
              rating,
              comment,
              reviewer_id
            )
          )
        `)
        .eq("user_id", userId);

      return { data: data?.map(item => item.cars).filter(Boolean) || [], error };
    });
  }
}
import { supabase } from "@/integrations/supabase/client";
import { BaseService, ApiResponse } from "./BaseService";
import { Booking, BookingStatus } from "@/types/booking";

export interface BookingWithDetails {
  id: string;
  created_at: string;
  updated_at: string;
  start_date: string;
  end_date: string;
  total_price: number;
  status: BookingStatus;
  car_id: string;
  renter_id: string;
  commission_amount?: number;
  commission_status?: string;
  cars: {
    id: string;
    brand: string;
    model: string;
    image_url: string | null;
    owner_id: string;
    location: string;
    price_per_day: number;
  } | null;
  profiles: {
    id: string;
    full_name: string | null;
    avatar_url: string | null;
  } | null;
  reviews?: Array<{
    id: string;
    rating: number;
    comment: string | null;
  }>;
}

export class BookingService extends BaseService {
  // Get bookings for a renter
  static async getRenterBookings(renterId: string): Promise<ApiResponse<BookingWithDetails[]>> {
    return this.handleRequest(async () => {
      const { data, error } = await supabase
        .from("bookings")
        .select(`
          *,
          cars (
            id,
            brand,
            model,
            image_url,
            owner_id,
            location,
            price_per_day
          ),
          profiles!bookings_renter_id_fkey (
            id,
            full_name,
            avatar_url
          ),
          reviews (
            id,
            rating,
            comment
          )
        `)
        .eq("renter_id", renterId)
        .order("created_at", { ascending: false });

      return { data: data || [], error };
    });
  }

  // Get bookings for a host
  static async getHostBookings(hostId: string): Promise<ApiResponse<BookingWithDetails[]>> {
    return this.handleRequest(async () => {
      const { data, error } = await supabase
        .from("bookings")
        .select(`
          *,
          cars!inner (
            id,
            brand,
            model,
            image_url,
            owner_id,
            location,
            price_per_day
          ),
          profiles!bookings_renter_id_fkey (
            id,
            full_name,
            avatar_url
          ),
          reviews (
            id,
            rating,
            comment
          )
        `)
        .eq("cars.owner_id", hostId)
        .order("created_at", { ascending: false });

      return { data: data || [], error };
    });
  }

  // Cancel a booking
  static async cancelBooking(bookingId: string): Promise<ApiResponse<void>> {
    return this.handleRequest(async () => {
      const { data, error } = await supabase
        .from("bookings")
        .update({ status: "cancelled" })
        .eq("id", bookingId);

      return { data, error };
    });
  }

  // Approve a booking
  static async approveBooking(bookingId: string): Promise<ApiResponse<void>> {
    return this.handleRequest(async () => {
      const { data, error } = await supabase
        .from("bookings")
        .update({ status: "confirmed" })
        .eq("id", bookingId);

      return { data, error };
    });
  }

  // Decline a booking
  static async declineBooking(bookingId: string): Promise<ApiResponse<void>> {
    return this.handleRequest(async () => {
      const { data, error } = await supabase
        .from("bookings")
        .update({ status: "cancelled" })
        .eq("id", bookingId);

      return { data, error };
    });
  }

  // Get booking by ID
  static async getBookingById(bookingId: string): Promise<ApiResponse<BookingWithDetails>> {
    return this.handleRequest(async () => {
      const { data, error } = await supabase
        .from("bookings")
        .select(`
          *,
          cars (
            id,
            brand,
            model,
            image_url,
            owner_id,
            location,
            price_per_day
          ),
          profiles!bookings_renter_id_fkey (
            id,
            full_name,
            avatar_url
          ),
          reviews (
            id,
            rating,
            comment
          )
        `)
        .eq("id", bookingId)
        .single();

      return { data, error };
    });
  }
}
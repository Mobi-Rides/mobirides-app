export interface BookingWithRelations {
  id: string;
  start_date: string;
  end_date: string;
  status: string;
  car_id: string;
  renter_id?: string;
  total_price: number;
  pickup_latitude?: number;
  pickup_longitude?: number;
  cars: {
    brand: string;
    model: string;
    location: string;
    image_url: string;
    owner_id: string;
    price_per_day: number;
  };
  renter?: {
    full_name: string;
  };
  reviews?: {
    id: string;
  }[];
}

// Adding this type to resolve the import errors
export interface Booking extends BookingWithRelations {
  // Base booking interface with the same properties
}

// Add this enum for notifications related to bookings
export enum BookingNotificationType {
  BOOKING_REQUEST = "booking_request",
  BOOKING_CONFIRMATION = "booking_confirmation", 
  BOOKING_CANCELLATION = "booking_cancellation",
  BOOKING_REMINDER = "booking_reminder"
}

// Add this enum for booking statuses
export type BookingStatus =
  | "pending"
  | "confirmed"
  | "in_progress"
  | "completed"
  | "cancelled"
  | "expired";


// Add this enum for handover types
export enum HandoverType {
  PICKUP = "pickup",
  RETURN = "return"
}

// Add this type for location data
export enum LocationType {
  DEFAULT = "default",
  CUSTOM = "custom",
  CURRENT = "current"
}

export interface LocationData {
  type: LocationType;
  latitude: number;
  longitude: number;
}

// src/types/booking.ts

// Define a type for the profile structure used in joins
export interface Profile {
  full_name: string;
  // Add other profile fields if you fetch them, e.g., 'avatar_url'
}

// Define the Car type, including the owner_profile nested within it
export interface Car {
  brand: string;
  model: string;
  image_url: string;
  owner_id: string;
  location: string;
  price_per_day: number;
  // This is the aliased owner_profile from your Supabase query
  owner_profile: Profile | null; // Use '| null' because RLS might make it null
}

// Define the main Booking type
export interface Booking {
  id: string;
  created_at: string;
  updated_at: string;
  start_date: string;
  end_date: string;
  total_price: number;
  status: BookingStatus; // Use the BookingStatus enum
  car_id: string;
  renter_id: string;
  // Add any other direct fields from the 'bookings' table

  // Relations (as joined in your Supabase query)
  cars: Car | null; // Crucial: 'cars' can be null if RLS or data integrity prevents joining
  reviews: Array<{ id: string }> | null; // Reviews can be an empty array or null
  // This is the aliased renters profile from your Supabase query
  renters: Profile | null; // Use '| null' because RLS might make it null
}

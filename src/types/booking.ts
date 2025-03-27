
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
export enum BookingStatus {
  PENDING = "pending",
  CONFIRMED = "confirmed",
  CANCELLED = "cancelled",
  COMPLETED = "completed",
  EXPIRED = "expired"
}

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

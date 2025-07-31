
export interface BookingWithRelations {
  id: string;
  start_date: string;
  end_date: string;
  start_time?: string;
  end_time?: string;
  status: string;
  car_id: string;
  renter_id?: string;
  total_price: number;
  pickup_latitude?: number;
  pickup_longitude?: number;
  created_at: string;
  cars: {
    brand: string;
    model: string;
    location: string;
    image_url: string;
    owner_id: string;
    price_per_day: number;
    description?: string;
    year?: number;
    owner?: {
      id: string;
      full_name: string;
      avatar_url?: string;
    };
  };
  renter?: {
    id: string;
    full_name: string;
    avatar_url?: string;
    phone_number?: string;
  };
  reviews?: {
    id: string;
  }[];
  handover_sessions?: {
    id: string;
    handover_completed: boolean;
    created_at: string;
    handover_step_completion?: {
      step_name: string;
      is_completed: boolean;
      step_order: number;
    }[];
  }[];
}

// Export Booking type alias for components
export type Booking = BookingWithRelations;


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


// Type for the minimal car data we're selecting in the bookings query
type BookingCar = {
  brand: string;
  model: string;
  image_url: string | null;
  owner_id: string;
  location: string;
  price_per_day: number;
};

// Type for review data
type BookingReview = {
  id: string;
};

export interface Booking {
  id: string;
  car_id: string;
  renter_id: string;
  start_date: string;
  end_date: string;
  total_price: number;
  status: "pending" | "confirmed" | "cancelled" | "completed";
  created_at: string;
  updated_at: string;
  cars: BookingCar;
  reviews?: BookingReview[];
}

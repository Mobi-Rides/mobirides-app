
export interface BookingWithRelations {
  id: string;
  start_date: string;
  end_date: string;
  status: string;
  car_id: string;
  renter_id?: string;
  total_price: number;
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

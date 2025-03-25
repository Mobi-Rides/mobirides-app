
export interface BookingWithRelations {
  id: string;
  start_date: string;
  end_date: string;
  status: string;
  cars: {
    brand: string;
    model: string;
    location: string;
    image_url: string;
  };
  renter?: {
    full_name: string;
  };
  reviews?: {
    id: string;
  }[];
}

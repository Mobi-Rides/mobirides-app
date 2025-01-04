import { Car } from "./car";

export interface Booking {
  id: string;
  car_id: string;
  renter_id: string;
  start_date: string;
  end_date: string;
  total_price: number;
  status: "pending" | "approved" | "cancelled" | "completed";
  created_at: string;
  updated_at: string;
  cars: Car;
}
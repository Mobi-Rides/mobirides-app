
import { supabase } from "@/integrations/supabase/client";
import { format, isWithinInterval, parseISO } from "date-fns";

/**
 * Checks if a car is available for a specified date range
 */
export const checkCarAvailability = async (
  carId: string,
  startDate: Date,
  endDate: Date,
  excludeBookingId?: string
): Promise<boolean> => {
  try {
    // Query for any confirmed bookings that overlap with the requested date range
    let query = supabase
      .from("bookings")
      .select("*")
      .eq("car_id", carId)
      .in("status", ["confirmed", "pending"]) // Check both confirmed and pending bookings
      .or(
        `and(start_date.lte.${format(endDate, "yyyy-MM-dd")},end_date.gte.${format(
          startDate,
          "yyyy-MM-dd"
        )})`
      );
    
    // If we're checking availability for an existing booking (like when updating),
    // exclude that booking from the check
    if (excludeBookingId) {
      query = query.neq("id", excludeBookingId);
    }

    const { data: overlappingBookings, error } = await query;

    if (error) {
      console.error("Error checking car availability:", error);
      return false;
    }

    // If there are any overlapping bookings, the car is not available
    return !overlappingBookings || overlappingBookings.length === 0;
  } catch (error) {
    console.error("Error in checkCarAvailability:", error);
    return false;
  }
};

/**
 * Fetches all booked dates for a car
 */
export const getBookedDates = async (carId: string): Promise<Date[]> => {
  try {
    const { data: bookings, error } = await supabase
      .from("bookings")
      .select("start_date, end_date")
      .eq("car_id", carId)
      .in("status", ["confirmed", "pending"]); // Include both confirmed and pending

    if (error) {
      console.error("Error fetching booked dates:", error);
      return [];
    }

    // Create an array of all booked dates
    const bookedDates: Date[] = [];
    
    bookings?.forEach(booking => {
      const start = parseISO(booking.start_date);
      const end = parseISO(booking.end_date);
      
      // For each day between start and end (inclusive), add to bookedDates
      const currentDate = new Date(start);
      while (currentDate <= end) {
        bookedDates.push(new Date(currentDate));
        currentDate.setDate(currentDate.getDate() + 1);
      }
    });

    return bookedDates;
  } catch (error) {
    console.error("Error in getBookedDates:", error);
    return [];
  }
};

/**
 * Determines if a specific date is unavailable
 */
export const isDateUnavailable = (date: Date, bookedDates: Date[]): boolean => {
  return bookedDates.some(
    bookedDate => 
      date.getDate() === bookedDate.getDate() &&
      date.getMonth() === bookedDate.getMonth() &&
      date.getFullYear() === bookedDate.getFullYear()
  );
};


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
    const startStr = format(startDate, "yyyy-MM-dd");
    const endStr = format(endDate, "yyyy-MM-dd");

    // 1. Check existing bookings
    let query = supabase
      .from("bookings")
      .select("id")
      .eq("car_id", carId)
      .in("status", ["confirmed", "pending"])
      .or(
        `and(start_date.lte.${endStr},end_date.gte.${startStr})`
      );
    
    if (excludeBookingId) {
      query = query.neq("id", excludeBookingId);
    }

    const { data: overlappingBookings, error: bookingError } = await query;

    if (bookingError) {
      console.error("Error checking car bookings:", bookingError);
      return false;
    }

    if (overlappingBookings && overlappingBookings.length > 0) {
      return false;
    }

    // 2. Check blocked dates
    const { data: blockedDates, error: blockedError } = await supabase
      .from("car_blocked_dates")
      .select("id")
      .eq("car_id", carId)
      .gte("blocked_date", startStr)
      .lte("blocked_date", endStr);

    if (blockedError) {
      console.error("Error checking blocked dates:", blockedError);
      return false;
    }

    if (blockedDates && blockedDates.length > 0) {
      return false;
    }

    return true;
  } catch (error) {
    console.error("Error in checkCarAvailability:", error);
    return false;
  }
};

/**
 * Fetches all booked and blocked dates for a car
 */
export const getBookedDates = async (carId: string): Promise<Date[]> => {
  try {
    const bookedDates: Date[] = [];

    // 1. Fetch Bookings
    const { data: bookings, error: bookingError } = await supabase
      .from("bookings")
      .select("start_date, end_date")
      .eq("car_id", carId)
      .in("status", ["confirmed", "pending"]);

    if (bookingError) {
      console.error("Error fetching bookings:", bookingError);
    } else {
      bookings?.forEach(booking => {
        const start = parseISO(booking.start_date);
        const end = parseISO(booking.end_date);
        
        const currentDate = new Date(start);
        while (currentDate <= end) {
          bookedDates.push(new Date(currentDate));
          currentDate.setDate(currentDate.getDate() + 1);
        }
      });
    }

    // 2. Fetch Blocked Dates
    const { data: blocked, error: blockedError } = await supabase
      .from("car_blocked_dates")
      .select("blocked_date")
      .eq("car_id", carId);

    if (blockedError) {
      console.error("Error fetching blocked dates:", blockedError);
    } else {
      blocked?.forEach(item => {
        bookedDates.push(parseISO(item.blocked_date));
      });
    }

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

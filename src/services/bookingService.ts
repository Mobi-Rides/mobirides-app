
import { supabase } from "@/integrations/supabase/client";
import { addDays, isAfter, isBefore, startOfDay, subDays } from "date-fns";
import { BookingNotificationType } from "@/types/booking";

/**
 * Checks for expired booking requests and changes their status to 'cancelled'
 */
export const handleExpiredBookings = async () => {
  try {
    const today = startOfDay(new Date());
    
    // Get all pending bookings where the start date is in the past
    const { data: expiredBookings, error } = await supabase
      .from('bookings')
      .select('*')
      .eq('status', 'pending')
      .lt('start_date', today.toISOString());

    if (error) throw error;
    
    if (expiredBookings && expiredBookings.length > 0) {
      // Update status to cancelled for expired bookings
      const { error: updateError } = await supabase
        .from('bookings')
        .update({ status: 'cancelled' })
        .in('id', expiredBookings.map(booking => booking.id));
      
      if (updateError) throw updateError;
      
      console.log(`Updated ${expiredBookings.length} expired booking requests`);
    }
    
    return { success: true, count: expiredBookings?.length || 0 };
  } catch (error) {
    console.error('Error handling expired bookings:', error);
    return { success: false, error };
  }
};

/**
 * Creates notifications for car owners about bookings the day before they start
 */
export const createBookingReminders = async () => {
  try {
    const tomorrow = addDays(startOfDay(new Date()), 1);
    const dayAfterTomorrow = addDays(tomorrow, 1);
    
    // Get all confirmed bookings starting tomorrow
    const { data: upcomingBookings, error } = await supabase
      .from('bookings')
      .select(`
        *,
        car:cars (
          brand,
          model,
          owner_id
        )
      `)
      .eq('status', 'confirmed')
      .gte('start_date', tomorrow.toISOString())
      .lt('start_date', dayAfterTomorrow.toISOString());
    
    if (error) throw error;
    
    if (upcomingBookings && upcomingBookings.length > 0) {
      // Create notifications for each booking
      for (const booking of upcomingBookings) {
        // Notify the car owner
        await supabase.from('notifications').insert({
          user_id: booking.car.owner_id,
          type: BookingNotificationType.BOOKING_REMINDER,
          content: `Reminder: A booking for your ${booking.car.brand} ${booking.car.model} starts tomorrow.`,
          related_car_id: booking.car_id,
          related_booking_id: booking.id
        });
      }
      
      console.log(`Created ${upcomingBookings.length} booking reminders`);
    }
    
    return { success: true, count: upcomingBookings?.length || 0 };
  } catch (error) {
    console.error('Error creating booking reminders:', error);
    return { success: false, error };
  }
};

import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/utils/toast-utils";

export class EnhancedBookingService {
  /**
   * Create booking reminders with enhanced timing (24h, 2h, 30min before start)
   */
  static async createBookingReminders() {
    try {
      const now = new Date();
      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      const twoHoursFromNow = new Date(now);
      twoHoursFromNow.setHours(twoHoursFromNow.getHours() + 2);
      
      const thirtyMinutesFromNow = new Date(now);
      thirtyMinutesFromNow.setMinutes(thirtyMinutesFromNow.getMinutes() + 30);

      // Get confirmed bookings starting tomorrow (24h reminder)
      const { data: tomorrowBookings } = await supabase
        .from('bookings')
        .select(`
          id,
          start_date,
          start_time,
          renter_id,
          cars (
            id,
            brand,
            model,
            owner_id
          )
        `)
        .eq('status', 'confirmed')
        .eq('start_date', tomorrow.toISOString().split('T')[0])
        .eq('preparation_reminder_sent', false);

      // Get confirmed bookings starting in 2 hours
      const { data: twoHourBookings } = await supabase
        .from('bookings')
        .select(`
          id,
          start_date,
          start_time,
          renter_id,
          cars (
            id,
            brand,
            model,
            owner_id
          )
        `)
        .eq('status', 'confirmed')
        .eq('start_date', now.toISOString().split('T')[0]);

      // Get confirmed bookings starting in 30 minutes
      const { data: thirtyMinBookings } = await supabase
        .from('bookings')
        .select(`
          id,
          start_date,
          start_time,
          renter_id,
          cars (
            id,
            brand,
            model,
            owner_id
          )
        `)
        .eq('status', 'confirmed')
        .eq('start_date', now.toISOString().split('T')[0]);

      // Process 24-hour reminders
      if (tomorrowBookings) {
        for (const booking of tomorrowBookings) {
          const carTitle = `${booking.cars.brand} ${booking.cars.model}`;
          
          // Notification for renter
          await supabase.from('notifications').insert({
            user_id: booking.renter_id,
            type: 'booking_reminder',
            content: `Your rental of ${carTitle} starts tomorrow at ${booking.start_time}. Please prepare for pickup.`,
            related_booking_id: booking.id,
            related_car_id: booking.cars.id
          });

          // Notification for host
          await supabase.from('notifications').insert({
            user_id: booking.cars.owner_id,
            type: 'booking_reminder',
            content: `Your ${carTitle} rental starts tomorrow at ${booking.start_time}. Please prepare for handover.`,
            related_booking_id: booking.id,
            related_car_id: booking.cars.id
          });

          // Mark reminder as sent
          await supabase
            .from('bookings')
            .update({ preparation_reminder_sent: true })
            .eq('id', booking.id);
        }
      }

      // Process 2-hour reminders
      if (twoHourBookings) {
        for (const booking of twoHourBookings) {
          const bookingStartTime = new Date(`${booking.start_date}T${booking.start_time}`);
          const timeDiff = bookingStartTime.getTime() - now.getTime();
          const hoursUntilStart = timeDiff / (1000 * 60 * 60);

          if (hoursUntilStart <= 2.5 && hoursUntilStart >= 1.5) {
            const carTitle = `${booking.cars.brand} ${booking.cars.model}`;
            
            // Notification for renter
            await supabase.from('notifications').insert({
              user_id: booking.renter_id,
              type: 'booking_reminder',
              content: `Your rental of ${carTitle} starts in 2 hours at ${booking.start_time}. Time to head to pickup location!`,
              related_booking_id: booking.id,
              related_car_id: booking.cars.id
            });

            // Notification for host
            await supabase.from('notifications').insert({
              user_id: booking.cars.owner_id,
              type: 'booking_reminder',
              content: `Your ${carTitle} handover is in 2 hours at ${booking.start_time}. Please ensure the car is ready.`,
              related_booking_id: booking.id,
              related_car_id: booking.cars.id
            });
          }
        }
      }

      // Process 30-minute reminders
      if (thirtyMinBookings) {
        for (const booking of thirtyMinBookings) {
          const bookingStartTime = new Date(`${booking.start_date}T${booking.start_time}`);
          const timeDiff = bookingStartTime.getTime() - now.getTime();
          const minutesUntilStart = timeDiff / (1000 * 60);

          if (minutesUntilStart <= 35 && minutesUntilStart >= 25) {
            const carTitle = `${booking.cars.brand} ${booking.cars.model}`;
            
            // Notification for renter
            await supabase.from('notifications').insert({
              user_id: booking.renter_id,
              type: 'booking_reminder',
              content: `Your rental of ${carTitle} starts in 30 minutes! Time for final preparations.`,
              related_booking_id: booking.id,
              related_car_id: booking.cars.id
            });

            // Notification for host
            await supabase.from('notifications').insert({
              user_id: booking.cars.owner_id,
              type: 'booking_reminder',
              content: `Your ${carTitle} handover is in 30 minutes! Please be ready at the pickup location.`,
              related_booking_id: booking.id,
              related_car_id: booking.cars.id
            });
          }
        }
      }

    } catch (error) {
      console.error('Error creating booking reminders:', error);
    }
  }

  /**
   * Send immediate post-confirmation guidance
   */
  static async sendPostConfirmationGuidance(bookingId: string, userRole: 'host' | 'renter') {
    try {
      const { data: booking } = await supabase
        .from('bookings')
        .select(`
          id,
          start_date,
          start_time,
          renter_id,
          cars (
            id,
            brand,
            model,
            owner_id
          )
        `)
        .eq('id', bookingId)
        .single();

      if (!booking) return;

      const carTitle = `${booking.cars.brand} ${booking.cars.model}`;
      const startDateTime = `${booking.start_date} at ${booking.start_time}`;

      if (userRole === 'host') {
        // Guidance for host
        await supabase.from('notifications').insert({
          user_id: booking.cars.owner_id,
          type: 'booking_reminder',
          content: `Booking confirmed! Next steps: 1) Prepare your ${carTitle} for handover on ${startDateTime}. 2) Ensure fuel tank is full. 3) Clean the vehicle. 4) Be ready 15 minutes early.`,
          related_booking_id: booking.id,
          related_car_id: booking.cars.id
        });
      } else {
        // Guidance for renter
        await supabase.from('notifications').insert({
          user_id: booking.renter_id,
          type: 'booking_reminder',
          content: `Booking confirmed! Next steps: 1) Prepare for pickup on ${startDateTime}. 2) Bring your driver's license. 3) Complete any required verification. 4) Arrive 15 minutes early.`,
          related_booking_id: booking.id,
          related_car_id: booking.cars.id
        });
      }

    } catch (error) {
      console.error('Error sending post-confirmation guidance:', error);
    }
  }
}
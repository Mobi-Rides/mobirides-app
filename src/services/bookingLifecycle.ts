import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { pushNotificationService } from "./pushNotificationService";

export type BookingStatus = 'pending' | 'awaiting_payment' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled';

export const bookingLifecycle = {
  /**
   * Updates the status of a booking and triggers relevant side effects (notifications, etc)
   */
  updateStatus: async (bookingId: string, newStatus: BookingStatus, metadata?: any) => {
    console.log(`[BookingLifecycle] Transitioning booking ${bookingId} to ${newStatus}`);
    
    try {
      // 1. Fetch current booking state to determine renter_id and car details for notifications
      const { data: booking, error: fetchError } = await supabase
        .from('bookings')
        .select(`
          id, 
          renter_id, 
          status,
          total_price,
          cars (
            brand,
            model,
            owner_id
          )
        `)
        .eq('id', bookingId)
        .single();

      if (fetchError || !booking) {
        throw new Error(fetchError?.message || "Booking not found");
      }

      // 2. Perform the update
      const updatePayload: any = { status: newStatus };
      
      // Handle status-specific logic
      if (newStatus === 'awaiting_payment') {
        updatePayload.payment_status = 'unpaid';
        updatePayload.payment_deadline = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
      } else if (newStatus === 'confirmed') {
        updatePayload.payment_status = 'paid';
      }

      const { error: updateError } = await supabase
        .from('bookings')
        .update(updatePayload)
        .eq('id', bookingId);

      if (updateError) throw updateError;

      // 3. Trigger side effects
      await handleSideEffects(booking, newStatus);

      return { success: true };
    } catch (error: any) {
      console.error(`[BookingLifecycle] Error updating status:`, error);
      toast.error(error.message || "Failed to update booking status");
      return { success: false, error };
    }
  }
};

async function handleSideEffects(booking: any, newStatus: BookingStatus) {
  const car = booking.cars;
  
  switch (newStatus) {
    case 'awaiting_payment':
      // Notify renter to pay
      await pushNotificationService.sendBookingNotification(booking.renter_id, {
        type: 'awaiting_payment',
        carBrand: car.brand,
        carModel: car.model,
        bookingReference: booking.id
      });
      break;

    case 'confirmed':
      // Notify host and renter that it's confirmed
      await Promise.all([
        pushNotificationService.sendBookingNotification(booking.renter_id, {
          type: 'confirmed',
          carBrand: car.brand,
          carModel: car.model,
          bookingReference: booking.id
        }),
        pushNotificationService.sendBookingNotification(car.owner_id, {
          type: 'confirmed',
          carBrand: car.brand,
          carModel: car.model,
          bookingReference: booking.id
        })
      ]);
      break;

    case 'in_progress':
      toast.success("Trip started! Drive safely.");
      break;

    case 'completed':
      toast.success("Trip completed! Hope you enjoyed the ride.");
      await supabase.rpc('release_pending_earnings', { p_booking_id: booking.id });
      break;

    case 'cancelled':
      toast.info("Booking cancelled.");
      break;
  }
}

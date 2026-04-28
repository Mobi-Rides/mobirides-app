import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { pushNotificationService } from "./pushNotificationService";
import { ResendEmailService } from "./notificationService";
import type { Database } from "@/integrations/supabase/types";

export type BookingStatus = 'pending' | 'awaiting_payment' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled';

export interface BookingData {
  id: string;
  renter_id: string;
  status: string;
  total_price: number;
  cars: {
    brand: string;
    model: string;
    owner_id: string;
  };
}

export const bookingLifecycle = {
  /**
   * Updates the status of a booking and triggers relevant side effects (notifications, etc)
   */
  updateStatus: async (bookingId: string, newStatus: BookingStatus, metadata?: Database['public']['Tables']['bookings']['Update']) => {
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
      const updatePayload: Database['public']['Tables']['bookings']['Update'] = { status: newStatus, ...metadata };
      
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
    } catch (error: unknown) {
      console.error(`[BookingLifecycle] Error updating status:`, error);
      toast.error(error instanceof Error ? error.message : "Failed to update booking status");
      return { success: false, error };
    }
  },

  /**
   * Placeholder interface for refund flow (S13-005)
   * To be integrated with provider APIs (PayGate/Ooze)
   */
  refundBooking: async (bookingId: string, reason: string) => {
    console.log(`[BookingLifecycle] Initiating refund for booking ${bookingId}. Reason: ${reason}`);
    
    try {
      // 1. Mark transaction as refunded in DB
      // 2. Debit host pending_balance
      // 3. Call provider refund API via edge function
      
      const { error } = await supabase.functions.invoke('refund-payment', {
        body: { booking_id: bookingId, reason }
      });

      if (error) {
        console.error("Refund edge function not fully implemented yet:", error);
        // Fallback for UI testing
        toast.info("Refund initiated (Mock)");
        return { success: true };
      }

      toast.success("Refund processed successfully.");
      return { success: true };
    } catch (error: unknown) {
      console.error(`[BookingLifecycle] Error processing refund:`, error);
      toast.error(error instanceof Error ? error.message : "Failed to process refund");
      return { success: false, error };
    }
  }
};

// Helper function to get user email from auth.users
async function getUserEmail(userId: string): Promise<{ email?: string; name?: string } | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('full_name')
    .eq('id', userId)
    .single();

  if (error || !data) return null;
  
  // Get email from auth.users
  const { data: authData } = await supabase.auth.admin.getUserById(userId);
  
  return {
    email: authData?.user?.email,
    name: data.full_name
  };
}

async function handleSideEffects(booking: BookingData, newStatus: BookingStatus) {
  const car = booking.cars;
  const emailService = ResendEmailService.getInstance();
  
  switch (newStatus) {
    case 'awaiting_payment':
      // Notify renter to pay - push
      await pushNotificationService.sendBookingNotification(booking.renter_id, {
        type: 'awaiting_payment',
        carBrand: car.brand,
        carModel: car.model,
        bookingReference: booking.id
      });
      // TODO: Add email notification once email lookup is implemented
      break;

    case 'confirmed':
      // Notify host and renter that it's confirmed - push
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
      // Send booking confirmation email to renter
      try {
        const user = await getUserEmail(booking.renter_id);
        if (user?.email) {
          await emailService.sendEmail(
            user.email,
            'booking-confirmation',
            {
              customerName: user.name,
              bookingReference: booking.id,
              carBrand: car.brand,
              carModel: car.model,
              totalPrice: booking.total_price
            },
            '🎉 Your MobiRides Booking is Confirmed!'
          );
        }
      } catch (emailError) {
        console.error('[BookingLifecycle] Failed to send confirmation email:', emailError);
      }
      break;

    case 'in_progress':
      toast.success("Trip started! Drive safely.");
      // Send handover ready email
      try {
        const user = await getUserEmail(booking.renter_id);
        if (user?.email) {
          await emailService.sendEmail(
            user.email,
            'handover-ready',
            {
              customerName: user.name,
              bookingReference: booking.id,
              carBrand: car.brand,
              carModel: car.model
            },
            '🚗 Your Vehicle is Ready for Handover - MobiRides'
          );
        }
      } catch (emailError) {
        console.error('[BookingLifecycle] Failed to send handover ready email:', emailError);
      }
      break;

    case 'completed':
      toast.success("Trip completed! Hope you enjoyed the ride.");
      // NOTE: release_pending_earnings is called by completeHandover() in handoverService.ts.
      // Do NOT call it here to avoid double-releasing host earnings.
      break;

    case 'cancelled':
      toast.info("Booking cancelled.");
      // Send cancellation email to renter
      try {
        const user = await getUserEmail(booking.renter_id);
        if (user?.email) {
          await emailService.sendEmail(
            user.email,
            'booking-cancelled',
            {
              customerName: user.name,
              bookingReference: booking.id,
              carBrand: car.brand,
              carModel: car.model,
              cancelledDate: new Date().toLocaleDateString()
            },
            '❌ Your MobiRides Booking Has Been Cancelled'
          );
        }
      } catch (emailError) {
        console.error('[BookingLifecycle] Failed to send cancellation email:', emailError);
      }
      break;
  }
}

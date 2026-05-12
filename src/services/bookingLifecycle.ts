import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { pushNotificationService } from "./pushNotificationService";
import { ResendEmailService } from "./notificationService";
import { CompleteNotificationService } from "./completeNotificationService";
import type { Database } from "@/integrations/supabase/types";

export type BookingStatus = 'pending' | 'awaiting_payment' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled';

export interface BookingData {
  id: string;
  renter_id: string;
  status: string;
  total_price: number;
  start_date: string;
  end_date: string;
  cars: {
    brand: string;
    model: string;
    owner_id: string;
    image_url?: string | null;
    location?: string;
    owner?: {
      full_name: string | null;
    };
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
          start_date,
          end_date,
          cars (
            brand,
            model,
            owner_id,
            image_url,
            location,
            owner:profiles!owner_id (
              full_name
            )
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

// Helper function to get user email and profile info
async function getUserEmail(userId: string): Promise<{ email?: string; name?: string } | null> {
  try {
    // Get name from profiles
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('id', userId)
      .single();

    if (profileError) {
      console.error("[BookingLifecycle] Error fetching profile for email:", profileError);
    }
    
    // Use the safe RPC function to get email from auth.users
    const { data: emailData, error: emailError } = await supabase.rpc('get_user_email_for_notification', {
      user_uuid: userId
    });
    
    if (emailError) {
      console.error("[BookingLifecycle] Error fetching user email via RPC:", emailError);
      return null;
    }
    
    return {
      email: emailData as string,
      name: profileData?.full_name || undefined
    };
  } catch (error) {
    console.error("[BookingLifecycle] Unhandled error in getUserEmail:", error);
    return null;
  }
}

async function handleSideEffects(booking: BookingData, newStatus: BookingStatus) {
  const car = booking.cars;
  const emailService = ResendEmailService.getInstance();
  
  switch (newStatus) {
    case 'awaiting_payment':
      await CompleteNotificationService.getInstance().createNotification({
        userId: booking.renter_id,
        type: 'system_notification',
        title: 'Payment Required',
        description: `Your booking for ${car.brand} ${car.model} has been approved. Please complete payment to confirm.`,
        relatedBookingId: booking.id,
        metadata: {
          type: 'awaiting_payment',
          carBrand: car.brand,
          carModel: car.model,
          bookingReference: booking.id.split('-')[0].toUpperCase(),
          totalAmount: booking.total_price,
          hostName: car.owner?.full_name || 'Your Host',
          actionUrl: `https://app.mobirides.com/rental-details/${booking.id}?pay=true`
        }
      });
      break;

    case 'confirmed':
      await Promise.all([
        CompleteNotificationService.getInstance().createNotification({
          userId: booking.renter_id,
          type: 'booking_confirmed_renter',
          title: 'Booking Confirmed',
          description: `Your booking for ${car.brand} ${car.model} has been confirmed!`,
          relatedBookingId: booking.id,
          metadata: {
            carBrand: car.brand,
            carModel: car.model,
            totalPrice: booking.total_price
          }
        }),
        CompleteNotificationService.getInstance().createNotification({
          userId: car.owner_id,
          type: 'booking_confirmed_host',
          title: 'Booking Confirmed',
          description: `The booking for your ${car.brand} ${car.model} has been confirmed.`,
          relatedBookingId: booking.id,
          metadata: {
            carBrand: car.brand,
            carModel: car.model,
            totalPrice: booking.total_price
          }
        })
      ]);
      break;

    case 'in_progress':
      toast.success("Trip started! Drive safely.");
      await CompleteNotificationService.getInstance().createNotification({
        userId: booking.renter_id,
        type: 'handover_ready',
        title: 'Trip Started',
        description: `Your trip with the ${car.brand} ${car.model} has started.`,
        relatedBookingId: booking.id,
        metadata: {
          carBrand: car.brand,
          carModel: car.model
        }
      });
      break;

    case 'completed':
      toast.success("Trip completed! Hope you enjoyed the ride.");
      // NOTE: release_pending_earnings is called by completeHandover() in handoverService.ts.
      // Do NOT call it here to avoid double-releasing host earnings.
      break;

    case 'cancelled':
      toast.info("Booking cancelled.");
      await CompleteNotificationService.getInstance().createNotification({
        userId: booking.renter_id,
        type: 'booking_cancelled_renter',
        title: 'Booking Cancelled',
        description: `Your booking for ${car.brand} ${car.model} has been cancelled.`,
        relatedBookingId: booking.id,
        metadata: {
          carBrand: car.brand,
          carModel: car.model,
          cancelledDate: new Date().toLocaleDateString()
        }
      });
      break;
  }
}

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { EnhancedBookingService } from "@/services/enhancedBookingService";
import { useAuth } from "./useAuth";
import { Database } from "@/integrations/supabase/types";

export const useBookingActions = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const mutation = useMutation({
    mutationFn: async ({ bookingId, status }: { bookingId: string; status: Database["public"]["Enums"]["booking_status"] | 'awaiting_payment'; }) => {
      // Update booking status - this will trigger the notification via database trigger
      const { error } = await supabase
        .from('bookings')
        .update({ 
          status: status as Database["public"]["Enums"]["booking_status"], // Type assertion for Supabase compatibility
          // Add payment deadline for approved bookings
          ...(status === 'awaiting_payment' ? {
            payment_status: 'unpaid',
            payment_deadline: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
          } : {})
        })
        .eq('id', bookingId);
      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      const action = variables.status === 'awaiting_payment' ? 'approved' : 'cancelled';
      toast.success(`Booking ${action}`);
      
      // Send post-confirmation guidance only after payment (this won't be triggered by this mutation)
      // This is handled elsewhere when status actually becomes CONFIRMED
      if (variables.status === 'confirmed' && user) {
        EnhancedBookingService.sendPostConfirmationGuidance(variables.bookingId, 'host');
      }
      
      queryClient.invalidateQueries({ queryKey: ['booking-request', variables.bookingId] });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
    },
    onError: (error) => {
      toast.error('Failed to update the booking status. Please try again.');
    },
  });

  const acceptBooking = (bookingId: string) => {
    mutation.mutate({ bookingId, status: 'awaiting_payment' as Database["public"]["Enums"]["booking_status"] });
  };

  const declineBooking = (bookingId: string) => {
    mutation.mutate({ bookingId, status: 'cancelled' as Database["public"]["Enums"]["booking_status"] });
  };

  return {
    acceptBooking,
    declineBooking,
    isLoading: mutation.status === 'pending',
    error: mutation.error,
  };
}; 
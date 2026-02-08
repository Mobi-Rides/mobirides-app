import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { EnhancedBookingService } from "@/services/enhancedBookingService";
import { useAuth } from "./useAuth";

export const useBookingActions = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const mutation = useMutation({
    mutationFn: async ({ bookingId, status }: { bookingId: string; status: 'awaiting_payment' | 'cancelled'; }) => {
      // Update booking status - this will trigger the notification via database trigger
      const { error } = await supabase
        .from('bookings')
        .update({ 
          status,
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
      
      // Send post-confirmation guidance only after payment
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
    mutation.mutate({ bookingId, status: 'awaiting_payment' });
  };

  const declineBooking = (bookingId: string) => {
    mutation.mutate({ bookingId, status: 'cancelled' });
  };

  return {
    acceptBooking,
    declineBooking,
    isLoading: mutation.status === 'pending',
    error: mutation.error,
  };
}; 
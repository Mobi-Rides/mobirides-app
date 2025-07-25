import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const useBookingActions = () => {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async ({ bookingId, status }: { bookingId: string; status: 'confirmed' | 'cancelled' }) => {
      const { error } = await supabase
        .from('bookings')
        .update({ status })
        .eq('id', bookingId);
      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      const action = variables.status === 'confirmed' ? 'approved' : 'cancelled';
      toast.success(`Booking ${action}`);
      queryClient.invalidateQueries({ queryKey: ['booking-request', variables.bookingId] });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
    },
    onError: (error) => {
      toast.error('Failed to update the booking status. Please try again.');
    },
  });

  const acceptBooking = (bookingId: string) => {
    mutation.mutate({ bookingId, status: 'confirmed' });
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
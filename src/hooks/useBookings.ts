
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { BookingService, BookingWithDetails } from "@/services/api";
import { toast } from "sonner";

interface UseBookingsOptions {
  enabled?: boolean;
}

export const useRenterBookings = (renterId: string, options: UseBookingsOptions = {}) => {
  return useQuery({
    queryKey: ["renter-bookings", renterId],
    queryFn: async () => {
      const response = await BookingService.getRenterBookings(renterId);
      if (!response.success) {
        throw new Error(response.error || "Failed to fetch bookings");
      }
      return response.data || [];
    },
    enabled: !!renterId && (options.enabled !== false),
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 30, // 30 minutes
  });
};

export const useHostBookings = (hostId: string, options: UseBookingsOptions = {}) => {
  return useQuery({
    queryKey: ["host-bookings", hostId],
    queryFn: async () => {
      const response = await BookingService.getHostBookings(hostId);
      if (!response.success) {
        throw new Error(response.error || "Failed to fetch bookings");
      }
      return response.data || [];
    },
    enabled: !!hostId && (options.enabled !== false),
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 30, // 30 minutes
  });
};

export const useBookingMutations = () => {
  const queryClient = useQueryClient();

  const invalidateBookings = () => {
    queryClient.invalidateQueries({ queryKey: ["renter-bookings"] });
    queryClient.invalidateQueries({ queryKey: ["host-bookings"] });
  };

  const cancelBooking = useMutation({
    mutationFn: BookingService.cancelBooking,
    onSuccess: () => {
      toast.success("Booking cancelled successfully");
      invalidateBookings();
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to cancel booking");
    },
  });

  const approveBooking = useMutation({
    mutationFn: BookingService.approveBooking,
    onSuccess: () => {
      toast.success("Booking approved successfully");
      invalidateBookings();
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to approve booking");
    },
  });

  const declineBooking = useMutation({
    mutationFn: BookingService.declineBooking,
    onSuccess: () => {
      toast.success("Booking declined successfully");
      invalidateBookings();
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to decline booking");
    },
  });

  return {
    cancelBooking,
    approveBooking,
    declineBooking,
  };
};

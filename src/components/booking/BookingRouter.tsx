
import { Skeleton } from "@/components/ui/skeleton";
import { Navigation } from "@/components/Navigation";
import { useUserRole } from "@/hooks/useUserRole";
import { BookingTable } from "./BookingTable";
import { BookingLoadingState } from "./BookingLoadingState";
import { BookingPageLayout } from "./BookingPageLayout";
import { useAuth } from "@/hooks/useAuth";
import { useHostBookings, useRenterBookings, useBookingMutations } from "@/hooks/useBookings";
import { toast } from "sonner";
import { useState } from "react";

export const BookingRouter = () => {
  const { userRole, isLoadingRole } = useUserRole();
  const { user } = useAuth();
  const [selectedBookingIds, setSelectedBookingIds] = useState<string[]>([]);

  // Use appropriate hook based on user role
  const { 
    data: hostBookings = [], 
    isLoading: isHostLoading, 
    error: hostError 
  } = useHostBookings(user?.id || "", { enabled: userRole === "host" });

  const { 
    data: renterBookings = [], 
    isLoading: isRenterLoading, 
    error: renterError 
  } = useRenterBookings(user?.id || "", { enabled: userRole !== "host" });

  const { 
    cancelBooking, 
    approveBooking, 
    declineBooking 
  } = useBookingMutations();

  const bookings = userRole === "host" ? hostBookings : renterBookings;
  const isLoading = isLoadingRole || (userRole === "host" ? isHostLoading : isRenterLoading);
  const error = userRole === "host" ? hostError : renterError;

  const handleCancelBooking = async (bookingId: string) => {
    cancelBooking.mutate(bookingId);
  };

  const handleApproveBooking = async (bookingId: string) => {
    if (userRole === "host") {
      approveBooking.mutate(bookingId);
    }
  };

  const handleDeclineBooking = async (bookingId: string) => {
    if (userRole === "host") {
      declineBooking.mutate(bookingId);
    }
  };

  const toggleSelectBooking = (bookingId: string) => {
    setSelectedBookingIds(prev =>
      prev.includes(bookingId)
        ? prev.filter(id => id !== bookingId)
        : [...prev, bookingId]
    );
  };

  const toggleSelectAll = () => {
    setSelectedBookingIds(prev =>
      prev.length === bookings.length ? [] : bookings.map(b => b.id)
    );
  };

  if (error) {
    toast.error("Failed to load bookings");
  }

  const title = userRole === "host" ? "Host Bookings" : "My Bookings";

  return (
    <BookingPageLayout title={title} isLoading={isLoading}>
      {isLoading ? (
        <BookingLoadingState />
      ) : (
        <BookingTable
          bookings={bookings}
          onCancelBooking={handleCancelBooking}
          onApproveBooking={handleApproveBooking}
          onDeclineBooking={handleDeclineBooking}
          onMessage={async () => {}} // TODO: Implement messaging
          isHost={userRole === "host"}
          showNetEarnings={userRole === "host"}
          selectedBookingIds={selectedBookingIds}
          toggleSelectBooking={toggleSelectBooking}
          allSelected={selectedBookingIds.length === bookings.length}
          toggleSelectAll={toggleSelectAll}
        />
      )}
    </BookingPageLayout>
  );
};

export default BookingRouter;

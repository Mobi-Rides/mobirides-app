
import { useState } from "react";
import { BookingTable } from "@/components/booking/BookingTable";
import { BookingLoadingState } from "@/components/booking/BookingLoadingState";
import { BookingPageLayout } from "@/components/booking/BookingPageLayout";
import { useAuth } from "@/hooks/useAuth";
import { useHostBookings, useBookingMutations } from "@/hooks/useBookings";
import { toast } from "sonner";

const HostBookings = () => {
  const { user } = useAuth();
  const [selectedBookingIds, setSelectedBookingIds] = useState<string[]>([]);
  
  const { 
    data: bookings = [], 
    isLoading, 
    error 
  } = useHostBookings(user?.id || "");

  const { 
    cancelBooking, 
    approveBooking, 
    declineBooking 
  } = useBookingMutations();

  const handleCancelBooking = async (bookingId: string) => {
    cancelBooking.mutate(bookingId);
  };

  const handleApproveBooking = async (bookingId: string) => {
    approveBooking.mutate(bookingId);
  };

  const handleDeclineBooking = async (bookingId: string) => {
    declineBooking.mutate(bookingId);
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
    toast.error("Failed to load host bookings");
  }

  return (
    <BookingPageLayout title="Host Bookings" isLoading={isLoading}>
      {isLoading ? (
        <BookingLoadingState />
      ) : (
        <BookingTable
          bookings={bookings}
          onCancelBooking={handleCancelBooking}
          onApproveBooking={handleApproveBooking}
          onDeclineBooking={handleDeclineBooking}
          onMessage={async () => {}} // TODO: Implement messaging
          isHost={true}
          showNetEarnings={true}
          selectedBookingIds={selectedBookingIds}
          toggleSelectBooking={toggleSelectBooking}
          allSelected={selectedBookingIds.length === bookings.length}
          toggleSelectAll={toggleSelectAll}
        />
      )}
    </BookingPageLayout>
  );
};

export default HostBookings;

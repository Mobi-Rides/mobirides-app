
import { useState } from "react";
import { BookingTable } from "@/components/booking/BookingTable";
import { BookingLoadingState } from "@/components/booking/BookingLoadingState";
import { BookingPageLayout } from "@/components/booking/BookingPageLayout";
import { useAuth } from "@/hooks/useAuth";
import { useRenterBookings, useBookingMutations } from "@/hooks/useBookings";
import { toast } from "sonner";

const RenterBookings = () => {
  const { user } = useAuth();
  const [selectedBookingIds, setSelectedBookingIds] = useState<string[]>([]);
  
  const { 
    data: bookings = [], 
    isLoading, 
    error 
  } = useRenterBookings(user?.id || "");

  const { cancelBooking } = useBookingMutations();

  const handleCancelBooking = async (bookingId: string) => {
    cancelBooking.mutate(bookingId);
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

  return (
    <BookingPageLayout title="My Bookings" isLoading={isLoading}>
      {isLoading ? (
        <BookingLoadingState />
      ) : (
        <BookingTable
          bookings={bookings}
          onCancelBooking={handleCancelBooking}
          onApproveBooking={async () => {}} // Not used for renters
          onDeclineBooking={async () => {}} // Not used for renters
          onMessage={async () => {}} // TODO: Implement messaging
          isHost={false}
          selectedBookingIds={selectedBookingIds}
          toggleSelectBooking={toggleSelectBooking}
          allSelected={selectedBookingIds.length === bookings.length}
          toggleSelectAll={toggleSelectAll}
        />
      )}
    </BookingPageLayout>
  );
};

export default RenterBookings;

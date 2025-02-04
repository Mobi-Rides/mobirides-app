import { Booking } from "@/types/booking";
import { BookingCard } from "./BookingCard";

interface BookingTableProps {
  bookings: Booking[] | undefined;
  onCancelBooking: (bookingId: string) => Promise<void>;
}

export const BookingTable = ({ bookings, onCancelBooking }: BookingTableProps) => {
  if (!bookings?.length) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No bookings found
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {bookings.map((booking) => (
        <BookingCard 
          key={booking.id} 
          booking={booking} 
          onCancelBooking={onCancelBooking}
        />
      ))}
    </div>
  );
};

import { Table, TableBody, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { BookingRow } from "./BookingRow";
import { Booking } from "@/types/booking";
import { useMediaQuery } from "usehooks-ts";
import { BookingMobileCard } from "./BookingMobileCard";

interface BookingTableProps {
  bookings: Booking[] | undefined;
  onCancelBooking: (bookingId: string) => Promise<void>;
}

export const BookingTable = ({ bookings, onCancelBooking }: BookingTableProps) => {
  console.log("BookingTable received bookings:", bookings);
  const isDesktop = useMediaQuery("(min-width: 640px)");
  
  if (!bookings?.length) {
    return (
      <div className="text-center py-8 border rounded-md">
        <p className="text-muted-foreground">You don't have any bookings yet.</p>
      </div>
    );
  }

  // Mobile view - card layout
  if (!isDesktop) {
    return (
      <div className="space-y-4">
        {bookings.map((booking) => (
          <BookingMobileCard
            key={booking.id}
            booking={booking}
            onCancelBooking={onCancelBooking}
          />
        ))}
      </div>
    );
  }

  // Desktop view - table layout
  return (
    <div className="rounded-md border overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Car</TableHead>
            <TableHead>Dates</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Price</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {bookings.map((booking) => (
            <BookingRow 
              key={booking.id} 
              booking={booking} 
              onCancelBooking={onCancelBooking}
            />
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

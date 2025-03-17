
import { Table, TableBody, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { BookingRow } from "./BookingRow";
import { Booking } from "@/types/booking";

interface BookingTableProps {
  bookings: Booking[] | undefined;
  onCancelBooking: (bookingId: string) => Promise<void>;
}

export const BookingTable = ({ bookings, onCancelBooking }: BookingTableProps) => {
  // Add additional debugging for bookings
  console.log("BookingTable received bookings:", bookings);
  
  if (!bookings?.length) {
    return (
      <div className="text-center py-8 border rounded-md">
        <p className="text-muted-foreground">You don't have any bookings yet.</p>
      </div>
    );
  }

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

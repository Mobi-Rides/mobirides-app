import { Table, TableBody, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { BookingRow } from "./BookingRow";
import { Booking } from "@/types/booking";

interface BookingTableProps {
  bookings: Booking[] | undefined;
  onCancelBooking: (bookingId: string) => Promise<void>;
}

export const BookingTable = ({ bookings, onCancelBooking }: BookingTableProps) => {
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Car</TableHead>
            <TableHead>Dates</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Price</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {bookings?.map((booking) => (
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
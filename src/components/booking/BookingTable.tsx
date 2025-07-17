import { Table, TableBody, TableHead, TableHeader, TableRow, TableCell } from "@/components/ui/table";
import { BookingRow } from "./BookingRow";
import { BookingCard } from "./BookingCard";
import { Booking } from "@/types/booking";
import { useMediaQuery } from "usehooks-ts";
import { BookingMobileCard } from "./BookingMobileCard";

interface BookingTableProps {
  bookings: Booking[];
  onCancelBooking: (bookingId: string) => Promise<void>;
  onApproveBooking: (bookingId: string) => Promise<void>;
  onDeclineBooking: (bookingId: string) => Promise<void>;
  onMessage: (otherUserId: string, bookingId: string) => void;
  isHost: boolean;
  showNetEarnings?: boolean;
  selectedBookingIds: string[];
  toggleSelectBooking: (bookingId: string) => void;
  allSelected: boolean;
  toggleSelectAll: () => void;
  viewMode?: "cards" | "table";
}

export const BookingTable = ({ bookings, onCancelBooking,
  onApproveBooking,  
  onDeclineBooking,   
  onMessage,  
  isHost,
  showNetEarnings = false,
  selectedBookingIds,
  toggleSelectBooking,
  allSelected,
  toggleSelectAll,
  viewMode = "table",
}: BookingTableProps) => {
  
  const isDesktop = useMediaQuery("(min-width: 640px)");
  const COMMISSION_RATE = 0.15;
  
  if (!bookings?.length) {
    return (
      <div className="text-center py-8 border rounded-md">
        <p className="text-muted-foreground">You don't have any bookings yet.</p>
      </div>
    );
  }

  // Mobile view - always use mobile cards
  if (!isDesktop) {
    return (
      <div className="space-y-4">
        {bookings.map((booking) => (
          <BookingMobileCard
            key={booking.id}
            booking={booking}
            onCancelBooking={onCancelBooking}
            onApproveBooking={onApproveBooking}
            onDeclineBooking={onDeclineBooking}
            onMessage={onMessage}
            selectedBookingIds={selectedBookingIds}
            toggleSelectBooking={toggleSelectBooking}
          />
        ))}
      </div>
    );
  }

  // Desktop view - use cards or table based on viewMode
  if (viewMode === "cards") {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {bookings.map((booking) => (
          <BookingCard
            key={booking.id}
            booking={booking}
            onCancelBooking={onCancelBooking}
            onApproveBooking={onApproveBooking}
            onDeclineBooking={onDeclineBooking}
            onMessage={onMessage}
            isHost={isHost}
            showNetEarnings={showNetEarnings}
            commissionRate={COMMISSION_RATE}
            selectedBookingIds={selectedBookingIds}
            toggleSelectBooking={toggleSelectBooking}
          />
        ))}
      </div>
    );
  }

  // Desktop table view
  return (
    <div className="rounded-md border overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Car</TableHead>
            <TableHead>Rented By</TableHead>
            <TableHead>Dates</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Price</TableHead>
            {showNetEarnings && <TableHead>Net Earnings</TableHead>}
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {bookings.map((booking) => (
            <BookingRow 
              key={booking.id}
              booking={booking} 
              onCancelBooking={onCancelBooking}
              onApproveBooking={onApproveBooking}
              onDeclineBooking={onDeclineBooking}
              onMessage={onMessage}
              isHost={isHost}
              showNetEarnings={showNetEarnings}
              commissionRate={COMMISSION_RATE}
              selectedBookingIds={selectedBookingIds}
              toggleSelectBooking={toggleSelectBooking}
            />
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

import { format } from "date-fns";
import { TableCell, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Booking } from "@/types/booking";

interface BookingRowProps {
  booking: Booking;
  onCancelBooking: (bookingId: string) => Promise<void>;
}

export const BookingRow = ({ booking, onCancelBooking }: BookingRowProps) => {
  return (
    <TableRow>
      <TableCell>
        <div className="flex items-center gap-2">
          <img
            src={booking.cars.image_url || "/placeholder.svg"}
            alt={`${booking.cars.brand} ${booking.cars.model}`}
            className="w-12 h-12 object-cover rounded"
          />
          <div>
            <p className="font-medium">
              {booking.cars.brand} {booking.cars.model}
            </p>
          </div>
        </div>
      </TableCell>
      <TableCell>
        <p>{format(new Date(booking.start_date), "PPP")}</p>
        <p className="text-muted-foreground">
          to {format(new Date(booking.end_date), "PPP")}
        </p>
      </TableCell>
      <TableCell>
        <span className="capitalize">{booking.status}</span>
      </TableCell>
      <TableCell>BWP {booking.total_price}</TableCell>
      <TableCell>
        {booking.status === "pending" && (
          <Button
            variant="outline"
            onClick={() => onCancelBooking(booking.id)}
          >
            Cancel
          </Button>
        )}
      </TableCell>
    </TableRow>
  );
};
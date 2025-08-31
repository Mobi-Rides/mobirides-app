
import { format } from "date-fns";
import { TableCell, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Booking } from "@/types/booking";
import { Badge } from "@/components/ui/badge";
import { Clock, Check, X, ArrowRight, RotateCcw } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface BookingRowProps {
  booking: Booking;
  onCancelBooking: (bookingId: string) => Promise<void>;
}

export const BookingRow = ({ booking, onCancelBooking }: BookingRowProps) => {
  const navigate = useNavigate();

  const handleRowClick = () => {
    navigate(`/rental-details/${booking.id}`);
  };

  // Prevent propagation when clicking cancel button
  const handleCancelClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onCancelBooking(booking.id);
  };

  const getStatusBadge = () => {
    // Check for early return first
    if (booking.early_return && booking.status === "completed") {
      return <Badge variant="secondary" className="bg-purple-100 text-purple-800 flex items-center gap-1"><RotateCcw className="h-3 w-3" /> Returned Early</Badge>;
    }

    switch (booking.status) {
      case "pending":
        return <Badge variant="outline" className="flex items-center gap-1"><Clock className="h-3 w-3" /> Pending</Badge>;
      case "confirmed":
        return <Badge variant="success" className="bg-green-100 text-green-800 flex items-center gap-1"><Check className="h-3 w-3" /> Confirmed</Badge>;
      case "cancelled":
        return <Badge variant="destructive" className="flex items-center gap-1"><X className="h-3 w-3" /> Cancelled</Badge>;
      case "completed":
        return <Badge variant="default" className="flex items-center gap-1"><Check className="h-3 w-3" /> Completed</Badge>;
      default:
        return <Badge>{booking.status}</Badge>;
    }
  };

  return (
    <TableRow 
      className="cursor-pointer hover:bg-muted/80 transition-colors" 
      onClick={handleRowClick}
    >
      <TableCell>
        <div className="flex items-center gap-2">
          <img
            src={booking.cars.image_url || "/placeholder.svg"}
            alt={`${booking.cars.brand} ${booking.cars.model}`}
            className="w-10 h-10 object-cover rounded"
          />
          <div className="min-w-0">
            <p className="font-medium truncate">
              {booking.cars.brand} {booking.cars.model}
            </p>
            <p className="text-xs text-muted-foreground truncate">
              {booking.cars.location}
            </p>
          </div>
        </div>
      </TableCell>
      <TableCell>
        <div className="space-y-1">
          <p className="text-sm font-medium">
            {format(new Date(booking.start_date), "PPP")}
          </p>
          <p className="text-xs text-muted-foreground">
            to {format(new Date(booking.end_date), "PPP")}
          </p>
        </div>
      </TableCell>
      <TableCell>
        {getStatusBadge()}
      </TableCell>
      <TableCell>
        <p className="font-medium">BWP {booking.total_price}</p>
      </TableCell>
      <TableCell>
        <div className="flex items-center justify-end gap-2">
          {booking.status === "pending" && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleCancelClick}
            >
              Cancel
            </Button>
          )}
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon">
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>View Details</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </TableCell>
    </TableRow>
  );
};

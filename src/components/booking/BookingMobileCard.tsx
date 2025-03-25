
import { format } from "date-fns";
import { Booking } from "@/types/booking";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Clock, Check, X } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface BookingMobileCardProps {
  booking: Booking;
  onCancelBooking: (bookingId: string) => Promise<void>;
}

export const BookingMobileCard = ({ booking, onCancelBooking }: BookingMobileCardProps) => {
  const navigate = useNavigate();

  const handleCardClick = () => {
    navigate(`/rental-details/${booking.id}`);
  };

  const handleCancelClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onCancelBooking(booking.id);
  };

  const getStatusBadge = () => {
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
    <Card 
      className="cursor-pointer hover:bg-muted/50 transition-colors overflow-hidden" 
      onClick={handleCardClick}
    >
      <CardContent className="p-4">
        <div className="flex flex-col gap-3">
          <div className="flex gap-3">
            <img
              src={booking.cars.image_url || "/placeholder.svg"}
              alt={`${booking.cars.brand} ${booking.cars.model}`}
              className="w-20 h-20 object-cover rounded-md flex-shrink-0"
            />
            <div className="flex-1 min-w-0">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-medium truncate">
                    {booking.cars.brand} {booking.cars.model}
                  </h3>
                  <p className="text-xs text-muted-foreground truncate mb-1">
                    {booking.cars.location}
                  </p>
                </div>
                <div className="ml-2">
                  {getStatusBadge()}
                </div>
              </div>
            </div>
          </div>
          
          <div className="text-sm space-y-2">
            <div className="flex flex-col">
              <span className="text-muted-foreground">Dates:</span>
              <span className="font-medium">
                {format(new Date(booking.start_date), "PP")} - {format(new Date(booking.end_date), "PP")}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Price:</span>
              <span className="font-medium">BWP {booking.total_price}</span>
            </div>
          </div>
          
          {booking.status === "pending" && (
            <div className="flex justify-end mt-1">
              <Button
                variant="outline"
                size="sm"
                onClick={handleCancelClick}
              >
                Cancel
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

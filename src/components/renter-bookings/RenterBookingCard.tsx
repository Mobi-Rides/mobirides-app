
import { format } from "date-fns";
import { Booking } from "@/types/booking";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Clock, Check, X, MapPin, CalendarDays } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface RenterBookingCardProps {
  booking: Booking;
  onCancelBooking: (bookingId: string) => Promise<void>;
}

export const RenterBookingCard = ({ booking, onCancelBooking }: RenterBookingCardProps) => {
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
        return <Badge variant="outline" className="flex items-center gap-1 text-xs"><Clock className="h-3 w-3" /> Pending</Badge>;
      case "confirmed":
        return <Badge variant="success" className="bg-green-100 text-green-800 flex items-center gap-1 text-xs"><Check className="h-3 w-3" /> Confirmed</Badge>;
      case "cancelled":
        return <Badge variant="destructive" className="flex items-center gap-1 text-xs"><X className="h-3 w-3" /> Cancelled</Badge>;
      case "completed":
        return <Badge variant="default" className="flex items-center gap-1 text-xs"><Check className="h-3 w-3" /> Completed</Badge>;
      default:
        return <Badge className="text-xs">{booking.status}</Badge>;
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
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h3 className="font-medium truncate">
                    {booking.cars.brand} {booking.cars.model}
                  </h3>
                  <p className="text-xs text-muted-foreground truncate flex items-center gap-1 mt-1">
                    <MapPin size={12} className="text-red-500" />
                    {booking.cars.location}
                  </p>
                </div>
                <div>{getStatusBadge()}</div>
              </div>
            </div>
          </div>

          <div className="text-sm space-y-2">
            <div className="flex flex-col justify-start items-start">
              <span className="font-medium flex gap-1 text-xs">
                <span className="flex items-center gap-1">
                  <CalendarDays size={12} className="text-blue-500" />
                  {format(new Date(booking.start_date), "PP")} -
                </span>
                <span className="flex items-center gap-1">
                  <CalendarDays size={12} className="text-blue-500" />
                  {format(new Date(booking.end_date), "PP")}
                </span>
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="font-medium text-base text-primary">BWP {booking.total_price}</span>
              {booking.status === "pending" && (
                <Button variant="outline" size="sm" onClick={handleCancelClick}>
                  Cancel
                </Button>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

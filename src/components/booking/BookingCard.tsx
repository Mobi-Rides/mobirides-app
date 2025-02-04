import { format } from "date-fns";
import { Calendar, Clock, MapPin } from "lucide-react";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Booking } from "@/types/booking";

interface BookingCardProps {
  booking: Booking;
  onCancelBooking: (bookingId: string) => Promise<void>;
}

export const BookingCard = ({ booking, onCancelBooking }: BookingCardProps) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "confirmed":
        return "bg-green-500";
      case "pending":
        return "bg-yellow-500";
      case "cancelled":
        return "bg-red-500";
      default:
        return "bg-gray-500";
    }
  };

  return (
    <Card className="overflow-hidden">
      <div className="relative h-48">
        <img
          src={booking.cars.image_url || "/placeholder.svg"}
          alt={`${booking.cars.brand} ${booking.cars.model}`}
          className="w-full h-full object-cover"
        />
        <Badge 
          className={`absolute top-2 right-2 ${getStatusColor(booking.status)}`}
          variant="secondary"
        >
          {booking.status}
        </Badge>
      </div>
      
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <h3 className="font-semibold text-lg">
              {booking.cars.brand} {booking.cars.model}
            </h3>
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <MapPin className="w-4 h-4" />
              <span>{booking.cars.location}</span>
            </div>
          </div>
          <p className="font-bold text-primary">
            BWP {booking.total_price}
          </p>
        </div>
      </CardHeader>

      <CardContent className="space-y-2">
        <div className="flex items-center gap-2 text-sm">
          <Calendar className="w-4 h-4 text-muted-foreground" />
          <div>
            <p>From: {format(new Date(booking.start_date), "PPP")}</p>
            <p>To: {format(new Date(booking.end_date), "PPP")}</p>
          </div>
        </div>
      </CardContent>

      {booking.status === "pending" && (
        <CardFooter>
          <Button
            variant="destructive"
            className="w-full"
            onClick={() => onCancelBooking(booking.id)}
          >
            Cancel Booking
          </Button>
        </CardFooter>
      )}
    </Card>
  );
};
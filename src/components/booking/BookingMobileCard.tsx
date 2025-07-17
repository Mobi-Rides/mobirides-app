import { format, differenceInDays, parseISO } from "date-fns";
import { BookingWithDetails } from "@/services/api/BookingService";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Clock, Check, X, MapPin, CalendarDays } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface BookingMobileCardProps {
  booking: BookingWithDetails;
  onCancelBooking: (bookingId: string) => Promise<void>;
  // Add new props for approve, decline, and message actions
  onApproveBooking: (bookingId: string) => Promise<void>;
  onDeclineBooking: (bookingId: string) => Promise<void>;
  onMessage: (renterId: string, bookingId: string) => Promise<void>; // Assuming you'll need renterId for messaging
  selectedBookingIds?: string[];
  toggleSelectBooking?: (bookingId: string) => void;
}

// Helper to calculate duration label
const getDurationLabel = (start: string, end: string) => {
  if (!start || !end) return "N/A";
  const days = differenceInDays(parseISO(end), parseISO(start)) + 1;
  return `${days} day${days !== 1 ? "s" : ""}`;
};

export const BookingMobileCard = ({
  booking,
  onCancelBooking,
  onApproveBooking,
  onDeclineBooking,
  onMessage,
  selectedBookingIds = [],
  toggleSelectBooking,
}: BookingMobileCardProps) => {
  const navigate = useNavigate();

  const handleCardClick = () => {
    // Navigate only if booking.id is available
    if (booking.id) {
      navigate(`/rental-details/${booking.id}`);
    } else {
      console.warn("Attempted to navigate with a null booking ID.");
      // Optionally show a toast or alert to the user
    }
  };

  const handleCancelClick = (e: React.MouseEvent) => {
    e.stopPropagation();
     if (booking.id) { // Ensure booking.id exists before calling onCancelBooking
      onCancelBooking(booking.id);
    } else {
      console.warn("Attempted to cancel booking with a null booking ID.");
    }
  };
  // New handlers for approve, decline, and message
  const handleApproveClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (booking.id) {
      onApproveBooking(booking.id);
    } else {
      console.warn("Attempted to approve booking with a null booking ID.");
    }
  };

  const handleDeclineClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (booking.id) {
      onDeclineBooking(booking.id);
    } else {
      console.warn("Attempted to decline booking with a null booking ID.");
    }
  };
   const handleMessageClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    // Assuming 'renter' object exists and has an 'id'
    if (booking.profiles?.full_name && booking.id) {
      onMessage(booking.profiles.full_name, booking.id);
    } else {
      console.warn("Attempted to message renter with missing renter ID or booking ID.");
    }
  };

  const getStatusBadge = () => {
    switch (booking.status) {
      case "pending":
        return <Badge variant="outline" className="flex items-center gap-1 w-24  h-2 text-xs "><Clock className="h-3 w-3" /> Pending</Badge>;
      case "confirmed":
        return <Badge variant="success" className="bg-green-100 text-green-800 flex items-center gap-1 w-24  h-2text-xs"><Check className="h-3 w-3" /> Confirmed</Badge>;
      case "cancelled":
        return <Badge variant="destructive" className="flex items-center gap-1 w-24  h-2text-xs"><X className="h-3 w-3" /> Cancelled</Badge>;
      case "completed":
        return <Badge variant="default" className="flex items-center gap-1 w-24  h-2text-xs"><Check className="h-3 w-3" /> Completed</Badge>;
      case "in_progress":
        return <Badge className="bg-blue-100 text-blue-800 flex items-center gap-1 w-24 h-2 text-xs"><Clock className="h-3 w-3" /> In Progress</Badge>;
      case "expired":
        return <Badge variant="secondary" className="flex items-center gap-1 w-24 h-2 text-xs"><X className="h-3 w-3" /> Expired</Badge>;  
      default:
        return <Badge>{booking.status || "Unknown Status"}</Badge>;
    }
  };

  // Safely get car details, providing fallbacks if booking.cars is null
  const carBrand = booking.cars?.brand ?? "Brand";
  const carModel = booking.cars?.model ?? "Model";
  const carImageUrl = booking.cars?.image_url ?? "/placeholder.png";
  const carLocation = booking.cars?.location ?? "Unknown Location";

  return (
    <Card
      className={`cursor-pointer hover:bg-muted/50 transition-colors overflow-hidden ${
        selectedBookingIds.includes(booking.id) ? 'ring-2 ring-blue-500 bg-blue-50' : ''
      }`}
      onClick={(e) => {
        // If clicking on action buttons, don't toggle selection
        if ((e.target as HTMLElement).closest('button')) {
          return;
        }
        toggleSelectBooking?.(booking.id);
      }}
    >
      <CardContent className="p-4">
        <div className="flex flex-col gap-3">
          <div className="flex gap-3">
            <img
              src={carImageUrl} // Use the safely retrieved image URL
              alt={`${carBrand} ${carModel}`} // Use safely retrieved brand and model
              className="w-20 h-20 object-cover rounded-md flex-shrink-0"
            />
            <div className="flex-1 min-w-0">
              <div className="mb-3">{getStatusBadge()}</div>
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-medium truncate">
                    {carBrand} {carModel} {/* Use safely retrieved brand and model */}
                  </h3>
                </div>
              </div>
            </div>
          </div>

          <div className="text-sm space-y-2">
            <p className="text-xs text-muted-foreground truncate mb-1 flex items-center gap-1">
              <MapPin size={12} className="text-red-500" />{" "}
              {carLocation}
            </p>
            <div className="flex flex-col justify-start items-start">
              <span className="font-medium flex gap-1">
                <span className="flex items-center gap-1">
                  <CalendarDays size={12} className="text-blue-500" />{" "}
                  {/* Ensure dates are valid before formatting */}
                  {booking.start_date ? format(new Date(booking.start_date), "PP") : "N/A"} -
                </span>{" "}
                <span className="flex items-center gap-1">
                  <CalendarDays size={12} className="text-blue-500" />{" "}
                  {/* Ensure dates are valid before formatting */}
                  {booking.end_date ? format(new Date(booking.end_date), "PP") : "N/A"}
                </span>
              </span>
              {/* Booking Duration - prominent */}
              <span className="flex items-center gap-1 mt-1">
                <Clock className="w-5 h-5 text-primary" />
                <span className="font-bold text-base text-primary">{getDurationLabel(booking.start_date, booking.end_date)}</span>
              </span>
            </div>
            <div className="flex justify-end items-center">
              <span className="font-medium text-base text-primary">
                BWP {booking.total_price}</span>
            </div>
          </div>
          {/* New action buttons for pending bookings */}
          {booking.status === "pending" && (
            <div className="flex justify-end mt-2 gap-2">
              <Button variant="default" size="sm" onClick={handleApproveClick}>
                Approve
              </Button>
              <Button variant="destructive" size="sm" onClick={handleDeclineClick}>
                Decline
              </Button>
              <Button variant="outline" size="sm" onClick={handleMessageClick}>
                Message
              </Button>
            </div>
          )}

          {booking.status === "pending" && (
            <div className="flex justify-end mt-1">
              <Button variant="outline" size="sm" onClick={handleCancelClick}>
                Cancel
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

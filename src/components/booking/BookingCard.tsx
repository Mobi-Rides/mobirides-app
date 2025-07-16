import { format } from "date-fns";
import { Booking } from "@/types/booking";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Clock, Check, X, MapPin, CalendarDays, MoreVertical } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { ChatDrawer } from "@/components/chat/ChatDrawer";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";
import { calculateCommission } from "@/services/commission/commissionCalculation";

interface BookingCardProps {
  booking: Booking;
  onCancelBooking: (bookingId: string) => Promise<void>;
  onApproveBooking: (bookingId: string) => Promise<void>;
  onDeclineBooking: (bookingId: string) => Promise<void>;
  onMessage: (otherUserId: string, bookingId: string) => void;
  isHost: boolean;
  showNetEarnings?: boolean;
  commissionRate?: number;
  selectedBookingIds?: string[];
  toggleSelectBooking?: (bookingId: string) => void;
}

export const BookingCard = ({
  booking,
  onCancelBooking,
  onApproveBooking,
  onDeclineBooking,
  onMessage,
  isHost,
  showNetEarnings = false,
  commissionRate = 0.15,
  selectedBookingIds = [],
  toggleSelectBooking,
}: BookingCardProps) => {
  const navigate = useNavigate();
  const [isChatOpen, setIsChatOpen] = useState(false);

  const getStatusBadge = () => {
    switch (booking.status) {
      case "pending":
        return <Badge variant="outline" className="flex items-center gap-1"><Clock className="h-3 w-3" /> Pending</Badge>;
      case "confirmed":
        return <Badge variant="success" className="bg-green-100 text-green-800 flex items-center gap-1"><Check className="h-3 w-3" /> Confirmed</Badge>;
      case "in_progress":
        return <Badge variant="secondary" className="flex items-center gap-1"><Clock className="h-3 w-3" /> In Progress</Badge>;
      case "completed":
        return <Badge variant="default" className="flex items-center gap-1"><Check className="h-3 w-3" /> Completed</Badge>;
      case "cancelled":
        return <Badge variant="destructive" className="flex items-center gap-1"><X className="h-3 w-3" /> Cancelled</Badge>;
      case "expired":
        return <Badge variant="outline" className="flex items-center gap-1"><X className="h-3 w-3" /> Expired</Badge>;
      default:
        return <Badge>{booking.status}</Badge>;
    }
  };

  // Calculate net earnings
  let netEarnings = null;
  if (showNetEarnings) {
    const commission = calculateCommission(booking.total_price, commissionRate);
    netEarnings = commission.hostReceives;
  }

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
      <CardContent className="p-6">
        <div className="flex gap-4">
          {/* Car Image */}
          <img
            src={booking.cars?.image_url || "/placeholder.svg"}
            alt={`${booking.cars?.brand || 'Unknown'} ${booking.cars?.model || 'Car'}`}
            className="w-24 h-24 object-cover rounded-lg flex-shrink-0"
          />
          
          {/* Main Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between mb-3">
              <div>
                <h3 className="font-semibold text-lg truncate">
                  {booking.cars?.brand || 'Brand'} {booking.cars?.model || 'Model'}
                </h3>
                <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                  <MapPin className="h-3 w-3" />
                  {booking.cars?.location || 'Location'}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {getStatusBadge()}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" onClick={(e) => e.stopPropagation()}>
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {isHost && booking.status === "pending" && (
                      <DropdownMenuItem onClick={e => { e.stopPropagation(); onApproveBooking(booking.id); }}>
                        Approve
                      </DropdownMenuItem>
                    )}
                    {isHost && booking.status === "pending" && (
                      <DropdownMenuItem onClick={e => { e.stopPropagation(); onDeclineBooking(booking.id); }}>
                        Decline
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem onClick={e => {
                      e.stopPropagation();
                      const otherUserId = isHost ? booking.renter_id : booking.cars?.owner_id;
                      if (otherUserId) setIsChatOpen(true);
                    }}>
                      Message {isHost ? 'Renter' : 'Host'}
                    </DropdownMenuItem>
                    {(["pending", "confirmed", "in_progress"].includes(booking.status)) && (
                      <DropdownMenuItem onClick={e => { e.stopPropagation(); onCancelBooking(booking.id); }}>
                        Cancel
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={(e) => { e.stopPropagation(); navigate(`/rental-details/${booking.id}`); }}>
                      View Rental Details
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            {/* User Info */}
            <div className="mb-3">
              <p className="text-sm text-muted-foreground">
                {isHost ? 'Rented by' : 'Host'} {isHost ? booking.renters?.full_name : booking.cars?.owner_profile?.full_name}
              </p>
            </div>

            {/* Dates */}
            <div className="flex items-center gap-4 mb-3">
              <div className="flex items-center gap-2 text-sm">
                <CalendarDays className="h-4 w-4 text-blue-500" />
                <span className="font-medium">
                  {booking.start_date ? format(new Date(booking.start_date), "PP") : 'N/A'}
                </span>
                <span className="text-muted-foreground">to</span>
                <span className="font-medium">
                  {booking.end_date ? format(new Date(booking.end_date), "PP") : 'N/A'}
                </span>
              </div>
            </div>

            {/* Price and Earnings */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Total Price</p>
                  <p className="font-semibold text-lg">BWP {booking.total_price}</p>
                </div>
                {showNetEarnings && netEarnings && (
                  <div>
                    <p className="text-sm text-muted-foreground">Net Earnings</p>
                    <p className="font-semibold text-lg text-green-700">BWP {netEarnings.toFixed(2)}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Chat Drawer */}
        {isChatOpen && (
          <ChatDrawer
            isOpen={isChatOpen}
            onClose={() => setIsChatOpen(false)}
            receiverId={isHost ? booking.renter_id : booking.cars?.owner_id}
            receiverName={isHost ? booking.renters?.full_name : booking.cars?.owner_profile?.full_name}
            carId={booking.car_id}
          />
        )}
      </CardContent>
    </Card>
  );
}; 
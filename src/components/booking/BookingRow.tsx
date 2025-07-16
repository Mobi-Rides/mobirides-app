import { format, differenceInDays, parseISO } from "date-fns";
import { TableCell, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Booking } from "@/types/booking";
import { Badge } from "@/components/ui/badge";
import { Clock, Check, X, ArrowRight, Calendar, AlertTriangle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useState } from "react";
import { ChatDrawer } from "@/components/chat/ChatDrawer";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";
import { MoreVertical } from "lucide-react";
import { calculateCommission } from "@/services/commission/commissionCalculation";

interface BookingRowProps {
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

const COMMISSION_RATE = 0.15;

export const BookingRow = ({ booking, onCancelBooking, onApproveBooking, onDeclineBooking, onMessage, isHost, showNetEarnings = false, commissionRate = 0.15, selectedBookingIds = [], toggleSelectBooking }: BookingRowProps) => {
  const navigate = useNavigate();
  const [isChatOpen, setIsChatOpen] = useState(false);

  const handleRowClick = () => {
    navigate(`/rental-details/${booking.id}`);
  };

  // Prevent propagation when clicking cancel button
  const handleCancelClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onCancelBooking(booking.id);
  };

  const getStatusBadge = () => {
    switch (booking.status) {
      case "pending":
        return <Badge variant="outline">Pending</Badge>;
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

  // Helper to calculate duration label
  const getDurationLabel = (start: string, end: string) => {
    if (!start || !end) return "N/A";
    const days = differenceInDays(parseISO(end), parseISO(start)) + 1;
    return `${days} day${days !== 1 ? "s" : ""}`;
  };

  return (
    <TableRow 
      className={`hover:bg-muted/80 transition-colors cursor-pointer ${
        selectedBookingIds.includes(booking.id) ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''
      }`}
      onClick={() => toggleSelectBooking?.(booking.id)}
    >
      <TableCell className="text-left align-top">
        <div className="flex items-center gap-3 pb-2 border-b border-muted/30 mb-2">
          <img
            src={booking.cars?.image_url || "/placeholder.svg"}
            alt={`${booking.cars?.brand || 'Unknown'} ${booking.cars?.model || 'Car'}`}
            className="w-12 h-12 object-cover rounded"
          />
          <div className="min-w-0">
            <p className="font-semibold truncate">
              {booking.cars?.brand || 'Brand'} {booking.cars?.model || 'Model'}
            </p>
            <p className="text-xs text-muted-foreground truncate">
              {booking.cars?.location || 'Location'}
            </p>
          </div>
        </div>
      </TableCell>
      <TableCell className="text-left align-top">
        <span className="font-medium block mb-2">{booking.renters?.full_name ? booking.renters.full_name : 'Unknown'}</span>
      </TableCell>
      <TableCell className="text-left align-top">
        <div className="flex flex-col items-start bg-muted/40 rounded px-2 py-1 gap-1">
          <span className="font-semibold flex items-center gap-1 text-base">
            <Calendar className="w-4 h-4 text-muted-foreground" />
            {booking.start_date ? format(new Date(booking.start_date), "PPP") : 'N/A'}
          </span>
          <span className="text-xs text-muted-foreground">
            to {booking.end_date ? format(new Date(booking.end_date), "PPP") : 'N/A'}
          </span>
          {/* Booking Duration - prominent */}
          <span className="flex items-center gap-1 mt-1">
            <Clock className="w-5 h-5 text-primary" />
            <span className="font-bold text-base text-primary">{getDurationLabel(booking.start_date, booking.end_date)}</span>
          </span>
        </div>
      </TableCell>
      <TableCell className="text-left align-top">
        {getStatusBadge()}
      </TableCell>
      <TableCell className="text-left align-top">
        <p className="font-medium">BWP {booking.total_price}</p>
      </TableCell>
      {showNetEarnings && (
        <TableCell className="text-left align-top">
          <span className="font-bold text-green-700 bg-green-50 px-2 py-1 rounded">
            BWP {netEarnings?.toFixed(2)}
          </span>
        </TableCell>
      )}
      <TableCell className="text-right align-top">
        <div className="border-t border-muted/30 pt-2 mt-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon" className="text-primary border-primary/40">
                <MoreVertical className="h-5 w-5" />
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
              <DropdownMenuItem onClick={() => navigate(`/rental-details/${booking.id}`)}>
                View Rental Details
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          {isChatOpen && (
            <ChatDrawer
              isOpen={isChatOpen}
              onClose={() => setIsChatOpen(false)}
              receiverId={isHost ? booking.renter_id : booking.cars?.owner_id}
              receiverName={isHost ? booking.renters?.full_name : booking.cars?.owner_profile?.full_name}
              carId={booking.car_id}
            />
          )}
        </div>
      </TableCell>
    </TableRow>
    
  );
  
};


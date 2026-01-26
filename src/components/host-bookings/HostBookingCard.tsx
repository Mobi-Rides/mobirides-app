
import { useState } from "react";
import { format, differenceInDays } from "date-fns";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  MessageCircle, 
  Phone, 
  CheckCircle, 
  XCircle, 
  Receipt,
  Calendar,
  MapPin,
  DollarSign,
  RotateCcw
} from "lucide-react";
import { BookingWithRelations } from "@/types/booking";
import { useNavigate } from "react-router-dom";
import { ReceiptModal } from "@/components/shared/ReceiptModal";

interface HostBookingCardProps {
  booking: BookingWithRelations;
  isSelected: boolean;
  onSelect: (selected: boolean) => void;
  onAction: (bookingId: string, action: "approve" | "decline" | "cancel") => void;
}

export const HostBookingCard = ({ booking, isSelected, onSelect, onAction }: HostBookingCardProps) => {
  const navigate = useNavigate();
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [isLoading, setIsLoading] = useState<string | null>(null);

  const handleAction = async (action: "approve" | "decline" | "cancel") => {
    setIsLoading(action);
    await onAction(booking.id, action);
    setIsLoading(null);
  };

  const handleCardClick = () => {
    navigate(`/rental-details/${booking.id}`);
  };

  const getStatusBadge = (status: string) => {
    // Check for early return first
    if (booking.early_return && status === "completed") {
      return (
        <Badge variant="secondary" className="bg-purple-100 text-purple-800 animate-fade-in flex items-center gap-1">
          <RotateCcw className="h-3 w-3" />
          Returned Early
        </Badge>
      );
    }

    const statusConfig = {
      pending: { label: "Pending", variant: "secondary" as const, color: "bg-orange-100 text-orange-800" },
      confirmed: { label: "Confirmed", variant: "default" as const, color: "bg-green-100 text-green-800" },
      completed: { label: "Completed", variant: "default" as const, color: "bg-blue-100 text-blue-800" },
      cancelled: { label: "Cancelled", variant: "destructive" as const, color: "bg-red-100 text-red-800" },
      expired: { label: "Expired", variant: "outline" as const, color: "bg-gray-100 text-gray-800" }
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    
    return (
      <Badge variant={config.variant} className={`${config.color} animate-fade-in`}>
        {config.label}
      </Badge>
    );
  };

  const duration = differenceInDays(new Date(booking.end_date), new Date(booking.start_date)) + 1;
  const commissionRate = 0.15; // 15% commission
  const netEarnings = booking.total_price * (1 - commissionRate);

  return (
    <>
      <Card 
        className="hover:shadow-lg transition-all duration-200 animate-fade-in cursor-pointer"
        onClick={handleCardClick}
      >
        <CardContent className="p-4">
          <div className="flex items-start gap-4">
            {/* Selection Checkbox (only for pending bookings) */}
            {booking.status === 'pending' && (
              <Checkbox
                checked={isSelected}
                onCheckedChange={onSelect}
                onClick={(e) => e.stopPropagation()}
                className="mt-1"
              />
            )}
  
            {/* Car Image */}
            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-lg overflow-hidden flex-shrink-0">
              <img
                src={booking.cars.image_url || "/placeholder.svg"}
                alt={`${booking.cars.brand} ${booking.cars.model}`}
                className="w-full h-full object-cover hover:scale-105 transition-transform duration-200"
              />
            </div>
  
            {/* Main Content */}
            <div className="flex-1 min-w-0 space-y-3">
              {/* Header Row */}
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <h3 className="font-semibold text-lg leading-tight">
                    {booking.cars.brand} {booking.cars.model}
                  </h3>
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <MapPin className="h-3 w-3" />
                    {booking.cars.location}
                  </div>
                </div>
                {getStatusBadge(booking.status)}
              </div>
  
              {/* Renter Info */}
              <div className="flex items-center gap-3 p-2 bg-muted/50 rounded-lg">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={booking.renter?.avatar_url} />
                  <AvatarFallback>
                    {booking.renter?.full_name?.charAt(0) || "R"}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">
                    {booking.renter?.full_name || "Unknown Renter"}
                  </p>
                  {booking.renter?.phone_number && (
                    <p className="text-xs text-muted-foreground">
                      {booking.renter.phone_number}
                    </p>
                  )}
                </div>
              </div>
  
              {/* Booking Details Grid */}
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="space-y-1">
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <Calendar className="h-3 w-3" />
                    <span>Duration</span>
                  </div>
                  <p className="font-medium">
                    {format(new Date(booking.start_date), "MMM dd")} - {format(new Date(booking.end_date), "MMM dd")}
                  </p>
                  <p className="text-xs text-muted-foreground">{duration} days</p>
                </div>
                
                <div className="space-y-1">
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <DollarSign className="h-3 w-3" />
                    <span>Earnings</span>
                  </div>
                  <div className="space-y-0.5">
                    <p className="font-bold text-primary text-base">
                      BWP {netEarnings.toFixed(2)}
                    </p>
                    <p className="text-xs text-muted-foreground line-through">
                      BWP {booking.total_price.toFixed(2)} total
                    </p>
                  </div>
                </div>
              </div>
  
              {/* Action Buttons */}
              <div className="flex flex-wrap gap-2 pt-2">
                {booking.status === 'pending' && (
                  <>
                    <Button
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleAction("approve");
                      }}
                      disabled={isLoading === "approve"}
                      className="flex-1 sm:flex-none animate-scale-in"
                    >
                      <CheckCircle className="h-3 w-3 mr-1" />
                      {isLoading === "approve" ? "Approving..." : "Approve"}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleAction("decline");
                      }}
                      disabled={isLoading === "decline"}
                      className="flex-1 sm:flex-none"
                    >
                      <XCircle className="h-3 w-3 mr-1" />
                      {isLoading === "decline" ? "Declining..." : "Decline"}
                    </Button>
                  </>
                )}
                
                {booking.status === 'confirmed' && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleAction("cancel");
                    }}
                    disabled={isLoading === "cancel"}
                    className="hover-scale"
                  >
                    {isLoading === "cancel" ? "Cancelling..." : "Cancel"}
                  </Button>
                )}
  
                {booking.status === 'completed' && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowReceiptModal(true);
                    }}
                    className="hover-scale"
                  >
                    <Receipt className="h-3 w-3 mr-1" />
                    Receipt
                  </Button>
                )}
  
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate('/messages', {
                      state: {
                        recipientId: booking.renter?.id,
                        recipientName: booking.renter?.full_name || 'Renter'
                      }
                    });
                  }}
                  className="hover-scale"
                >
                  <MessageCircle className="h-3 w-3 mr-1" />
                  Message
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <ReceiptModal
        isOpen={showReceiptModal}
        onClose={() => setShowReceiptModal(false)}
        booking={booking}
      />
    </>
  );
};

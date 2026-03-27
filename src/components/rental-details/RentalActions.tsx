
import React, { useState } from "react";
import { KeyRound, MapPin, Star, Clock, Edit3, CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TooltipProvider, Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useNavigate } from "react-router-dom";
import { ExtensionRequestDialog } from "./ExtensionRequestDialog";
import { Booking } from "@/types/booking";

interface RentalActionsProps {
  bookingId: string;
  booking: Booking;
  canHandover: boolean;
  handoverType: "pickup" | "return";
  isInitiatingHandover: boolean;
  isCompletedRental: boolean;
  isActiveRental: boolean;
  isRenter: boolean;
  pricePerDay?: number;
  onHandoverInitiate: () => void;
  onExtensionRequested?: () => void;
  onPayNow?: () => void;
}

export const RentalActions = ({
  bookingId,
  booking,
  canHandover,
  handoverType,
  isInitiatingHandover,
  isCompletedRental,
  isActiveRental,
  isRenter,
  pricePerDay = 0,
  onHandoverInitiate,
  onExtensionRequested,
  onPayNow
}: RentalActionsProps) => {
  const navigate = useNavigate();
  const [isExtensionDialogOpen, setIsExtensionDialogOpen] = useState(false);



  const handleExtendRental = () => {
    setIsExtensionDialogOpen(true);
  };

  const handleExtensionRequested = () => {
    onExtensionRequested?.();
  };

  return (
    <div className="flex flex-col sm:flex-row gap-3 justify-end pt-4">
      <TooltipProvider>
        {/* Pay Now Button */}
        {booking.status === 'awaiting_payment' && booking.payment_status !== 'paid' && isRenter && (
           <Button
             className="w-full sm:w-auto flex items-center gap-2 bg-primary text-primary-foreground hover:bg-primary/90"
             onClick={onPayNow}
           >
             <CreditCard className="h-4 w-4" />
             Pay Now
           </Button>
        )}

        {/* Only show review button for completed rentals */}
        {isCompletedRental && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                className="w-full sm:w-auto flex items-center gap-2"
                onClick={() => navigate(`/rental-review/${bookingId}`)}
              >
                <Star className="h-4 w-4" />
                Write Review
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Share your experience with this vehicle</p>
            </TooltipContent>
          </Tooltip>
        )}

        {/* Extend rental option for active rentals (only renters) */}
        {isActiveRental && isRenter && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                className="w-full sm:w-auto flex items-center gap-2"
                variant="outline"
                onClick={handleExtendRental}
              >
                <Clock className="h-4 w-4" />
                Extend Rental
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Request to extend your rental period</p>
            </TooltipContent>
          </Tooltip>
        )}


        {/* Handover actions (pickup or return) */}
        {canHandover && (
          <Button
            className="w-full sm:w-auto flex items-center gap-2"
            variant="default"
            onClick={onHandoverInitiate}
            disabled={isInitiatingHandover}
          >
            <KeyRound className="h-4 w-4" />
            {isInitiatingHandover
              ? "Initiating..."
              : `Initiate ${handoverType === "pickup" ? "Pickup" : "Return"}`}
          </Button>
        )}

        {/* View handover status for active rentals without pending handover */}
        {isActiveRental && !canHandover && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                className="w-full sm:w-auto flex items-center gap-2"
                variant="outline"
                onClick={() =>
                  navigate(
                    `/map?handover=true&bookingId=${bookingId}&role=${
                      isRenter ? "renter" : "host"
                    }`
                  )
                }
              >
                <MapPin className="h-4 w-4" />
                View Handover Status
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>See the real-time status of your car handover</p>
            </TooltipContent>
          </Tooltip>
        )}
      </TooltipProvider>

      <ExtensionRequestDialog
        open={isExtensionDialogOpen}
        onClose={() => setIsExtensionDialogOpen(false)}
        onSuccess={() => onExtensionRequested?.()}
        bookingId={bookingId}
        currentEndDate={booking.end_date}
        pricePerDay={pricePerDay}
      />
    </div>
  );
};

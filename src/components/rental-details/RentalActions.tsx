
import React, { useState } from "react";
import { KeyRound, MapPin, Star, Clock, Edit3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TooltipProvider, Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useNavigate } from "react-router-dom";
import { ExtensionRequestDialog } from "./ExtensionRequestDialog";
import { ModificationRequestDialog } from "./ModificationRequestDialog";
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
  onHandoverInitiate: () => void;
  onExtensionRequested?: () => void;
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
  onHandoverInitiate,
  onExtensionRequested,
}: RentalActionsProps) => {
  const navigate = useNavigate();
  const [isExtensionDialogOpen, setIsExtensionDialogOpen] = useState(false);
  const [isModificationDialogOpen, setIsModificationDialogOpen] = useState(false);

  const handleExtendRental = () => {
    setIsExtensionDialogOpen(true);
  };

  const handleModifyBooking = () => {
    setIsModificationDialogOpen(true);
  };

  const handleExtensionRequested = () => {
    onExtensionRequested?.();
  };

  const handleModificationRequested = () => {
    onExtensionRequested?.(); // Use same refresh function
  };

  return (
    <div className="flex flex-col sm:flex-row gap-3 justify-end pt-4">
      <TooltipProvider>
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

        {/* Modify booking option for confirmed/active rentals (only renters) */}
        {(isActiveRental || booking.status === 'confirmed') && isRenter && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                className="w-full sm:w-auto flex items-center gap-2"
                variant="outline"
                onClick={handleModifyBooking}
              >
                <Edit3 className="h-4 w-4" />
                Modify Booking
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Change pickup time or location</p>
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

      {/* Extension Request Dialog */}
      <ExtensionRequestDialog
        isOpen={isExtensionDialogOpen}
        onClose={() => setIsExtensionDialogOpen(false)}
        booking={booking}
        onExtensionRequested={handleExtensionRequested}
      />

      {/* Modification Request Dialog */}
      <ModificationRequestDialog
        isOpen={isModificationDialogOpen}
        onClose={() => setIsModificationDialogOpen(false)}
        booking={booking}
        onModificationRequested={handleModificationRequested}
      />
    </div>
  );
};

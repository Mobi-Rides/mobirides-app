
import { KeyRound, MapPin, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TooltipProvider, Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useNavigate } from "react-router-dom";

interface RentalActionsProps {
  bookingId: string;
  canHandover: boolean;
  handoverType: "pickup" | "return";
  isInitiatingHandover: boolean;
  isCompletedRental: boolean;
  isActiveRental: boolean;
  isRenter: boolean;
  onHandoverInitiate: () => void;
}

export const RentalActions = ({
  bookingId,
  canHandover,
  handoverType,
  isInitiatingHandover,
  isCompletedRental,
  isActiveRental,
  isRenter,
  onHandoverInitiate,
}: RentalActionsProps) => {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col sm:flex-row gap-3 justify-end pt-4">
      <TooltipProvider>
        {(isCompletedRental || isActiveRental) && (
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
    </div>
  );
};

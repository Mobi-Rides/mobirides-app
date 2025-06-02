
import { Button } from "@/components/ui/button";
import { CardFooter } from "@/components/ui/card";
import { CheckCircle, XCircle, AlertCircle } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface BookingActionsProps {
  isCarOwner: boolean;
  isRenter: boolean;
  canApproveBooking: boolean;
  onApprove: () => void;
  onCancel: () => void;
  isLoading: boolean;
}

export const BookingActions = ({
  isCarOwner,
  isRenter,
  canApproveBooking,
  onApprove,
  onCancel,
  isLoading
}: BookingActionsProps) => {
  if (isCarOwner) {
    return (
      <CardFooter className="border-t bg-card p-6 flex flex-col sm:flex-row gap-4 justify-end">
        <Button 
          variant="outline" 
          className="flex items-center gap-2 w-full sm:w-auto" 
          onClick={onCancel} 
          disabled={isLoading}
        >
          <XCircle className="h-4 w-4" />
          Reject Request
        </Button>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="w-full sm:w-auto">
                <Button 
                  className="flex items-center gap-2 w-full sm:w-auto" 
                  onClick={onApprove} 
                  disabled={isLoading || !canApproveBooking}
                >
                  <CheckCircle className="h-4 w-4" />
                  Approve Request
                </Button>
              </div>
            </TooltipTrigger>
            {!canApproveBooking && (
              <TooltipContent>
                <p>Insufficient wallet balance for commission payment</p>
              </TooltipContent>
            )}
          </Tooltip>
        </TooltipProvider>
      </CardFooter>
    );
  }

  if (isRenter) {
    return (
      <CardFooter className="border-t bg-card p-6 flex flex-col sm:flex-row gap-4 justify-end">
        <Button 
          variant="outline" 
          className="flex items-center gap-2 w-full sm:w-auto" 
          onClick={onCancel} 
          disabled={isLoading}
        >
          <XCircle className="h-4 w-4" />
          Cancel Request
        </Button>
      </CardFooter>
    );
  }

  return (
    <CardFooter className="border-t bg-card p-6">
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex items-center text-muted-foreground gap-2">
              <AlertCircle className="h-4 w-4" />
              <span className="text-sm">Only car owners can approve requests</span>
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <p>You don't have permission to manage this booking request</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </CardFooter>
  );
};

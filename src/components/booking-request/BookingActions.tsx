
import { Button } from "@/components/ui/button";
import { CardFooter } from "@/components/ui/card";
import { CheckCircle, XCircle, AlertCircle, MessageCircle } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface BookingActionsProps {
  isCarOwner: boolean;
  isRenter: boolean;
  canApproveBooking: boolean;
  onApprove: () => void;
  onCancel: () => void;
  onContact: () => void;
  isLoading: boolean;
}

export const BookingActions = ({
  isCarOwner,
  isRenter,
  canApproveBooking,
  onApprove,
  onCancel,
  onContact,
  isLoading
}: BookingActionsProps) => {
  if (isCarOwner) {
    return (
      <CardFooter className="border-t bg-card p-6 flex flex-col sm:flex-row gap-3 justify-end">
        {/* Secondary action - Contact */}
        <Button 
          variant="outline" 
          className="flex items-center gap-2 w-full sm:w-auto order-3 sm:order-1" 
          onClick={onContact} 
          disabled={isLoading}
        >
          <MessageCircle className="h-4 w-4" />
          Contact Renter
        </Button>
        
        {/* Primary destructive action - Reject */}
        <Button 
          variant="outline" 
          className="flex items-center gap-2 w-full sm:w-auto order-2 sm:order-2 text-destructive border-destructive hover:bg-destructive hover:text-destructive-foreground" 
          onClick={onCancel} 
          disabled={isLoading}
        >
          <XCircle className="h-4 w-4" />
          Reject Request
        </Button>
        
        {/* Primary CTA - Approve */}
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="w-full sm:w-auto order-1 sm:order-3">
                <Button 
                  variant="default"
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
      <CardFooter className="border-t bg-card p-6 flex flex-col sm:flex-row gap-3 justify-end">
        {/* Secondary action - Contact */}
        <Button 
          variant="outline" 
          className="flex items-center gap-2 w-full sm:w-auto order-2 sm:order-1" 
          onClick={onContact} 
          disabled={isLoading}
        >
          <MessageCircle className="h-4 w-4" />
          Contact Host
        </Button>
        
        {/* Primary destructive action - Cancel */}
        <Button 
          variant="outline" 
          className="flex items-center gap-2 w-full sm:w-auto order-1 sm:order-2 text-destructive border-destructive hover:bg-destructive hover:text-destructive-foreground" 
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


import { useState } from "react";
import { Button } from "@/components/ui/button";
import { CardFooter } from "@/components/ui/card";
import { CheckCircle, XCircle, AlertCircle, MessageCircle } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Checkbox } from "@/components/ui/checkbox";

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
  const [hostTermsAccepted, setHostTermsAccepted] = useState(false);

  if (isCarOwner) {
    return (
      <CardFooter className="border-t bg-card p-6 flex flex-col gap-4">
        {/* Host Terms Checkbox */}
        <div className="flex items-start gap-3 p-4 w-full rounded-xl border border-muted bg-muted/30 hover:bg-muted/50 transition-colors">
          <Checkbox
            id="host-terms"
            checked={hostTermsAccepted}
            onCheckedChange={(checked) => setHostTermsAccepted(checked === true)}
            className="mt-0.5"
          />
          <div className="space-y-1">
            <label
              htmlFor="host-terms"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer text-left"
            >
              I agree to the <a href="/terms/host" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline font-semibold">Host Terms and Conditions</a>
            </label>
            <p className="text-xs text-muted-foreground text-left">
              By checking this, you agree to fulfill the rental request in compliance with Mobi Rides terms, including vehicle maintenance, insurance coverage, and payout schedules.
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-end w-full">
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
                    disabled={isLoading || !canApproveBooking || !hostTermsAccepted}
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
        </div>
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

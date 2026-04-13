
import React from "react";
import { Button } from "@/components/ui/button";
import { PartyPopper, CheckCircle2, Loader2 } from "lucide-react";
import { DualPartyStepCard } from "../DualPartyStepCard";

interface HandoverCompletionStepProps {
  hostCompleted: boolean;
  renterCompleted: boolean;
  onComplete: () => void;
  isSubmitting: boolean;
  userRole: "host" | "renter";
}

export const HandoverCompletionStep: React.FC<HandoverCompletionStepProps> = ({
  hostCompleted,
  renterCompleted,
  onComplete,
  isSubmitting,
  userRole
}) => {
  const isMyPartDone = userRole === "host" ? hostCompleted : renterCompleted;

  return (
    <DualPartyStepCard
      title="Complete Handover"
      description="Final confirmation from both parties to close this session."
      hostCompleted={hostCompleted}
      renterCompleted={renterCompleted}
    >
      <div className="flex flex-col items-center space-y-6 py-4">
        <div className="bg-primary/10 p-6 rounded-full">
          <PartyPopper className="h-12 w-12 text-primary animate-bounce" />
        </div>
        
        <div className="text-center space-y-2">
          <h3 className="text-xl font-bold">Ready to roll?</h3>
          <p className="text-sm text-muted-foreground max-w-[280px]">
            Once both parties confirm, the rental officially begins. Enjoy the ride!
          </p>
        </div>

        {!isMyPartDone ? (
          <Button 
            className="w-full h-14 text-lg font-bold shadow-xl bg-green-600 hover:bg-green-700" 
            onClick={onComplete}
            disabled={isSubmitting}
          >
            {isSubmitting ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <CheckCircle2 className="mr-2 h-6 w-6" />}
            Confirm & Start Rental
          </Button>
        ) : (
          <div className="flex items-center gap-2 text-green-600 font-bold bg-green-50 px-6 py-3 rounded-full border border-green-200">
            <CheckCircle2 className="h-6 w-6" />
            <span>Ready for Checkout</span>
          </div>
        )}
      </div>
    </DualPartyStepCard>
  );
};

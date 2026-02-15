
import React from "react";
import { Button } from "@/components/ui/button";
import { MapPin, Check, Loader2 } from "lucide-react";
import { DualPartyStepCard } from "../DualPartyStepCard";

interface ArrivalConfirmationStepProps {
  hostCompleted: boolean;
  renterCompleted: boolean;
  onConfirm: () => void;
  isSubmitting: boolean;
  userRole: "host" | "renter";
}

export const ArrivalConfirmationStep: React.FC<ArrivalConfirmationStepProps> = ({
  hostCompleted,
  renterCompleted,
  onConfirm,
  isSubmitting,
  userRole
}) => {
  const isMyPartDone = userRole === "host" ? hostCompleted : renterCompleted;

  return (
    <DualPartyStepCard
      title="Confirm Arrival"
      description="Please confirm once you have arrived at the handover location and met the other party."
      hostCompleted={hostCompleted}
      renterCompleted={renterCompleted}
    >
      <div className="flex flex-col items-center space-y-4">
        {!isMyPartDone ? (
          <Button 
            className="w-full h-12 text-lg" 
            onClick={onConfirm}
            disabled={isSubmitting}
          >
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            <MapPin className="mr-2 h-5 w-5" />
            I Have Arrived
          </Button>
        ) : (
          <div className="flex items-center gap-2 text-green-600 font-medium bg-green-50 px-4 py-2 rounded-full border border-green-100">
            <Check className="h-5 w-5" />
            <span>Arrival Confirmed</span>
          </div>
        )}
        <p className="text-xs text-muted-foreground text-center">
          Wait for the other party to also confirm their arrival to proceed to identity verification.
        </p>
      </div>
    </DualPartyStepCard>
  );
};

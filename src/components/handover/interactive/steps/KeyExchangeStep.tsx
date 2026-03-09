import React from "react";
import { Button } from "@/components/ui/button";
import { Key, Loader2, CheckCircle2 } from "lucide-react";
import { DualPartyStepCard } from "../DualPartyStepCard";

interface KeyExchangeStepProps {
  hostCompleted: boolean;
  renterCompleted: boolean;
  onComplete: () => void;
  isSubmitting: boolean;
  userRole: "host" | "renter";
}

export const KeyExchangeStep: React.FC<KeyExchangeStepProps> = ({
  hostCompleted,
  renterCompleted,
  onComplete,
  isSubmitting,
  userRole,
}) => {
  const isMyPartDone = userRole === "host" ? hostCompleted : renterCompleted;
  const isHost = userRole === "host";

  return (
    <DualPartyStepCard
      title="Key Exchange"
      description="Both parties must confirm the physical key handover."
      hostCompleted={hostCompleted}
      renterCompleted={renterCompleted}
    >
      {!isMyPartDone ? (
        <div className="flex flex-col items-center space-y-6 py-2">
          <div className="bg-primary/10 p-5 rounded-full">
            <Key className="h-10 w-10 text-primary animate-bounce" />
          </div>
          <div className="text-center space-y-2">
            <h3 className="font-bold text-lg">
              {isHost ? "Keys Handed Over?" : "Keys Received?"}
            </h3>
            <p className="text-sm text-muted-foreground max-w-[260px]">
              {isHost
                ? "Confirm that you have physically handed the car keys to the renter."
                : "Confirm that you have physically received the car keys from the host."}
            </p>
          </div>
          <Button
            className="w-full h-14 text-lg font-bold shadow-lg"
            onClick={onComplete}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            ) : (
              <Key className="mr-2 h-5 w-5" />
            )}
            {isHost ? "I Have Handed Over the Keys" : "I Have Received the Keys"}
          </Button>
        </div>
      ) : (
        <div className="flex flex-col items-center py-6 space-y-4">
          <div className="bg-green-100 dark:bg-green-950/30 p-4 rounded-full">
            <CheckCircle2 className="h-8 w-8 text-green-600 dark:text-green-400" />
          </div>
          <p className="font-medium text-green-700 dark:text-green-300">
            {isHost ? "You confirmed key handover" : "You confirmed key receipt"}
          </p>
          <p className="text-sm text-muted-foreground">Waiting for the other party to confirm.</p>
        </div>
      )}
    </DualPartyStepCard>
  );
};

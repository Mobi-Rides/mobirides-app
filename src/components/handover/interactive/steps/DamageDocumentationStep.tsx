
import React from "react";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Check, Loader2 } from "lucide-react";
import { DualPartyStepCard } from "../DualPartyStepCard";
import { DamageDocumentationStep as BaseDamageStep } from "../../steps/DamageDocumentationStep";

interface InteractiveDamageStepProps {
  handoverSessionId: string;
  hostCompleted: boolean;
  renterCompleted: boolean;
  onConfirm: (data: any) => void;
  isSubmitting: boolean;
  userRole: "host" | "renter";
}

export const InteractiveDamageStep: React.FC<InteractiveDamageStepProps> = ({
  handoverSessionId,
  hostCompleted,
  renterCompleted,
  onConfirm,
  isSubmitting,
  userRole
}) => {
  const isMyPartDone = userRole === "host" ? hostCompleted : renterCompleted;

  return (
    <DualPartyStepCard
      title="Damage Documentation"
      description="Both parties must acknowledge the vehicle's condition. If you notice any damage not listed, please add it."
      hostCompleted={hostCompleted}
      renterCompleted={renterCompleted}
    >
      <div className="space-y-6">
        {!isMyPartDone ? (
          <BaseDamageStep 
            handoverSessionId={handoverSessionId}
            onDamageReportsUpdate={() => {}} // We'll handle data in onStepComplete
            onStepComplete={() => onConfirm({})}
          />
        ) : (
          <div className="flex flex-col items-center py-6 space-y-4">
            <div className="bg-green-100 p-4 rounded-full">
              <Check className="h-8 w-8 text-green-600" />
            </div>
            <p className="font-medium text-green-800">You have acknowledged the damage report</p>
            <p className="text-sm text-muted-foreground text-center">
              Waiting for the other party to finish their review.
            </p>
          </div>
        )}
      </div>
    </DualPartyStepCard>
  );
};

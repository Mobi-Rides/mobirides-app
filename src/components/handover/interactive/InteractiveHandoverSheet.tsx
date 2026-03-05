
import React, { useState, useEffect } from "react";
import { X, ChevronLeft, ChevronRight, Loader2, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useInteractiveHandover } from "@/hooks/useInteractiveHandover";
import { WaitingCard } from "./WaitingCard";
import { DualPartyStepCard } from "./DualPartyStepCard";
import { cn } from "@/lib/utils";
import { toast } from "@/utils/toast-utils";

// Import step components
import { LocationSelectionStep } from "./steps/LocationSelectionStep";
import { LocationConfirmationStep } from "./steps/LocationConfirmationStep";
import { EnRouteStep } from "./steps/EnRouteStep";
import { ArrivalConfirmationStep } from "./steps/ArrivalConfirmationStep";
import { IdentityVerificationStep } from "./steps/IdentityVerificationStep";
import { InspectionStep } from "./steps/InspectionStep";
import { InteractiveDamageStep } from "./steps/DamageDocumentationStep";
import { FuelMileageStep } from "./steps/FuelMileageStep";
import { KeyTransferStep } from "./steps/KeyTransferStep";
import { InteractiveSignatureStep } from "./steps/InteractiveSignatureStep";
import { HandoverCompletionStep } from "./steps/HandoverCompletionStep";

interface InteractiveHandoverSheetProps {
  isOpen: boolean;
  onClose: () => void;
  sessionId: string;
}

export const InteractiveHandoverSheet: React.FC<InteractiveHandoverSheetProps> = ({
  isOpen,
  onClose,
  sessionId
}) => {
  const {
    session,
    steps,
    currentStep,
    loading,
    error,
    userRole,
    isMyTurn,
    advanceStep,
    refresh
  } = useInteractiveHandover(sessionId);

  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  if (loading) {
    return (
      <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm">
        <div className="bg-background p-8 rounded-xl shadow-2xl flex flex-col items-center space-y-4">
          <Loader2 className="w-10 h-10 text-primary animate-spin" />
          <p className="text-sm font-medium">Initializing secure handover session...</p>
        </div>
      </div>
    );
  }

  if (error || !session || !currentStep) {
    return (
      <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm">
        <div className="bg-background p-8 rounded-xl shadow-2xl max-w-md w-full text-center space-y-4">
          <div className="bg-destructive/10 p-3 rounded-full w-fit mx-auto">
            <Info className="w-8 h-8 text-destructive" />
          </div>
          <h2 className="text-xl font-bold">Session Error</h2>
          <p className="text-muted-foreground">{error || "Could not load handover session. Please try again."}</p>
          <Button onClick={onClose} className="w-full">Close</Button>
        </div>
      </div>
    );
  }

  const progress = (currentStep.order / steps.length) * 100;

  const handleAdvance = async (data?: any) => {
    setIsSubmitting(true);
    try {
      const success = await advanceStep(data);
      if (success) {
        toast.success("Step completed successfully");
      }
    } catch (err) {
      console.error("Error advancing step:", err);
      toast.error("Failed to complete step. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStepContent = () => {
    // Check if it's the user's turn (or if it's a 'both' step where they haven't completed their part)
    const needsAction = isMyTurn;

    // Even if it's not their turn, we might want to show the step in a read-only/waiting state
    // But for simplicity, we use the WaitingCard if it's strictly not their turn
    if (!needsAction) {
      return (
        <WaitingCard 
          waitingFor={currentStep.owner} 
          currentStepTitle={currentStep.title} 
        />
      );
    }

    // Common props for steps
    const commonProps = {
      isSubmitting,
      userRole: userRole as "host" | "renter"
    };

    switch (currentStep.name) {
      case "location_selection":
        return (
          <LocationSelectionStep
            onComplete={(data) => handleAdvance(data)}
            isSubmitting={isSubmitting}
          />
        );

      case "location_confirmation":
        return (
          <LocationConfirmationStep
            locationData={{
              latitude: session.handover_location_lat || 0,
              longitude: session.handover_location_lng || 0,
              address: session.handover_location_name || "Unknown Location"
            }}
            onConfirm={() => handleAdvance({ confirmed: true })}
            onReject={() => toast.info("Rejection flow not yet implemented - please confirm for now")}
            isSubmitting={isSubmitting}
          />
        );

      case "en_route_confirmation":
      case "host_en_route":
        return (
          <EnRouteStep
            title={currentStep.title}
            description={currentStep.description}
            onConfirm={() => handleAdvance({ en_route: true, timestamp: new Date().toISOString() })}
            isSubmitting={isSubmitting}
            role={userRole as "host" | "renter"}
          />
        );

      case "arrival_confirmation":
        return (
          <ArrivalConfirmationStep
            hostCompleted={currentStep.host_completed}
            renterCompleted={currentStep.renter_completed}
            onConfirm={() => handleAdvance({ arrived: true, timestamp: new Date().toISOString() })}
            isSubmitting={isSubmitting}
            userRole={userRole as "host" | "renter"}
          />
        );

      case "identity_verification":
        return (
          <IdentityVerificationStep
            handoverSessionId={sessionId}
            onComplete={(data) => handleAdvance(data)}
            isSubmitting={isSubmitting}
            userRole={userRole as "host" | "renter"}
          />
        );

      case "vehicle_inspection_exterior":
        return (
          <InspectionStep
            title="Exterior Inspection"
            description="Take photos of the vehicle exterior from all angles."
            type="exterior"
            handoverSessionId={sessionId}
            onComplete={(data) => handleAdvance(data)}
            isSubmitting={isSubmitting}
          />
        );

      case "vehicle_inspection_interior":
        return (
          <InspectionStep
            title="Interior Inspection"
            description="Take photos of the vehicle interior, including dashboard and seats."
            type="interior"
            handoverSessionId={sessionId}
            onComplete={(data) => handleAdvance(data)}
            isSubmitting={isSubmitting}
          />
        );

      case "damage_documentation":
        return (
          <InteractiveDamageStep
            handoverSessionId={sessionId}
            hostCompleted={currentStep.host_completed}
            renterCompleted={currentStep.renter_completed}
            onConfirm={(data) => handleAdvance(data)}
            isSubmitting={isSubmitting}
            userRole={userRole as "host" | "renter"}
          />
        );

      case "fuel_mileage_check":
        return (
          <FuelMileageStep
            handoverSessionId={sessionId}
            onComplete={(data) => handleAdvance(data)}
            isSubmitting={isSubmitting}
          />
        );

      case "key_transfer":
      case "key_receipt":
        return (
          <KeyTransferStep
            role={userRole as "host" | "renter"}
            onComplete={() => handleAdvance({ keys_exchanged: true })}
            isSubmitting={isSubmitting}
          />
        );

      case "digital_signature":
        return (
          <InteractiveSignatureStep
            hostCompleted={currentStep.host_completed}
            renterCompleted={currentStep.renter_completed}
            onComplete={(data) => handleAdvance(data)}
            isSubmitting={isSubmitting}
            userRole={userRole as "host" | "renter"}
          />
        );

      case "completion":
        return (
          <HandoverCompletionStep
            hostCompleted={currentStep.host_completed}
            renterCompleted={currentStep.renter_completed}
            onComplete={() => handleAdvance({ completed: true })}
            isSubmitting={isSubmitting}
            userRole={userRole as "host" | "renter"}
          />
        );

      default:
        return (
          <div className="p-4 text-center">
            <p className="text-muted-foreground">Unknown step type: {currentStep.name}</p>
            <Button onClick={() => handleAdvance()} className="mt-4">Skip Step</Button>
          </div>
        );
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex flex-col bg-background md:max-w-2xl md:mx-auto md:my-8 md:rounded-2xl md:shadow-2xl md:border md:h-[calc(100vh-4rem)]">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b">
        <div className="flex flex-col">
          <h2 className="text-lg font-bold">Vehicle Handover</h2>
          <span className="text-xs text-muted-foreground">Session: {sessionId.split('-')[0]}...</span>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full">
          <X className="w-5 h-5" />
        </Button>
      </div>

      {/* Progress Bar */}
      <div className="px-6 py-4 bg-muted/20">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Step {currentStep.order} of {steps.length}
          </span>
          <span className="text-xs font-bold text-primary">
            {Math.round(progress)}% Complete
          </span>
        </div>
        <Progress value={progress} className="h-1.5" />
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-6 py-8">
        {renderStepContent()}
      </div>

      {/* Footer info */}
      <div className="px-6 py-4 border-t bg-muted/10 text-center">
        <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-medium">
          MobiRides Secure Interactive Handover System
        </p>
      </div>
    </div>
  );
};

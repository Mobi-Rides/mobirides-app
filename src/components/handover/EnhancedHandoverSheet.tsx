
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { X, CheckCircle, Clock, AlertCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { useHandover } from "@/contexts/HandoverContext";
import { completeHandover } from "@/services/handoverService";
import { 
  HANDOVER_STEPS, 
  initializeHandoverSteps, 
  getHandoverSteps, 
  completeHandoverStep,
  createVehicleConditionReport,
  VehiclePhoto,
  DamageReport,
  HandoverStepCompletion
} from "@/services/enhancedHandoverService";
import { IdentityVerificationStep } from "./steps/IdentityVerificationStep";
import { VehicleInspectionStep } from "./steps/VehicleInspectionStep";
import { DamageDocumentationStep } from "./steps/DamageDocumentationStep";
import { FuelMileageStep } from "./steps/FuelMileageStep";
import { KeyTransferStep } from "./steps/KeyTransferStep";
import { DigitalSignatureStep } from "./steps/DigitalSignatureStep";
import { HandoverSuccessPopup } from "./HandoverSuccessPopup";
import { toast } from "@/utils/toast-utils";

interface EnhancedHandoverSheetProps {
  isOpen: boolean;
  onClose: () => void;
  bookingId: string; // Changed from handoverSessionId to bookingId to be clear
}

export const EnhancedHandoverSheet = ({
  isOpen,
  onClose,
  bookingId
}: EnhancedHandoverSheetProps) => {
  const navigate = useNavigate();
  const { isLoading, isHandoverSessionLoading, isHost, bookingDetails, handoverId, currentUserId } = useHandover();
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<HandoverStepCompletion[]>([]);
  const [vehiclePhotos, setVehiclePhotos] = useState<VehiclePhoto[]>([]);
  const [damageReports, setDamageReports] = useState<DamageReport[]>([]);
  const [fuelLevel, setFuelLevel] = useState<number>();
  const [mileage, setMileage] = useState<number>();
  const [digitalSignature, setDigitalSignature] = useState<string>();
  const [isHandoverCompleted, setIsHandoverCompleted] = useState(false);

  useEffect(() => {
    if (handoverId && isOpen && !isHandoverSessionLoading) {
      initializeHandover();
    }
  }, [handoverId, isOpen, isHandoverSessionLoading]);

  const initializeHandover = async () => {
    if (!handoverId) {
      console.error("Cannot initialize handover: missing handover session ID");
      toast.error("Handover session not found");
      return;
    }

    console.log("Initializing handover for session:", handoverId);
    
    try {
      // Initialize steps if not already done
      await initializeHandoverSteps(handoverId);
      
      // Load existing progress
      const steps = await getHandoverSteps(handoverId);
      console.log("Loaded handover steps:", steps);
      console.log("Steps completion status:", steps.map(s => ({ name: s.step_name, completed: s.is_completed })));
      setCompletedSteps(steps);
      
      // Find current step (first incomplete step)
      const firstIncomplete = steps.findIndex(step => !step.is_completed);
      const calculatedCurrentStep = firstIncomplete >= 0 ? firstIncomplete : steps.length;
      console.log("First incomplete step index:", firstIncomplete);
      console.log("Setting current step to:", calculatedCurrentStep);
      setCurrentStep(calculatedCurrentStep);
      
      // Show user progress if they have completed some steps
      const completedCount = steps.filter(s => s.is_completed).length;
      if (completedCount > 0) {
        toast.success(`Continuing handover process - ${completedCount}/${steps.length} steps completed`);
      }
      
      console.log("Handover initialized successfully");
    } catch (error) {
      console.error("Error initializing handover:", error);
      toast.error("Failed to initialize handover process");
    }
  };

  const handleStepComplete = async (stepName: string, data?: any) => {
    if (!handoverId) {
      toast.error("Handover session not found");
      return;
    }

    const success = await completeHandoverStep(handoverId, stepName, data);
    if (success) {
      // Refresh steps
      const updatedSteps = await getHandoverSteps(handoverId);
      setCompletedSteps(updatedSteps);
      
      // Move to next step
      const nextIncomplete = updatedSteps.findIndex(step => !step.is_completed);
      if (nextIncomplete >= 0) {
        setCurrentStep(nextIncomplete);
      } else {
        // All steps completed
        await handleHandoverComplete();
      }
    }
  };

  const handleHandoverComplete = async () => {
    console.log("Starting handover completion...");
    try {
      // Complete the handover session
      if (handoverId) {
        console.log("Completing handover session:", handoverId);
        await completeHandover(handoverId);
      }

      // Create final vehicle condition report only if we have meaningful data
      if (vehiclePhotos.length > 0 || damageReports.length > 0 || fuelLevel !== undefined || mileage !== undefined) {
        console.log("Creating vehicle condition report...");
        const reportData = {
          handover_session_id: handoverId,
          booking_id: bookingDetails?.id || "",
          car_id: bookingDetails?.car?.id || "",
          report_type: 'pickup' as const,
          vehicle_photos: vehiclePhotos,
          damage_reports: damageReports,
          fuel_level: fuelLevel,
          mileage: mileage,
          digital_signature_data: digitalSignature,
          is_acknowledged: true,
          reporter_id: currentUserId
        };

        const result = await createVehicleConditionReport(reportData);
        if (!result) {
          throw new Error("Failed to create vehicle condition report");
        }
        console.log("Vehicle condition report created successfully");
      }

      // Show success popup and redirect
      console.log("Setting handover completed to true, isHost:", isHost);
      setIsHandoverCompleted(true);
    } catch (error) {
      console.error("Error completing handover:", error);
      toast.error("Failed to complete handover. Please try again.");
    }
  };

  const handleSuccessPopupClose = () => {
    console.log("Success popup closing, isHost:", isHost);
    setIsHandoverCompleted(false);
    onClose();
    
    // Navigate to appropriate bookings page
    if (isHost) {
      console.log("Navigating to host-bookings");
      navigate("/host-bookings");
    } else {
      console.log("Navigating to renter-bookings");
      navigate("/renter-bookings");
    }
  };

  const canProceedToNextStep = (stepName: string) => {
    switch (stepName) {
      case "identity_verification":
        return true; // Can always proceed after identity verification
      case "vehicle_inspection_exterior": {
        const exteriorPhotos = vehiclePhotos.filter(p => p.type && p.type.startsWith('exterior_'));
        return exteriorPhotos.length >= 4; // Front, back, left, right
      }
      case "vehicle_inspection_interior": {
        const interiorPhotos = vehiclePhotos.filter(p => 
          p.type && (p.type.startsWith('interior_') || ['fuel_gauge', 'odometer'].includes(p.type))
        );
        return interiorPhotos.length >= 4; // Dashboard, seats, fuel gauge, odometer
      }
      case "damage_documentation":
        return true; // Can proceed with or without damage reports
      case "fuel_mileage_check":
        return fuelLevel !== undefined && mileage !== undefined;
      case "key_transfer":
        return true; // Can proceed after acknowledgment
      case "digital_signature":
        return digitalSignature !== undefined;
      default:
        return true;
    }
  };

  const getStepComponent = (step: typeof HANDOVER_STEPS[0], stepIndex: number) => {
    const otherUser = isHost ? bookingDetails?.renter : bookingDetails?.car?.owner;
    
    switch (step.name) {
      case "identity_verification":
        return (
          <IdentityVerificationStep
            handoverSessionId={handoverId || ""}
            otherUserId={otherUser?.id || ""}
            otherUserName={otherUser?.full_name || "User"}
            isHost={isHost}
            onStepComplete={() => handleStepComplete(step.name)}
          />
        );
        
      case "vehicle_inspection_exterior":
        return (
          <VehicleInspectionStep
            handoverSessionId={handoverId || ""}
            inspectionType="exterior"
            onPhotosUpdate={(photos) => {
              const filteredPhotos = vehiclePhotos.filter(p => p.type && !p.type.startsWith('exterior_'));
              setVehiclePhotos([...filteredPhotos, ...photos]);
            }}
            onStepComplete={() => handleStepComplete(step.name)}
            initialPhotos={vehiclePhotos.filter(p => p.type && p.type.startsWith('exterior_'))}
          />
        );
        
      case "vehicle_inspection_interior":
        return (
          <VehicleInspectionStep
            handoverSessionId={handoverId || ""}
            inspectionType="interior"
            onPhotosUpdate={(photos) => {
              const filteredPhotos = vehiclePhotos.filter(p => p.type && !p.type.startsWith('interior_') && !['fuel_gauge', 'odometer'].includes(p.type));
              setVehiclePhotos([...filteredPhotos, ...photos]);
            }}
            onStepComplete={() => handleStepComplete(step.name)}
            initialPhotos={vehiclePhotos.filter(p => p.type && (p.type.startsWith('interior_') || ['fuel_gauge', 'odometer'].includes(p.type)))}
          />
        );
        
      case "damage_documentation":
        return (
          <DamageDocumentationStep
            handoverSessionId={handoverId || ""}
            onDamageReportsUpdate={setDamageReports}
            onStepComplete={() => handleStepComplete(step.name)}
            initialReports={damageReports}
          />
        );

      case "fuel_mileage_check":
        return (
          <FuelMileageStep
            handoverSessionId={handoverId || ""}
            onFuelLevelChange={setFuelLevel}
            onMileageChange={setMileage}
            onStepComplete={() => handleStepComplete(step.name, { fuel_level: fuelLevel, mileage })}
            initialFuelLevel={fuelLevel}
            initialMileage={mileage}
          />
        );

      case "key_transfer":
        return (
          <KeyTransferStep
            handoverSessionId={handoverId || ""}
            otherUserName={otherUser?.full_name || "User"}
            isHost={isHost}
            onStepComplete={() => handleStepComplete(step.name)}
          />
        );

      case "digital_signature":
        return (
          <DigitalSignatureStep
            handoverSessionId={handoverId || ""}
            onSignatureComplete={(signature) => {
              setDigitalSignature(signature);
              handleStepComplete(step.name, { signature });
            }}
            initialSignature={digitalSignature}
          />
        );
        
      default:
        return (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <h3 className="font-medium mb-2">{step.title}</h3>
                <p className="text-sm text-muted-foreground mb-4">{step.description}</p>
                <Button 
                  onClick={() => handleStepComplete(step.name)}
                  disabled={!canProceedToNextStep(step.name)}
                >
                  Complete {step.title}
                </Button>
              </div>
            </CardContent>
          </Card>
        );
    }
  };

  if (isLoading || isHandoverSessionLoading) {
    return (
      <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50">
        <Card className="w-96">
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p>
                {isHandoverSessionLoading 
                  ? "Setting up handover session..." 
                  : "Loading handover process..."
                }
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show error if handover session couldn't be loaded
  if (!handoverId && !isHandoverSessionLoading) {
    return (
      <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50">
        <Card className="w-96">
          <CardContent className="pt-6">
            <div className="text-center">
              <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Handover Session Not Found</h3>
              <p className="text-muted-foreground mb-4">
                Unable to load the handover session. Please try refreshing the page.
              </p>
              <Button onClick={onClose} variant="outline">
                Close
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const progress = (completedSteps.filter(s => s.is_completed).length / HANDOVER_STEPS.length) * 100;
  const currentStepData = HANDOVER_STEPS[currentStep];

  return (
    <>
      {isHandoverCompleted && (
        <>
          {console.log("Rendering HandoverSuccessPopup with isHost:", isHost)}
          <HandoverSuccessPopup 
            isHost={isHost} 
            onClose={handleSuccessPopupClose}
          />
        </>
      )}
      
      <div
        className="fixed inset-0 z-[9999] pointer-events-none"
        style={{ display: isOpen ? "block" : "none" }}
      >
        <div
          className="absolute inset-0 bg-black/50 pointer-events-auto"
          onClick={onClose}
        />
        <div className="absolute bottom-0 left-0 right-0 h-[90vh] bg-background rounded-t-xl shadow-lg overflow-y-auto pointer-events-auto">
          <div className="p-6">
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-xl font-semibold">Vehicle Handover</h2>
              <p className="text-sm text-muted-foreground">
                {bookingDetails?.car?.brand} {bookingDetails?.car?.model}
              </p>
            </div>
            <button
              onClick={onClose}
              className="rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Progress */}
          <div className="mb-6">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium">Progress</span>
              <span className="text-sm text-muted-foreground">
                {completedSteps.filter(s => s.is_completed).length} of {HANDOVER_STEPS.length} steps
              </span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>

          {/* Steps Overview */}
          <div className="mb-6">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {HANDOVER_STEPS.map((step, index) => {
                const stepCompletion = completedSteps.find(s => s.step_name === step.name);
                const isCompleted = stepCompletion?.is_completed || false;
                const isCurrent = index === currentStep;
                
                return (
                  <div
                    key={step.name}
                    className={`p-2 rounded-lg text-center border ${
                      isCompleted 
                        ? 'bg-green-50 border-green-200 text-green-800' 
                        : isCurrent
                        ? 'bg-blue-50 border-blue-200 text-blue-800'
                        : 'bg-gray-50 border-gray-200 text-gray-600'
                    }`}
                  >
                    <div className="flex items-center justify-center mb-1">
                      {isCompleted ? (
                        <CheckCircle className="h-4 w-4" />
                      ) : isCurrent ? (
                        <Clock className="h-4 w-4" />
                      ) : (
                        <div className="h-4 w-4 rounded-full border-2 border-current"></div>
                      )}
                    </div>
                    <span className="text-xs font-medium">{step.title}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Current Step */}
          {currentStepData ? (
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-4">
                <Badge variant="outline">Step {currentStep + 1}</Badge>
                <span className="font-medium">{currentStepData.title}</span>
              </div>
              {getStepComponent(currentStepData, currentStep)}
            </div>
          ) : (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Handover Complete!</h3>
                  <p className="text-muted-foreground">
                    All handover steps have been completed successfully.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
          </div>
        </div>
      </div>
    </>
  );
};

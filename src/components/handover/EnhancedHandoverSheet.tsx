
import { useState, useEffect } from "react";
import { X, CheckCircle, Clock, AlertCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { useHandover } from "@/contexts/HandoverContext";
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
import { toast } from "@/utils/toast-utils";

interface EnhancedHandoverSheetProps {
  isOpen: boolean;
  onClose: () => void;
  handoverSessionId: string;
}

export const EnhancedHandoverSheet = ({
  isOpen,
  onClose,
  handoverSessionId
}: EnhancedHandoverSheetProps) => {
  const { isLoading, isHost, bookingDetails } = useHandover();
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<HandoverStepCompletion[]>([]);
  const [vehiclePhotos, setVehiclePhotos] = useState<VehiclePhoto[]>([]);
  const [damageReports, setDamageReports] = useState<DamageReport[]>([]);
  const [fuelLevel, setFuelLevel] = useState<number>();
  const [mileage, setMileage] = useState<number>();
  const [digitalSignature, setDigitalSignature] = useState<string>();

  useEffect(() => {
    if (handoverSessionId && isOpen) {
      initializeHandover();
    }
  }, [handoverSessionId, isOpen]);

  const initializeHandover = async () => {
    // Initialize steps if not already done
    await initializeHandoverSteps(handoverSessionId);
    
    // Load existing progress
    const steps = await getHandoverSteps(handoverSessionId);
    setCompletedSteps(steps);
    
    // Find current step (first incomplete step)
    const firstIncomplete = steps.findIndex(step => !step.is_completed);
    setCurrentStep(firstIncomplete >= 0 ? firstIncomplete : steps.length);
  };

  const handleStepComplete = async (stepName: string, data?: any) => {
    const success = await completeHandoverStep(handoverSessionId, stepName, data);
    if (success) {
      // Refresh steps
      const updatedSteps = await getHandoverSteps(handoverSessionId);
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
    try {
      // Create final vehicle condition report
      if (vehiclePhotos.length > 0 || damageReports.length > 0) {
        await createVehicleConditionReport({
          handover_session_id: handoverSessionId,
          booking_id: bookingDetails?.id || "",
          car_id: bookingDetails?.car?.id || "",
          reporter_id: "", // Will be set by service
          report_type: 'pickup', // This should be determined by handover type
          vehicle_photos: vehiclePhotos,
          damage_reports: damageReports,
          fuel_level: fuelLevel,
          mileage: mileage,
          digital_signature_data: digitalSignature,
          is_acknowledged: true
        });
      }

      toast.success("Handover completed successfully!");
      onClose();
    } catch (error) {
      console.error("Error completing handover:", error);
      toast.error("Failed to complete handover");
    }
  };

  const getStepComponent = (step: typeof HANDOVER_STEPS[0], stepIndex: number) => {
    const otherUser = isHost ? bookingDetails?.renter : bookingDetails?.car?.owner;
    
    switch (step.name) {
      case "identity_verification":
        return (
          <IdentityVerificationStep
            handoverSessionId={handoverSessionId}
            otherUserId={otherUser?.id || ""}
            otherUserName={otherUser?.full_name || "User"}
            isHost={isHost}
            onStepComplete={() => handleStepComplete(step.name)}
          />
        );
        
      case "vehicle_inspection_exterior":
        return (
          <VehicleInspectionStep
            handoverSessionId={handoverSessionId}
            inspectionType="exterior"
            onPhotosUpdate={(photos) => {
              const filteredPhotos = vehiclePhotos.filter(p => !p.type.startsWith('exterior_'));
              setVehiclePhotos([...filteredPhotos, ...photos]);
            }}
            onStepComplete={() => handleStepComplete(step.name)}
            initialPhotos={vehiclePhotos.filter(p => p.type.startsWith('exterior_'))}
          />
        );
        
      case "vehicle_inspection_interior":
        return (
          <VehicleInspectionStep
            handoverSessionId={handoverSessionId}
            inspectionType="interior"
            onPhotosUpdate={(photos) => {
              const filteredPhotos = vehiclePhotos.filter(p => !p.type.startsWith('interior_') && !['fuel_gauge', 'odometer'].includes(p.type));
              setVehiclePhotos([...filteredPhotos, ...photos]);
            }}
            onStepComplete={() => handleStepComplete(step.name)}
            initialPhotos={vehiclePhotos.filter(p => p.type.startsWith('interior_') || ['fuel_gauge', 'odometer'].includes(p.type))}
          />
        );
        
      case "damage_documentation":
        return (
          <DamageDocumentationStep
            handoverSessionId={handoverSessionId}
            onDamageReportsUpdate={setDamageReports}
            onStepComplete={() => handleStepComplete(step.name)}
            initialReports={damageReports}
          />
        );
        
      default:
        return (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <h3 className="font-medium mb-2">{step.title}</h3>
                <p className="text-sm text-muted-foreground mb-4">{step.description}</p>
                <Button onClick={() => handleStepComplete(step.name)}>
                  Complete {step.title}
                </Button>
              </div>
            </CardContent>
          </Card>
        );
    }
  };

  if (isLoading) {
    return (
      <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50">
        <Card className="w-96">
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p>Loading handover process...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const progress = (completedSteps.filter(s => s.is_completed).length / HANDOVER_STEPS.length) * 100;
  const currentStepData = HANDOVER_STEPS[currentStep];

  return (
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
  );
};

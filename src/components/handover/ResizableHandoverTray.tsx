import { useState, useEffect, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { X, GripHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable";
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
  HandoverStepCompletion,
  VehicleConditionReport
} from "@/services/enhancedHandoverService";
import { IdentityVerificationStep } from "./steps/IdentityVerificationStep";
import { VehicleInspectionStep } from "./steps/VehicleInspectionStep";
import { DamageDocumentationStep } from "./steps/DamageDocumentationStep";
import { FuelMileageStep } from "./steps/FuelMileageStep";
import { KeyTransferStep } from "./steps/KeyTransferStep";
import { DigitalSignatureStep } from "./steps/DigitalSignatureStep";
import { HandoverNavigationStep } from "./steps/HandoverNavigationStep";
import { HandoverSuccessPopup } from "./HandoverSuccessPopup";
import { HandoverProgressIndicator } from "./HandoverProgressIndicator";
import { useRealtimeHandover } from "@/hooks/useRealtimeHandover";
import { toast } from "@/utils/toast-utils";
import { BookingWithRelations } from "@/types/booking";

// Extended booking type for handover with additional location data
interface HandoverBookingDetails extends BookingWithRelations {
  latitude?: number;
  longitude?: number;
  cars: BookingWithRelations['cars'] & {
    latitude?: number;
    longitude?: number;
    owner?: {
      id: string;
      full_name: string;
      avatar_url?: string;
    };
  };
}

interface ResizableHandoverTrayProps {
  isOpen: boolean;
  onClose: () => void;
  bookingId: string;
}

type DisplayMode = 'collapsed' | 'partial' | 'expanded';

export const ResizableHandoverTray = ({
  isOpen,
  onClose,
  bookingId
}: ResizableHandoverTrayProps) => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { isLoading, isHandoverSessionLoading, isHost, bookingDetails, handoverId, currentUserId, handoverStatus } = useHandover();
  const { handoverProgress } = useRealtimeHandover(handoverId);
  
  // State management - same as original
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<HandoverStepCompletion[]>([]);
  const [vehiclePhotos, setVehiclePhotos] = useState<VehiclePhoto[]>([]);
  const [damageReports, setDamageReports] = useState<DamageReport[]>([]);
  const [fuelLevel, setFuelLevel] = useState<number>();
  const [mileage, setMileage] = useState<number>();
  const [digitalSignature, setDigitalSignature] = useState<string>();
  const [isHandoverCompleted, setIsHandoverCompleted] = useState(false);
  
  // Resizable panel state
  const [panelSize, setPanelSize] = useState(40); // Default to 40% (partial view)
  const [displayMode, setDisplayMode] = useState<DisplayMode>('partial');

  // Load preferred size from session storage
  useEffect(() => {
    const savedSize = sessionStorage.getItem('handover-tray-size');
    if (savedSize) {
      const size = parseFloat(savedSize);
      setPanelSize(size);
    }
  }, []);

  // Save panel size to session storage and update display mode
  const handlePanelResize = useCallback((sizes: number[]) => {
    const traySize = sizes[1]; // Second panel is the tray
    if (traySize !== panelSize) {
      setPanelSize(traySize);
      sessionStorage.setItem('handover-tray-size', traySize.toString());
      
      // Update display mode based on size
      if (traySize <= 30) {
        setDisplayMode('collapsed');
      } else if (traySize <= 65) {
        setDisplayMode('partial');
      } else {
        setDisplayMode('expanded');
      }
    }
  }, [panelSize]);

  // Double-tap handle to toggle between collapsed/expanded
  const handleDoubleClick = useCallback(() => {
    const newSize = panelSize <= 50 ? 85 : 25;
    setPanelSize(newSize);
    sessionStorage.setItem('handover-tray-size', newSize.toString());
  }, [panelSize]);

  const initializeHandover = useCallback(async () => {
    if (!handoverId) {
      console.error("Cannot initialize handover: missing handover session ID");
      toast.error("Handover session not found");
      return;
    }

    console.log("Initializing handover for session:", handoverId);
    
    try {
      await initializeHandoverSteps(handoverId);
      const steps = await getHandoverSteps(handoverId);
      console.log("Loaded handover steps:", steps);
      setCompletedSteps(steps as any);
      
      const firstIncomplete = steps.findIndex(step => !step.is_completed);
      const calculatedCurrentStep = firstIncomplete >= 0 ? firstIncomplete : steps.length;
      setCurrentStep(calculatedCurrentStep);
      
      const completedCount = steps.filter(s => s.is_completed).length;
      if (completedCount > 0) {
        toast.success(`Continuing handover process - ${completedCount}/${steps.length} steps completed`);
      }
    } catch (error) {
      console.error("Error initializing handover:", error);
      toast.error("Failed to initialize handover process");
    }
  }, [handoverId]);

  useEffect(() => {
    if (handoverId && isOpen && !isHandoverSessionLoading) {
      initializeHandover();
    }
  }, [handoverId, isOpen, isHandoverSessionLoading, initializeHandover]);

  const handleStepComplete = async (stepName: string, completionData?: Record<string, unknown>) => {
    console.log(`🚀 handleStepComplete called for step: ${stepName}`);
    console.log(`📋 Handover session ID: ${handoverId}`);
    console.log(`📊 Completion data:`, completionData);
    
    if (!handoverId) {
      console.error(`❌ No handover session ID available`);
      toast.error("Handover session not found");
      return;
    }

    console.log(`🔄 Attempting to complete step: ${stepName}`, { completionData });
    const success = await completeHandoverStep(handoverId, stepName, completionData);
    
    console.log(`📋 Step completion result for ${stepName}:`, success);
    
    if (success) {
      console.log(`✅ Step ${stepName} completed successfully, refreshing steps...`);
      const updatedSteps = await getHandoverSteps(handoverId);
      setCompletedSteps(updatedSteps as any);
      
      const nextIncomplete = updatedSteps.findIndex(step => !step.is_completed);
      console.log(`🔍 Next incomplete step index:`, nextIncomplete);
      
      if (nextIncomplete >= 0) {
        console.log(`➡️ Moving to next step: ${nextIncomplete}`);
        setCurrentStep(nextIncomplete);
      } else {
        console.log(`🎉 All steps completed, initiating handover completion`);
        const allCompleted = updatedSteps.every(step => step.is_completed);
        if (allCompleted) {
          await handleHandoverComplete();
        }
      }
    } else {
      console.error(`❌ Step ${stepName} completion failed`);
    }
  };

  const handleHandoverComplete = async () => {
    console.log("Starting handover completion...");
    try {
      if (handoverId) {
        console.log("Completing handover session:", handoverId);
        await completeHandover(handoverId);
      }

      if (vehiclePhotos.length > 0 || damageReports.length > 0 || fuelLevel !== undefined || mileage !== undefined) {
        console.log("Creating vehicle condition report...");
        const reportType = isReturnHandover() ? 'return' : 'pickup';
        console.log("Report type determined as:", reportType);
        
        const reportData: VehicleConditionReport = {
          handover_session_id: handoverId,
          booking_id: (bookingDetails as unknown as HandoverBookingDetails)?.id as string || "",
          car_id: (bookingDetails as unknown as HandoverBookingDetails)?.car_id as string || "",
          report_type: reportType as 'pickup' | 'return',
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

      console.log("Setting handover completed to true, isHost:", isHost);
      setIsHandoverCompleted(true);
    } catch (error) {
      console.error("Error completing handover:", error);
      toast.error("Failed to complete handover. Please try again.");
    }
  };

  const isReturnHandover = () => {
    const urlHandoverType = searchParams.get('handoverType');
    console.log('🔍 DEBUG: URL handoverType parameter:', urlHandoverType);
    
    if (urlHandoverType) {
      console.log('✅ Using handoverType from URL:', urlHandoverType);
      const isReturn = urlHandoverType === 'return';
      console.log('✅ isReturnHandover result from URL:', isReturn);
      return isReturn;
    }
    
    console.log('⚠️ No handoverType in URL, checking handover session type');
    if (handoverStatus?.handover_type) {
      console.log('✅ Using handover_type from session:', handoverStatus.handover_type);
      const isReturn = handoverStatus.handover_type === 'return';
      console.log('✅ isReturnHandover result from session:', isReturn);
      return isReturn;
    }
    
    return false;
  };

  const handleSuccessPopupClose = () => {
    console.log("🎉 Success popup closing - starting redirection logic");
    console.log("👤 User role - isHost:", isHost);
    console.log("📋 Booking ID:", bookingId);
    
    const isReturn = isReturnHandover();
    console.log("🔄 Handover type determination - isReturnHandover():", isReturn);
    
    setIsHandoverCompleted(false);
    
    const currentUrl = new URL(window.location.href);
    currentUrl.searchParams.delete('mode');
    currentUrl.searchParams.delete('bookingId');
    window.history.replaceState({}, '', currentUrl.pathname + currentUrl.search);
    
    onClose();
    
    if (!isHost && isReturn) {
      console.log("🔄 Return handover completed - redirecting renter to review page");
      console.log("🚀 Navigating to:", `/rental-review/${bookingId}`);
      navigate(`/rental-review/${bookingId}`);
      return;
    }
    
    if (isHost) {
      console.log("🏠 Host user - navigating to host-bookings");
      console.log("🚀 Navigating to: /host-bookings");
      navigate("/host-bookings");
    } else {
      console.log("🚗 Renter user - pickup completed, navigating to renter-bookings");
      console.log("🚀 Navigating to: /renter-bookings");
      navigate("/renter-bookings");
    }
  };

  // Render compact header for collapsed/partial modes
  const renderCompactHeader = () => {
    const currentStepData = HANDOVER_STEPS[currentStep];
    const completedCount = completedSteps.filter(s => s.is_completed).length;
    const totalSteps = HANDOVER_STEPS.length;
    const progressPercentage = (completedCount / totalSteps) * 100;

    return (
      <div className="flex items-center justify-between p-4 border-b bg-card">
        <div className="flex items-center space-x-3">
          <div className="flex flex-col">
            <h3 className="font-semibold text-sm">
              {isReturnHandover() ? 'Vehicle Return' : 'Vehicle Pickup'}
            </h3>
            <div className="flex items-center space-x-2">
              <Badge variant="outline" className="text-xs">
                Step {currentStep + 1} of {totalSteps}
              </Badge>
              <span className="text-xs text-muted-foreground">
                {currentStepData?.title || 'Completed'}
              </span>
            </div>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <Progress value={progressPercentage} className="w-16 h-2" />
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
    );
  };

  // Render full header for expanded mode
  const renderFullHeader = () => (
    <div className="flex justify-between items-center p-6 border-b">
      <div>
        <h2 className="text-xl font-semibold">
          {isReturnHandover() ? 'Vehicle Return Process' : 'Vehicle Pickup Process'}
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          Complete all steps to finalize the handover
        </p>
      </div>
      <Button variant="ghost" size="sm" onClick={onClose}>
        <X className="h-4 w-4" />
        <span className="sr-only">Close</span>
      </Button>
    </div>
  );

  // Get current step component - using exact same logic as original
  const getStepComponent = (step: typeof HANDOVER_STEPS[0], stepIndex: number) => {
    const bookingData = bookingDetails as unknown as HandoverBookingDetails | null;
    const otherUser = isHost ? bookingData?.renter : bookingData?.cars?.owner;
    
    switch (step.name) {
      case "navigation": {
        const destinationLocation = {
          latitude: bookingData?.latitude || bookingData?.cars?.latitude || -24.65451,
          longitude: bookingData?.longitude || bookingData?.cars?.longitude || 25.90859,
          address: bookingData?.cars?.location || "Handover Location"
        };
        
        return (
          <HandoverNavigationStep
            handoverSessionId={handoverId || ""}
            destinationLocation={destinationLocation}
            otherUserName={otherUser?.full_name || "User"}
            isHost={isHost}
            onStepComplete={() => handleStepComplete(step.name)}
            onNavigationStart={() => toast.info("Navigation started. Follow the directions to reach the handover location.")}
          />
        );
      }

      case "identity_verification": {
        return (
          <IdentityVerificationStep
            handoverSessionId={handoverId || ""}
            otherUserId={otherUser?.id || ""}
            otherUserName={otherUser?.full_name || "User"}
            isHost={isHost}
            onStepComplete={() => handleStepComplete(step.name)}
          />
        );
      }
        
      case "vehicle_inspection_exterior": {
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
      }
        
      case "vehicle_inspection_interior": {
        return (
          <VehicleInspectionStep
            handoverSessionId={handoverId || ""}
            inspectionType="interior"
            onPhotosUpdate={(photos) => {
              const filteredPhotos = vehiclePhotos.filter(p => p.type && !p.type.startsWith('interior_') && 
                !['fuel_gauge', 'odometer'].includes(p.type));
              setVehiclePhotos([...filteredPhotos, ...photos]);
            }}
            onStepComplete={() => handleStepComplete(step.name)}
            initialPhotos={vehiclePhotos.filter(p => 
              p.type && (p.type.startsWith('interior_') || ['fuel_gauge', 'odometer'].includes(p.type))
            )}
          />
        );
      }

      case "damage_documentation": {
        return (
          <DamageDocumentationStep
            handoverSessionId={handoverId || ""}
            onDamageReportsUpdate={setDamageReports}
            onStepComplete={() => handleStepComplete(step.name)}
            initialReports={damageReports}
          />
        );
      }

      case "fuel_mileage_check": {
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
      }

      case "key_transfer": {
        return (
          <KeyTransferStep
            handoverSessionId={handoverId || ""}
            otherUserName={otherUser?.full_name || "User"}
            isHost={isHost}
            onStepComplete={() => handleStepComplete(step.name)}
          />
        );
      }

      case "digital_signature": {
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
      }
        
      default:
        return (
          <div className="p-4 text-center">
            <h3 className="font-medium mb-2">{step.title}</h3>
            <p className="text-sm text-muted-foreground mb-4">{step.description}</p>
            <Button onClick={() => handleStepComplete(step.name)}>
              Complete {step.title}
            </Button>
          </div>
        );
    }
  };

  if (!isOpen) return null;

  const currentStepData = currentStep < HANDOVER_STEPS.length ? HANDOVER_STEPS[currentStep] : null;

  return (
    <div className="fixed inset-0 z-[9999] pointer-events-none">
      <div
        className="absolute inset-0 bg-black/20 pointer-events-auto"
        onClick={onClose}
      />
      
      <div className="absolute inset-0 pointer-events-auto">
        <ResizablePanelGroup
          direction="vertical"
          onLayout={handlePanelResize}
          className="h-full"
        >
          {/* Invisible spacer panel */}
          <ResizablePanel defaultSize={100 - panelSize} minSize={15} />
          
          {/* Drag handle */}
          <ResizableHandle 
            className="bg-border hover:bg-accent transition-colors"
            onDoubleClick={handleDoubleClick}
          >
            <div className="flex items-center justify-center h-6 w-full bg-card border-t border-b">
              <GripHorizontal className="h-3 w-3 text-muted-foreground" />
            </div>
          </ResizableHandle>
          
          {/* Handover tray panel */}
          <ResizablePanel 
            defaultSize={panelSize} 
            minSize={20} 
            maxSize={90}
            className="bg-background rounded-t-xl shadow-2xl border-t border-l border-r"
          >
            <div className="h-full flex flex-col overflow-hidden">
              {/* Header - adaptive based on display mode */}
              {displayMode === 'expanded' ? renderFullHeader() : renderCompactHeader()}
              
              {/* Content area */}
              <div className="flex-1 overflow-y-auto">
                {displayMode === 'collapsed' ? (
                  // Minimal view - just essential info
                  <div className="p-4 text-center">
                    <p className="text-sm text-muted-foreground">
                      Drag up to expand handover process
                    </p>
                  </div>
                ) : (
                  // Partial and expanded views
                  <div className="space-y-4 p-4">
                    {displayMode === 'expanded' && (
                      <HandoverProgressIndicator
                        handoverSessionId={handoverId}
                        showDetailed={true}
                      />
                    )}
                    
                    {/* Current step content */}
                    <div className="min-h-[200px]">
                      {isLoading || isHandoverSessionLoading ? (
                        <div className="flex items-center justify-center h-32">
                          <div className="animate-pulse space-y-4 w-full">
                            <div className="h-4 bg-muted rounded w-3/4 mx-auto"></div>
                            <div className="h-4 bg-muted rounded w-1/2 mx-auto"></div>
                          </div>
                        </div>
                      ) : currentStepData ? (
                        getStepComponent(currentStepData, currentStep)
                      ) : (
                        <div className="p-4 text-center">
                          <p className="text-muted-foreground">All steps completed</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>

      {/* Success popup */}
      {isHandoverCompleted && (
        <HandoverSuccessPopup
          isHost={isHost}
          onClose={handleSuccessPopupClose}
        />
      )}
    </div>
  );
};


import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { X, CheckCircle, Clock, AlertCircle, GripHorizontal } from "lucide-react";
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
  const [searchParams] = useSearchParams();
  const { isLoading, isHandoverSessionLoading, isHost, bookingDetails, handoverId, currentUserId, handoverStatus } = useHandover();
  const { handoverProgress } = useRealtimeHandover(handoverId);
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<HandoverStepCompletion[]>([]);
  const [vehiclePhotos, setVehiclePhotos] = useState<VehiclePhoto[]>([]);
  const [damageReports, setDamageReports] = useState<DamageReport[]>([]);
  const [fuelLevel, setFuelLevel] = useState<number>();
  const [mileage, setMileage] = useState<number>();
  const [digitalSignature, setDigitalSignature] = useState<string>();
  const [isHandoverCompleted, setIsHandoverCompleted] = useState(false);
  
  // Resizable functionality state
  const [sheetHeight, setSheetHeight] = useState<number>(90); // vh units
  const [isDragging, setIsDragging] = useState(false);
  const [dragStartY, setDragStartY] = useState(0);
  const [dragStartHeight, setDragStartHeight] = useState(90);
  const sheetRef = useRef<HTMLDivElement>(null);
  
  // Height constraints
  const MIN_HEIGHT = 40; // vh
  const MAX_HEIGHT = 95; // vh
  const DEFAULT_HEIGHT = 90; // vh

  // Load saved height from localStorage on component mount
  useEffect(() => {
    const savedHeight = localStorage.getItem('handover-sheet-height');
    if (savedHeight) {
      const height = parseInt(savedHeight, 10);
      if (height >= MIN_HEIGHT && height <= MAX_HEIGHT) {
        setSheetHeight(height);
      }
    }
  }, []);

  // Save height to localStorage when it changes
  useEffect(() => {
    localStorage.setItem('handover-sheet-height', sheetHeight.toString());
  }, [sheetHeight]);

  // Drag event handlers
  const handleDragStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    setDragStartY(e.clientY);
    setDragStartHeight(sheetHeight);
    document.body.style.userSelect = 'none';
  }, [sheetHeight]);

  const handleDragMove = useCallback((e: MouseEvent) => {
    if (!isDragging) return;
    
    const deltaY = dragStartY - e.clientY;
    const viewportHeight = window.innerHeight;
    const deltaVh = (deltaY / viewportHeight) * 100;
    const newHeight = Math.min(MAX_HEIGHT, Math.max(MIN_HEIGHT, dragStartHeight + deltaVh));
    
    setSheetHeight(newHeight);
  }, [isDragging, dragStartY, dragStartHeight]);

  const handleDragEnd = useCallback(() => {
    setIsDragging(false);
    document.body.style.userSelect = '';
  }, []);

  // Add global mouse event listeners for dragging
  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleDragMove);
      document.addEventListener('mouseup', handleDragEnd);
      return () => {
        document.removeEventListener('mousemove', handleDragMove);
        document.removeEventListener('mouseup', handleDragEnd);
      };
    }
  }, [isDragging, handleDragMove, handleDragEnd]);

  // Automated display logic - adjust height based on content and screen size
  const adjustHeightForContent = useCallback(() => {
    if (!sheetRef.current || isDragging) return;

    const contentElement = sheetRef.current.querySelector('[data-content="true"]');
    if (!contentElement) return;

    const viewportHeight = window.innerHeight;
    const contentHeight = contentElement.scrollHeight;
    const dragHandleHeight = 40; // Height of drag handle
    const padding = 48; // Additional padding for better UX
    
    // Calculate required height in vh
    const requiredHeight = ((contentHeight + dragHandleHeight + padding) / viewportHeight) * 100;
    
    // Only auto-adjust if content requires more space than current height
    // and user hasn't manually resized recently
    const hasUserManuallyResized = localStorage.getItem('handover-sheet-user-resized') === 'true';
    
    if (!hasUserManuallyResized && requiredHeight > sheetHeight && requiredHeight <= MAX_HEIGHT) {
      setSheetHeight(Math.min(MAX_HEIGHT, Math.max(MIN_HEIGHT, requiredHeight)));
    }
  }, [sheetHeight, isDragging]);

  // Monitor content changes for auto-adjustment
  useEffect(() => {
    adjustHeightForContent();
  }, [currentStep, completedSteps, adjustHeightForContent]);

  // Handle window resize for responsive behavior
  useEffect(() => {
    const handleResize = () => {
      // Ensure height constraints are maintained on window resize
      const currentHeightPx = (sheetHeight / 100) * window.innerHeight;
      const minHeightPx = (MIN_HEIGHT / 100) * window.innerHeight;
      const maxHeightPx = (MAX_HEIGHT / 100) * window.innerHeight;
      
      if (currentHeightPx < minHeightPx) {
        setSheetHeight(MIN_HEIGHT);
      } else if (currentHeightPx > maxHeightPx) {
        setSheetHeight(MAX_HEIGHT);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [sheetHeight]);

  // Track manual resize to prevent auto-adjustment interference
  const handleManualDragStart = useCallback((e: React.MouseEvent) => {
    localStorage.setItem('handover-sheet-user-resized', 'true');
    handleDragStart(e);
  }, [handleDragStart]);

  // Keyboard accessibility for drag handle
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
      e.preventDefault();
      const increment = e.shiftKey ? 10 : 5; // Larger increment with Shift
      const direction = e.key === 'ArrowUp' ? 1 : -1;
      const newHeight = Math.min(MAX_HEIGHT, Math.max(MIN_HEIGHT, sheetHeight + (increment * direction)));
      setSheetHeight(newHeight);
      localStorage.setItem('handover-sheet-user-resized', 'true');
    }
  }, [sheetHeight]);

  // Touch support for mobile devices
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      const touch = e.touches[0];
      setIsDragging(true);
      setDragStartY(touch.clientY);
      setDragStartHeight(sheetHeight);
      localStorage.setItem('handover-sheet-user-resized', 'true');
    }
  }, [sheetHeight]);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (!isDragging || e.touches.length !== 1) return;
    
    e.preventDefault();
    const touch = e.touches[0];
    const deltaY = dragStartY - touch.clientY;
    const viewportHeight = window.innerHeight;
    const deltaVh = (deltaY / viewportHeight) * 100;
    const newHeight = Math.min(MAX_HEIGHT, Math.max(MIN_HEIGHT, dragStartHeight + deltaVh));
    
    setSheetHeight(newHeight);
  }, [isDragging, dragStartY, dragStartHeight]);

  const handleTouchEnd = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Add touch event listeners
  useEffect(() => {
    if (isDragging) {
      document.addEventListener('touchmove', handleTouchMove, { passive: false });
      document.addEventListener('touchend', handleTouchEnd);
      return () => {
        document.removeEventListener('touchmove', handleTouchMove);
        document.removeEventListener('touchend', handleTouchEnd);
      };
    }
  }, [isDragging, handleTouchMove, handleTouchEnd]);

  // Responsive height adjustments for mobile
  useEffect(() => {
    const handleOrientationChange = () => {
      // Adjust height constraints for mobile landscape/portrait
      const isMobile = window.innerWidth < 768;
      const isLandscape = window.innerWidth > window.innerHeight;
      
      if (isMobile && isLandscape) {
        // In mobile landscape, use more of the screen
        if (sheetHeight > 85) {
          setSheetHeight(85);
        }
      }
    };

    window.addEventListener('orientationchange', handleOrientationChange);
    window.addEventListener('resize', handleOrientationChange);
    
    return () => {
      window.removeEventListener('orientationchange', handleOrientationChange);
      window.removeEventListener('resize', handleOrientationChange);
    };
  }, [sheetHeight]);

  const initializeHandover = useCallback(async () => {
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
      setCompletedSteps(steps as any);
      
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
  }, [handoverId]);

  useEffect(() => {
    if (handoverId && isOpen && !isHandoverSessionLoading) {
      initializeHandover();
    }
  }, [handoverId, isOpen, isHandoverSessionLoading, initializeHandover]);

  useEffect(() => {
    if (isOpen && handoverStatus && completedSteps) {
      console.log("🔍 DEBUG: Checking handover completion status...");
      console.log("🔍 DEBUG: Handover status:", handoverStatus);
      console.log("🔍 DEBUG: Completed steps:", completedSteps);
      console.log("🔍 DEBUG: isReturnHandover():", isReturnHandover());
      
      // For the new handover type system, only show completion if:
      // 1. The current session is completed AND
      // 2. All steps for this specific session are completed
      const allStepsCompleted = completedSteps.every(step => step.is_completed);
      
      if (handoverStatus.handover_completed && allStepsCompleted) {
        console.log("✅ Current handover session completed with all steps done, showing success popup");
        setIsHandoverCompleted(true);
        return;
      }
      
      // Reset completion state if handover is not completed or steps are incomplete
      if (!handoverStatus.handover_completed || !allStepsCompleted) {
        console.log("🔄 Handover not completed or steps incomplete, ensuring completion state is reset");
        setIsHandoverCompleted(false);
        
        // Find the first incomplete step and set it as current
        const firstIncompleteIndex = completedSteps.findIndex(step => !step.is_completed);
        if (firstIncompleteIndex >= 0) {
          setCurrentStep(firstIncompleteIndex);
        }
      }
    }
  }, [isOpen, handoverStatus, completedSteps, searchParams]);

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
      // Refresh steps to get updated state
      const updatedSteps = await getHandoverSteps(handoverId);
      setCompletedSteps(updatedSteps as any);
      
      // Move to next step
      const nextIncomplete = updatedSteps.findIndex(step => !step.is_completed);
      console.log(`🔍 Next incomplete step index:`, nextIncomplete);
      
      if (nextIncomplete >= 0) {
        console.log(`➡️ Moving to next step: ${nextIncomplete}`);
        setCurrentStep(nextIncomplete);
      } else {
        console.log(`🎉 All steps completed, initiating handover completion`);
        // All steps completed - the database trigger will handle session completion
        console.log("All steps completed, checking if handover should be finalized");
        
        // Check if handover session is now marked as completed
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
      // Complete the handover session
      if (handoverId) {
        console.log("Completing handover session:", handoverId);
        await completeHandover(handoverId);
      }

      // Create final vehicle condition report only if we have meaningful data
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

      // Show success popup and redirect
      console.log("Setting handover completed to true, isHost:", isHost);
      setIsHandoverCompleted(true);
    } catch (error) {
      console.error("Error completing handover:", error);
      toast.error("Failed to complete handover. Please try again.");
    }
  };

  // Helper function to determine if this is a return handover
  const isReturnHandover = () => {
    // First check if handoverType is explicitly provided in URL parameters
    const urlHandoverType = searchParams.get('handoverType');
    console.log('🔍 DEBUG: URL handoverType parameter:', urlHandoverType);
    console.log('🔍 DEBUG: All URL search params:', Object.fromEntries(searchParams.entries()));
    
    if (urlHandoverType) {
      console.log('✅ Using handoverType from URL:', urlHandoverType);
      const isReturn = urlHandoverType === 'return';
      console.log('✅ isReturnHandover result from URL:', isReturn);
      return isReturn;
    }
    
    console.log('⚠️ No handoverType in URL, checking handover session type');
    // Check the handover session type directly
    if (handoverStatus?.handover_type) {
      console.log('✅ Using handover_type from session:', handoverStatus.handover_type);
      const isReturn = handoverStatus.handover_type === 'return';
      console.log('✅ isReturnHandover result from session:', isReturn);
      return isReturn;
    }
    
    console.log('⚠️ No handover_type in session, falling back to automatic detection');
    // Fallback to automatic detection if no handover type is set
    if (!bookingDetails) {
      console.log('❌ Missing bookingDetails for automatic detection');
      return false;
    }
    
    const booking = bookingDetails as unknown as HandoverBookingDetails;
    const bookingStartDate = new Date(booking.start_date);
    const bookingEndDate = new Date(booking.end_date);
    const now = new Date();
    
    console.log('📅 Booking dates - Start:', bookingStartDate.toISOString(), 'End:', bookingEndDate.toISOString());
    console.log('📅 Current time:', now.toISOString());
    
    // If we're before the booking start date, this is definitely a pickup
    if (now < bookingStartDate) {
      console.log('✅ Before booking start date - this is a pickup');
      return false;
    }
    
    // If we're past the booking end date, this is definitely a return
    if (now >= bookingEndDate) {
      console.log('✅ Past booking end date - this is a return');
      return true;
    }
    
    // If we're between start and end date, determine based on time proximity
    const timeToStart = Math.abs(now.getTime() - bookingStartDate.getTime());
    const timeToEnd = Math.abs(now.getTime() - bookingEndDate.getTime());
    
    // If we're closer to the end date and past the start date, it's likely a return
    const isPastStartDate = now >= bookingStartDate;
    const isReturn = isPastStartDate && timeToEnd < timeToStart;
    
    console.log('✅ Time-based determination - isReturn:', isReturn);
    return isReturn;
  };

  const handleSuccessPopupClose = () => {
    console.log("🎉 Success popup closing - starting redirection logic");
    console.log("👤 User role - isHost:", isHost);
    console.log("📋 Booking ID:", bookingId);
    
    const isReturn = isReturnHandover();
    console.log("🔄 Handover type determination - isReturnHandover():", isReturn);
    
    setIsHandoverCompleted(false);
    
    // Clear URL parameters first
    const currentUrl = new URL(window.location.href);
    currentUrl.searchParams.delete('mode');
    currentUrl.searchParams.delete('bookingId');
    window.history.replaceState({}, '', currentUrl.pathname + currentUrl.search);
    
    onClose();
    
    // Check if this is a return handover and user is a renter
    if (!isHost && isReturn) {
      console.log("🔄 Return handover completed - redirecting renter to review page");
      console.log("🚀 Navigating to:", `/rental-review/${bookingId}`);
      navigate(`/rental-review/${bookingId}`);
      return;
    }
    
    // Navigate to appropriate bookings page for other cases
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

  const canProceedToNextStep = (stepName: string) => {
    switch (stepName) {
      case "navigation":
        return true; // Can always proceed after navigation (arrival is confirmed within the step)
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
    const bookingData = bookingDetails as unknown as HandoverBookingDetails | null;
    const otherUser = isHost ? bookingData?.renter : bookingData?.cars?.owner;
    
    switch (step.name) {
      case "navigation": {
        // Get destination location (preset or user location)
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
        const exteriorPhotos = vehiclePhotos.filter(p => p.type.startsWith('exterior_'));
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
        const interiorPhotos = vehiclePhotos.filter(p => 
          p.type.startsWith('interior_') || ['fuel_gauge', 'odometer'].includes(p.type)
        );
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
        <HandoverSuccessPopup 
          isHost={isHost} 
          onClose={handleSuccessPopupClose}
        />
      )}
      
      <div
        className="fixed inset-0 z-[9999] pointer-events-none"
        style={{ display: isOpen ? "block" : "none" }}
      >
        <div
          className="absolute inset-0 bg-black/50 pointer-events-auto"
          onClick={onClose}
        />
        <div 
          ref={sheetRef}
          className={`absolute bottom-0 left-0 right-0 bg-background rounded-t-xl shadow-lg overflow-hidden pointer-events-auto transition-all duration-200 ease-out ${isDragging ? 'select-none shadow-xl' : ''}`}
          style={{ 
            height: `${sheetHeight}vh`,
            transform: isDragging ? 'scale(1.001)' : 'scale(1)',
            borderTop: isDragging ? '2px solid hsl(var(--primary))' : '1px solid hsl(var(--border))'
          }}
        >
          {/* Drag Handle */}
             <div 
               className={`flex items-center justify-center py-2 cursor-ns-resize hover:bg-muted/50 transition-all duration-150 ${isDragging ? 'bg-primary/10 border-b border-primary/20' : ''}`}
               onMouseDown={handleManualDragStart}
               onTouchStart={handleTouchStart}
               onKeyDown={handleKeyDown}
               role="slider"
               tabIndex={0}
               aria-label={`Resize handover sheet. Current height: ${Math.round(sheetHeight)}% of viewport. Use arrow keys to adjust.`}
               aria-valuemin={MIN_HEIGHT}
               aria-valuemax={MAX_HEIGHT}
               aria-valuenow={Math.round(sheetHeight)}
               aria-orientation="vertical"
               title="Drag to resize or use arrow keys (Shift for larger steps)"
             >
               <GripHorizontal className={`h-4 w-4 transition-colors duration-150 ${isDragging ? 'text-primary' : 'text-muted-foreground'}`} />
               {isDragging && (
                 <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-full bg-primary text-primary-foreground px-2 py-1 rounded text-xs font-medium shadow-md z-50">
                   {Math.round(sheetHeight)}vh
                 </div>
               )}
             </div>
           
           {/* Scrollable Content */}
            <div className="overflow-y-auto" style={{ height: 'calc(100% - 40px)' }}>
            <div className="p-6" data-content="true">
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-xl font-semibold">Vehicle Handover</h2>
              <p className="text-sm text-muted-foreground">
                {(bookingDetails as unknown as HandoverBookingDetails)?.cars?.brand} {(bookingDetails as unknown as HandoverBookingDetails)?.cars?.model}
              </p>
            </div>
            <button
              onClick={onClose}
              className="rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Progress Indicator */}
          <div className="mb-6">
            <HandoverProgressIndicator 
              handoverSessionId={handoverId} 
              showDetailed={false}
            />
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
      </div>
    </>
  );
};

/**
 * Verification Hub Component - Main Container
 * Manages the multi-step verification process with progress tracking
 * Provides navigation between verification steps and overall flow control
 */

import React, { useEffect, useState } from "react";
import { useVerification } from "@/contexts/VerificationContext";
import { useAuth } from "@/hooks/useAuth";
import { VerificationStep, VerificationStatus } from "@/types/verification";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  User,
  FileText,
  Camera,
  Phone,
  MapPin,
  CheckCircle,
  Clock,
  ArrowLeft,
  ArrowRight,
  AlertCircle,
  Shield,
  X,
  Home,
} from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

// Import step components
import { PersonalInfoStep } from "./steps/PersonalInfoStep";
import { DocumentUploadStep } from "./steps/DocumentUploadStep";
import { SelfieVerificationStep } from "./steps/SelfieVerificationStep";
import { PhoneVerificationStep } from "./steps/PhoneVerificationStep";
import { AddressConfirmationStep } from "./steps/AddressConfirmationStep";
import { ReviewSubmitStep } from "./steps/ReviewSubmitStep";
import { ProcessingStatusStep } from "./steps/ProcessingStatusStep";
import { CompletionStep } from "./steps/CompletionStep";

/**
 * Step configuration with metadata for display and navigation
 */
const STEP_CONFIG = {
  [VerificationStep.PERSONAL_INFO]: {
    title: "Personal Information",
    description: "Provide your basic details",
    icon: User,
    component: PersonalInfoStep,
  },
  [VerificationStep.DOCUMENT_UPLOAD]: {
    title: "Document Upload",
    description: "Upload required documents",
    icon: FileText,
    component: DocumentUploadStep,
  },
  [VerificationStep.SELFIE_VERIFICATION]: {
    title: "Selfie Verification",
    description: "Take a verification selfie",
    icon: Camera,
    component: SelfieVerificationStep,
  },
  [VerificationStep.PHONE_VERIFICATION]: {
    title: "Phone Verification",
    description: "Verify your phone number",
    icon: Phone,
    component: PhoneVerificationStep,
  },
  [VerificationStep.ADDRESS_CONFIRMATION]: {
    title: "Address Confirmation",
    description: "Confirm your address",
    icon: MapPin,
    component: AddressConfirmationStep,
  },
  [VerificationStep.REVIEW_SUBMIT]: {
    title: "Review & Submit",
    description: "Review and submit verification",
    icon: CheckCircle,
    component: ReviewSubmitStep,
  },
  [VerificationStep.PROCESSING_STATUS]: {
    title: "Processing",
    description: "Verification in progress",
    icon: Clock,
    component: ProcessingStatusStep,
  },
  [VerificationStep.COMPLETION]: {
    title: "Completed",
    description: "Verification complete",
    icon: Shield,
    component: CompletionStep,
  },
};

/**
 * Progress Stepper Component
 * Shows visual progress through verification steps
 */
const ProgressStepper: React.FC<{
  currentStep: VerificationStep;
  stepStatuses: Record<VerificationStep, VerificationStatus>;
  onStepClick: (step: VerificationStep) => void;
  canNavigateToStep: (step: VerificationStep) => boolean;
}> = ({ currentStep, stepStatuses, onStepClick, canNavigateToStep }) => {
  const steps = Object.values(VerificationStep);

  return (
    <div className="w-full mb-8">
      <div className="flex items-center justify-between mb-4">
        {steps.map((step, index) => {
          const config = STEP_CONFIG[step];
          const Icon = config.icon;
          const status = stepStatuses[step];
          const isCurrent = step === currentStep;
          const isCompleted = status === VerificationStatus.COMPLETED;
          const canNavigate = canNavigateToStep(step);

          return (
            <div key={step} className="contents">
              <div className="flex flex-col items-center">
                <Button
                  variant={
                    isCurrent
                      ? "default"
                      : isCompleted
                        ? "secondary"
                        : "outline"
                  }
                  size="icon"
                  className={`
                    relative h-12 w-12 rounded-full mb-2
                    ${isCurrent ? "ring-2 ring-primary ring-offset-2" : ""}
                    ${isCompleted ? "bg-green-500 hover:bg-green-600" : ""}
                    ${!canNavigate && !isCurrent && !isCompleted ? "opacity-50 cursor-not-allowed" : ""}
                  `}
                  onClick={() => canNavigate && onStepClick(step)}
                  disabled={!canNavigate && !isCurrent && !isCompleted}
                >
                  {isCompleted ? (
                    <CheckCircle className="h-6 w-6 text-white" />
                  ) : (
                    <Icon
                      className={`h-6 w-6 ${isCurrent ? "text-white" : ""}`}
                    />
                  )}

                  {/* Step number badge */}
                  <Badge
                    variant="secondary"
                    className="absolute -top-2 -right-2 h-5 w-5 p-0 text-xs"
                  >
                    {index + 1}
                  </Badge>
                </Button>

                <div className="text-center max-w-[80px]">
                  <p
                    className={`text-xs font-medium ${isCurrent ? "text-primary" : "text-muted-foreground"}`}
                  >
                    {config.title}
                  </p>
                  <p className="text-xs text-muted-foreground hidden sm:block">
                    {config.description}
                  </p>
                </div>
              </div>

              {/* Connector line */}
              {index < steps.length - 1 && (
                <div
                  className={`
                  flex-1 h-0.5 mx-2 mb-8
                  ${isCompleted ? "bg-green-500" : "bg-muted"}
                `}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

/**
 * Main Verification Hub Component
 * Orchestrates the entire verification process
 */
export const VerificationHub: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const {
    verificationData,
    isLoading,
    error,
    isInitialized,
    initializeVerification,
    navigateToStep,
    canNavigateToStep,
    getStepProgress,
    resetVerification,
  } = useVerification();

  const [showDeveloperControls, setShowDeveloperControls] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);

  /**
   * Initialize verification if not already started
   * Uses authenticated user and their role from the profile
   */
  useEffect(() => {
    if (!user?.id) {
      console.log("[VerificationHub] No user ID available, user:", user);
      return;
    }

    console.log(
      "[VerificationHub] User available:",
      user.id,
      "Metadata:",
      user.user_metadata,
    );

    // Add timeout to prevent infinite loading states
    const initTimeout = setTimeout(() => {
      if (isLoading && !isInitialized && !verificationData) {
        console.warn(
          "[VerificationHub] Verification loading timeout, attempting manual initialization",
        );
        const userRole = user.user_metadata?.role || "renter";
        initializeVerification(user.id, userRole).catch(console.error);
      }
    }, 5000);

    if (isInitialized || isLoading || verificationData) {
      clearTimeout(initTimeout);
      return;
    }

    const initializeUserVerification = async () => {
      try {
        // Get user role from profile - default to renter if not specified
        const userRole = user.user_metadata?.role || "renter";

        console.log(
          "[VerificationHub] Initializing verification for user:",
          user.id,
          "Role:",
          userRole,
        );

        await initializeVerification(user.id, userRole);
      } catch (error) {
        console.error(
          "[VerificationHub] Failed to initialize verification:",
          error,
        );
        toast.error("Failed to initialize verification process");
      }
    };

    initializeUserVerification();

    return () => clearTimeout(initTimeout);
  }, [
    user?.id,
    isInitialized,
    isLoading,
    verificationData,
    initializeVerification,
  ]);

  /**
   * Handle step navigation
   * Validates navigation permissions before allowing step change
   */
  const handleStepNavigation = (step: VerificationStep) => {
    if (!canNavigateToStep(step)) {
      toast.error("Please complete the previous steps first");
      return;
    }

    navigateToStep(step);
  };

  /**
   * Handle next step navigation
   * Moves to the next available step
   */
  const handleNextStep = () => {
    if (!verificationData) return;

    const steps = Object.values(VerificationStep);
    const currentIndex = steps.indexOf(verificationData.currentStep);

    if (currentIndex < steps.length - 1) {
      const nextStep = steps[currentIndex + 1];
      handleStepNavigation(nextStep);
    }
  };

  /**
   * Handle previous step navigation
   * Moves to the previous step
   */
  const handlePreviousStep = () => {
    if (!verificationData) return;

    const steps = Object.values(VerificationStep);
    const currentIndex = steps.indexOf(verificationData.currentStep);

    if (currentIndex > 0) {
      const previousStep = steps[currentIndex - 1];
      navigateToStep(previousStep);
    }
  };

  /**
   * Handle canceling verification process
   * Navigates back to home page
   */
  const handleCancelVerification = () => {
    toast.info(
      "Verification canceled. You can resume anytime from your profile.",
    );
    navigate("/");
  };

  /**
   * Handle back to home navigation
   * Quick navigation back to main app
   */
  const handleBackToHome = () => {
    navigate("/");
  };

  /**
   * Get current step component
   * Returns the appropriate step component to render
   */
  const getCurrentStepComponent = () => {
    if (!verificationData) return null;

    const StepComponent = STEP_CONFIG[verificationData.currentStep].component;
    return (
      <StepComponent onNext={handleNextStep} onPrevious={handlePreviousStep} />
    );
  };

  /**
   * Render error state
   */
  if (error) {
    return (
      <div
        className="min-h-screen p-4 flex items-center justify-center"
        style={{ backgroundColor: "#020817" }}
      >
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <CardTitle className="text-red-600">Verification Error</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-muted-foreground">{error}</p>
            <Button onClick={() => window.location.reload()}>Try Again</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  /**
   * Render loading state
   */
  if (isLoading || !verificationData) {
    return (
      <div
        className="min-h-screen p-4 flex items-center justify-center"
        style={{ backgroundColor: "#020817" }}
      >
        <Card className="w-full max-w-md">
          <CardContent className="text-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground mb-4">
              Initializing verification...
            </p>
            {process.env.NODE_ENV === "development" && (
              <Button
                variant="outline"
                onClick={() => {
                  console.log("[VerificationHub] Manual bypass initiated");
                  // Force initialize with a basic verification data structure
                  if (user?.id) {
                    const userRole = user.user_metadata?.role || "renter";
                    initializeVerification(user.id, userRole).catch(() => {
                      // If initialization fails, at least clear loading
                      toast.warning(
                        "Database initialization failed, but you can still test the verification flow",
                      );
                    });
                  }
                }}
              >
                Skip Database Loading (Dev)
              </Button>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  const progress = getStepProgress();
  const currentStepConfig = STEP_CONFIG[verificationData.currentStep];

  return (
    <div className="min-h-screen p-4" style={{ backgroundColor: "#020817" }}>
      <div className="max-w-4xl mx-auto">
        {/* Navigation Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 p-4 bg-white/10 rounded-lg border border-white/20">
          <Button
            variant="outline"
            onClick={handleBackToHome}
            className="flex items-center gap-2 bg-white/90 hover:bg-white text-gray-900"
          >
            <Home className="h-4 w-4" />
            <span className="hidden sm:inline">Back to Home</span>
            <span className="sm:hidden">Home</span>
          </Button>

          <div className="flex items-center gap-2 text-white/80 text-sm">
            <Shield className="h-4 w-4" />
            <span className="hidden sm:inline">
              Secure verification process
            </span>
            <span className="sm:hidden">Secure process</span>
          </div>

          <AlertDialog
            open={showCancelDialog}
            onOpenChange={setShowCancelDialog}
          >
            <AlertDialogTrigger asChild>
              <Button
                variant="outline"
                className="flex items-center gap-2 bg-white/90 hover:bg-white text-gray-900 border-red-200 hover:border-red-300"
              >
                <X className="h-4 w-4" />
                <span className="hidden sm:inline">Cancel Verification</span>
                <span className="sm:hidden">Cancel</span>
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Cancel Verification?</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to cancel the verification process? Your
                  progress will be saved and you can resume later from your
                  profile.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Continue Verification</AlertDialogCancel>
                <AlertDialogAction onClick={handleCancelVerification}>
                  Yes, Cancel
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>

        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white-900 mb-2">
            Identity Verification
          </h1>
          <p className="text-lg text-muted-foreground mb-4">
            Complete your verification to start using MobiRides
          </p>

          {/* Overall Progress */}
          <div className="bg-white rounded-lg p-4 shadow-sm mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Overall Progress</span>
              <span className="text-sm text-muted-foreground">
                {progress.completed} of {progress.total} steps
              </span>
            </div>
            <Progress value={progress.percentage} className="h-2" />
          </div>
        </div>

        {/* Progress Stepper */}
        <ProgressStepper
          currentStep={verificationData.currentStep}
          stepStatuses={verificationData.stepStatuses}
          onStepClick={handleStepNavigation}
          canNavigateToStep={canNavigateToStep}
        />

        {/* Current Step Content */}
        <Card className="mb-8">
          <CardHeader>
            <div className="flex items-center space-x-3">
              <currentStepConfig.icon className="h-6 w-6 text-primary" />
              <div>
                <CardTitle>{currentStepConfig.title}</CardTitle>
                <p className="text-muted-foreground">
                  {currentStepConfig.description}
                </p>
              </div>
            </div>
          </CardHeader>
          <CardContent>{getCurrentStepComponent()}</CardContent>
        </Card>

        {/* Developer Controls (for development only) */}
        {process.env.NODE_ENV === "development" && (
          <Card className="border-dashed border-orange-300 bg-orange-50">
            <CardHeader>
              <Button
                variant="outline"
                onClick={() => setShowDeveloperControls(!showDeveloperControls)}
                className="w-fit"
              >
                {showDeveloperControls ? "Hide" : "Show"} Developer Controls
              </Button>
            </CardHeader>
            {showDeveloperControls && (
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-medium mb-2">Quick Navigation</h4>
                      <div className="space-y-2">
                        {Object.values(VerificationStep).map((step) => (
                          <Button
                            key={step}
                            variant="outline"
                            size="sm"
                            onClick={() => navigateToStep(step)}
                            className="w-full text-left justify-start"
                          >
                            {STEP_CONFIG[step].title}
                          </Button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <h4 className="font-medium mb-2">Development Actions</h4>
                      <div className="space-y-2">
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={resetVerification}
                          className="w-full"
                        >
                          Reset Verification
                        </Button>
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => {
                            console.log(
                              "Current verification data:",
                              verificationData,
                            );
                            toast.success(
                              "Check console for verification data",
                            );
                          }}
                          className="w-full"
                        >
                          Log Verification Data
                        </Button>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  <div className="text-xs text-muted-foreground">
                    <p>
                      <strong>Development Mode:</strong> This panel is only
                      visible in development.
                    </p>
                    <p>
                      <strong>User Role:</strong> {verificationData.userRole}
                    </p>
                    <p>
                      <strong>Current Step:</strong>{" "}
                      {verificationData.currentStep}
                    </p>
                    <p>
                      <strong>Overall Status:</strong>{" "}
                      {verificationData.overallStatus}
                    </p>
                  </div>
                </div>
              </CardContent>
            )}
          </Card>
        )}
      </div>
    </div>
  );
};

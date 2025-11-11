
/**
 * Verification Hub Component - Main Container
 * Updated to work with actual database schema
 */

import React, { useEffect, useState } from "react";
import { useVerification } from "@/hooks/useVerification";
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
import { ReviewSubmitStep } from "./steps/ReviewSubmitStep";
import { SimpleDotProgress } from "./SimpleDotProgress";

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
  [VerificationStep.REVIEW_SUBMIT]: {
    title: "Review & Submit",
    description: "Review and submit verification",
    icon: CheckCircle,
    component: ReviewSubmitStep,
  },
} as const;

// Removed the complex ProgressStepper, replaced by a minimal SimpleDotProgress

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

  useEffect(() => {
    if (!user?.id) {
      console.log("[VerificationHub] No user ID available");
      return;
    }

    if (isInitialized || isLoading || verificationData) {
      return;
    }

    const initializeUserVerification = async () => {
      try {
        const userRole = user.user_metadata?.role || "renter";
        console.log("[VerificationHub] Initializing verification for user:", user.id, "Role:", userRole);
        await initializeVerification(user.id, userRole);
      } catch (error) {
        console.error("[VerificationHub] Failed to initialize verification:", error);
        toast.error("Failed to initialize verification process");
      }
    };

    initializeUserVerification();
  }, [user?.id, isInitialized, isLoading, verificationData]);

  // Simplified 3-step flow: no auto-redirect to completion

  const handleStepNavigation = (step: VerificationStep) => {
    if (!canNavigateToStep(step)) {
      toast.error("Please complete the previous steps first");
      return;
    }
    navigateToStep(step);
  };

  const handleNextStep = () => {
    if (!verificationData) return;
    const steps = Object.keys(STEP_CONFIG) as VerificationStep[];
    const currentIndex = steps.indexOf(verificationData.current_step as VerificationStep);
    if (currentIndex < steps.length - 1) {
      const nextStep = steps[currentIndex + 1];
      handleStepNavigation(nextStep);
    }
  };

  const handlePreviousStep = () => {
    if (!verificationData) return;
    const steps = Object.keys(STEP_CONFIG) as VerificationStep[];
    const currentIndex = steps.indexOf(verificationData.current_step as VerificationStep);
    if (currentIndex > 0) {
      const previousStep = steps[currentIndex - 1];
      navigateToStep(previousStep);
    }
  };

  const handleCancelVerification = () => {
    toast.info("Verification canceled. You can resume anytime from your profile.");
    navigate("/");
  };

  const handleBackToHome = () => {
    navigate("/");
  };

  const getCurrentStepComponent = () => {
    if (!verificationData) return null;

    const StepComponent = STEP_CONFIG[verificationData.current_step as VerificationStep].component;
    return (
      <StepComponent onNext={handleNextStep} onPrevious={handlePreviousStep} />
    );
  };

  if (error) {
    return (
      <div className="min-h-screen p-4 flex items-center justify-center" style={{ backgroundColor: "#020817" }}>
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

  if (isLoading || !verificationData) {
    return (
      <div className="min-h-screen p-4 flex items-center justify-center" style={{ backgroundColor: "#020817" }}>
        <Card className="w-full max-w-md">
          <CardContent className="text-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground mb-4">Initializing verification...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Completion redirect is now handled in useEffect above

  const progress = getStepProgress();
  const currentStepConfig = STEP_CONFIG[verificationData?.current_step as VerificationStep];

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
            <span className="hidden sm:inline">Secure verification process</span>
            <span className="sm:hidden">Secure process</span>
          </div>

          <AlertDialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
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
                  Are you sure you want to cancel the verification process? Your progress will be saved and you can resume later from your profile.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Continue Verification</AlertDialogCancel>
                <AlertDialogAction onClick={handleCancelVerification}>Yes, Cancel</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>

        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Identity Verification</h1>
          <p className="text-lg text-muted-foreground mb-4">Complete your verification to start using MobiRides</p>

          <div className="bg-white rounded-lg p-4 shadow-sm mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Overall Progress</span>
              <span className="text-sm text-muted-foreground">{progress.completed} of {progress.total} steps</span>
            </div>
            <Progress value={progress.percentage} className="h-2" />
          </div>
        </div>

        {/* Simplified Progress (3 steps) */}
        <SimpleDotProgress
          currentStep={verificationData?.current_step as VerificationStep}
          steps={[
            VerificationStep.PERSONAL_INFO,
            VerificationStep.DOCUMENT_UPLOAD,
            VerificationStep.REVIEW_SUBMIT,
          ]}
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
                <p className="text-muted-foreground">{currentStepConfig.description}</p>
              </div>
            </div>
          </CardHeader>
          <CardContent>{getCurrentStepComponent()}</CardContent>
        </Card>

        {/* Development Controls */}
        {process.env.NODE_ENV === "development" && (
          <Card className="mt-6 border-orange-200">
            <CardHeader>
              <Button
                variant="ghost"
                onClick={() => setShowDeveloperControls(!showDeveloperControls)}
                className="justify-start p-0 h-auto text-orange-600 hover:text-orange-700"
              >
                🛠️ Developer Controls {showDeveloperControls ? "▼" : "▶"}
              </Button>
            </CardHeader>
            {showDeveloperControls && (
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    {(Object.keys(STEP_CONFIG) as VerificationStep[]).map((step) => (
                      <Button
                        key={step}
                        variant="outline"
                        size="sm"
                        onClick={() => navigateToStep(step)}
                        className="text-xs"
                      >
                        {step.replace("_", " ")}
                      </Button>
                    ))}
                  </div>
                  <Separator />
                  <div className="flex gap-2">
                    <Button variant="destructive" size="sm" onClick={resetVerification}>
                      Reset Verification
                    </Button>
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

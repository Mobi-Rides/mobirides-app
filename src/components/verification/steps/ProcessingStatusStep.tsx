
/**
 * Processing Status Step Component
 * Shows real-time status of verification processing
 * Includes progress tracking and estimated completion time
 */

import React, { useState, useEffect } from "react";
import { useVerification } from "@/contexts/VerificationContext";
import { useAuth } from "@/hooks/useAuth";
import { VerificationService } from "@/services/verificationService";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import {
  Clock,
  CheckCircle,
  AlertCircle,
  Eye,
  FileCheck,
  UserCheck,
  Shield,
  Mail,
} from "lucide-react";
import { toast } from "sonner";
import { triggerVerificationCompletionEvent } from "@/hooks/useVerificationStatus";

interface ProcessingStatusStepProps {
  onNext: () => void;
  onPrevious: () => void;
}

/**
 * Processing Stage Component
 * Shows individual processing stages with status
 */
const ProcessingStage: React.FC<{
  title: string;
  description: string;
  icon: React.ReactNode;
  status: "pending" | "in_progress" | "completed";
  estimatedTime?: string;
}> = ({ title, description, icon, status, estimatedTime }) => {
  const getStatusColor = () => {
    switch (status) {
      case "completed":
        return "text-green-600";
      case "in_progress":
        return "text-blue-600";
      default:
        return "text-gray-400";
    }
  };

  const getStatusBadge = () => {
    switch (status) {
      case "completed":
        return (
          <Badge variant="secondary" className="bg-green-100 text-green-700">
            <CheckCircle className="h-3 w-3 mr-1" />
            Complete
          </Badge>
        );
      case "in_progress":
        return (
          <Badge variant="secondary" className="bg-blue-100 text-blue-700">
            <Clock className="h-3 w-3 mr-1" />
            Processing
          </Badge>
        );
      default:
        return <Badge variant="outline">Pending</Badge>;
    }
  };

  return (
    <div className="flex items-start space-x-4 p-4 border rounded-lg">
      <div
        className={`p-2 rounded-full ${status === "completed" ? "bg-green-100" : status === "in_progress" ? "bg-blue-100" : "bg-gray-100"}`}
      >
        <div className={getStatusColor()}>{icon}</div>
      </div>

      <div className="flex-1">
        <div className="flex items-center justify-between mb-1">
          <h4 className="font-medium">{title}</h4>
          {getStatusBadge()}
        </div>
        <p className="text-sm text-muted-foreground mb-2">{description}</p>

        {status === "in_progress" && (
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
              <span className="text-sm text-blue-600">Processing...</span>
            </div>
            {estimatedTime && (
              <p className="text-xs text-muted-foreground">
                Estimated time: {estimatedTime}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

/**
 * Main Processing Status Step Component
 */
export const ProcessingStatusStep: React.FC<ProcessingStatusStepProps> = ({
  onNext,
}) => {
  const { user } = useAuth();
  const { verificationData, refreshData } = useVerification();
  const [processingProgress, setProcessingProgress] = useState(25);
  const [currentStage, setCurrentStage] = useState(0);
  const [isCompleting, setIsCompleting] = useState(false);

  // Processing stages configuration
  const processingStages = [
    {
      title: "Document Review",
      description:
        "Our team is reviewing your uploaded documents for authenticity and completeness",
      icon: <FileCheck className="h-5 w-5" />,
      estimatedTime: "2-4 hours",
    },
    {
      title: "Identity Verification",
      description:
        "Verifying your identity against official databases and cross-referencing documents",
      icon: <UserCheck className="h-5 w-5" />,
      estimatedTime: "4-8 hours",
    },
    {
      title: "Address Confirmation",
      description:
        "Confirming your residential address and proof of address documents",
      icon: <Eye className="h-5 w-5" />,
      estimatedTime: "1-2 hours",
    },
    {
      title: "Final Approval",
      description: "Final review and approval of your verification application",
      icon: <Shield className="h-5 w-5" />,
      estimatedTime: "30 minutes",
    },
  ];

  /**
   * Simulate processing progress for development
   */
  useEffect(() => {
    const interval = setInterval(() => {
      setProcessingProgress((prev) => {
        const newProgress = Math.min(prev + 8, 100); // Ensure we don't exceed 100%

        // Update current stage based on progress
        if (newProgress >= 25 && currentStage < 1) setCurrentStage(1);
        if (newProgress >= 50 && currentStage < 2) setCurrentStage(2);
        if (newProgress >= 75 && currentStage < 3) setCurrentStage(3);

        return newProgress;
      });
    }, 2000); // Update every 2 seconds for faster demo

    return () => clearInterval(interval);
  }, [currentStage]);

  // Separate effect to handle completion
  useEffect(() => {
    if (processingProgress >= 100) {
      const completionTimeout = setTimeout(() => {
        console.log("[ProcessingStatusStep] Auto-advancing to completion step");
        onNext();
      }, 3000); // Wait 3 seconds after reaching 100%

      return () => clearTimeout(completionTimeout);
    }
  }, [processingProgress, onNext]);

  /**
   * Check for data updates
   */
  useEffect(() => {
    const checkForUpdates = setInterval(() => {
      refreshData();
    }, 10000); // Check every 10 seconds

    return () => clearInterval(checkForUpdates);
  }, [refreshData]);

  /**
   * Get stage status based on current progress
   */
  const getStageStatus = (
    index: number,
  ): "pending" | "in_progress" | "completed" => {
    if (index < currentStage) return "completed";
    if (index === currentStage) return "in_progress";
    return "pending";
  };

  /**
   * Calculate estimated completion time
   */
  const getEstimatedCompletion = (): string => {
    const now = new Date();
    const hoursRemaining = Math.max(
      1,
      Math.ceil((100 - processingProgress) / 10),
    );
    const completionTime = new Date(
      now.getTime() + hoursRemaining * 60 * 60 * 1000,
    );

    return completionTime.toLocaleString("en-BW", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Check if processing is complete
  const isProcessingComplete =
    verificationData?.overall_status === "completed";

  // Track long processing time
  const [processingStartTime] = React.useState(Date.now());
  const [showLongWaitMessage, setShowLongWaitMessage] = React.useState(false);

  /**
   * Handle manual verification completion (for development)
   */
  const handleCompleteVerification = async () => {
    if (!user?.id) {
      console.error("No user ID available for verification completion");
      return;
    }

    try {
      setIsCompleting(true);
      console.log(
        "[ProcessingStatusStep] Manually completing verification for user:",
        user.id,
      );

      // Complete the verification in the database
      await VerificationService.completeVerification(user.id);

      // Update progress to 100%
      setProcessingProgress(100);
      setCurrentStage(3);

      // Refresh the verification data to get updated status
      await refreshData();

      console.log("[ProcessingStatusStep] Verification completed successfully");
      toast.success("Verification approved and completed!");

      // Trigger verification status refresh for all components
      triggerVerificationCompletionEvent();

      // Also trigger a storage event to ensure all tabs/components are notified
      window.dispatchEvent(
        new StorageEvent("storage", {
          key: "verification_status_update",
          newValue: new Date().toISOString(),
          url: window.location.href,
        }),
      );

      // Wait a moment then advance to next step
      setTimeout(() => {
        onNext();
      }, 2000);
    } catch (error) {
      console.error(
        "[ProcessingStatusStep] Failed to complete verification:",
        error,
      );
      // Still update UI to show completion for development
      setProcessingProgress(100);
      setCurrentStage(3);
      setTimeout(() => onNext(), 2000);
    } finally {
      setIsCompleting(false);
    }
  };

  React.useEffect(() => {
    const checkLongWait = setInterval(() => {
      if (Date.now() - processingStartTime > 60 * 60 * 1000) {
        setShowLongWaitMessage(true);
      }
    }, 60000); // Check every minute

    return () => clearInterval(checkLongWait);
  }, [processingStartTime]);

  // Auto-advance to completion step when processing is complete
  React.useEffect(() => {
    if (isProcessingComplete) {
      const timeout = setTimeout(() => {
        console.log(
          "[ProcessingStatusStep] Verification already complete, advancing",
        );
        onNext();
      }, 1000);
      return () => clearTimeout(timeout);
    }
  }, [isProcessingComplete, onNext]);

  if (isProcessingComplete) {
    return (
      <div className="text-center p-8">
        <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-green-700 mb-2">
          Verification Complete!
        </h2>
        <p className="text-muted-foreground">
          Redirecting to completion step...
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Step Introduction */}
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2">Verification in Progress</h2>
        <p className="text-muted-foreground">
          Your verification is being processed by our team
        </p>
      </div>

      {showLongWaitMessage && (
        <div className="p-4 bg-yellow-100 border border-yellow-300 rounded text-yellow-800">
          <strong>Note:</strong> Verification processing is taking longer than
          usual. If you have any concerns, please contact our support team with
          your reference number.
        </div>
      )}

      {/* Overall Progress */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Overall Progress</span>
            <Badge variant="secondary" className="bg-blue-100 text-blue-700">
              <Clock className="h-3 w-3 mr-1" />
              Processing
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Verification Progress</span>
              <span>{processingProgress}%</span>
            </div>
            <Progress value={processingProgress} className="h-3" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <p className="font-medium">Estimated Completion</p>
              <p className="text-muted-foreground">
                {getEstimatedCompletion()}
              </p>
            </div>
            <div>
              <p className="font-medium">Reference Number</p>
              <p className="text-muted-foreground font-mono">
                {verificationData?.user_id
                  ? `VER-${verificationData.user_id.slice(-8).toUpperCase()}`
                  : "Generating..."}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Processing Stages */}
      <Card>
        <CardHeader>
          <CardTitle>Processing Stages</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {processingStages.map((stage, index) => (
              <ProcessingStage
                key={index}
                title={stage.title}
                description={stage.description}
                icon={stage.icon}
                status={getStageStatus(index)}
                estimatedTime={
                  getStageStatus(index) === "in_progress"
                    ? stage.estimatedTime
                    : undefined
                }
              />
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Status Updates */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Mail className="h-5 w-5" />
            <span>Status Updates</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center space-x-3 p-3 bg-green-50 rounded-lg">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <div>
                <p className="font-medium text-green-700">
                  Verification Submitted
                </p>
                <p className="text-sm text-green-600">
                  {verificationData?.created_at
                    ? new Date(verificationData.created_at).toLocaleString()
                    : "Just now"}
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-3 p-3 bg-blue-50 rounded-lg">
              <Clock className="h-5 w-5 text-blue-600" />
              <div>
                <p className="font-medium text-blue-700">Review in Progress</p>
                <p className="text-sm text-blue-600">
                  Our verification team is currently reviewing your documents
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Information and Support */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <strong>What happens next?</strong> You'll receive email
            notifications for any status updates. You can close this page and
            return anytime to check progress.
          </AlertDescription>
        </Alert>

        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <strong>Need help?</strong> If you have questions about your
            verification, contact our support team with your reference number.
          </AlertDescription>
        </Alert>
      </div>

      {/* Development Notice */}
      {process.env.NODE_ENV === "development" && (
        <Alert className="border-orange-200 bg-orange-50">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <div className="flex items-center justify-between">
              <div>
                <strong>Development Mode:</strong> Processing is simulated and
                will complete automatically. In production, this would take 1-3
                business days.
                <br />
                <span className="text-sm">
                  You can also manually complete the verification for testing.
                </span>
              </div>
              <Button
                onClick={handleCompleteVerification}
                disabled={isCompleting}
                size="sm"
                className="ml-4"
              >
                {isCompleting ? "Completing..." : "Complete Now"}
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};

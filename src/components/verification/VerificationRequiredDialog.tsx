/**
 * Verification Required Dialog Component
 * Shows when user needs verification before performing certain actions
 * Provides seamless flow to verification process and back to original action
 */

import React from "react";
import { useNavigate } from "react-router-dom";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import {
  Shield,
  CheckCircle,
  ArrowRight,
  FileText,
  Camera,
  Phone,
  X,
} from "lucide-react";

interface VerificationRequiredDialogProps {
  isOpen: boolean;
  onClose: () => void;
  action: "booking" | "listing" | "general";
  carData?: any; // Car data for booking context
  title?: string;
  description?: string;
}

/**
 * Dialog that appears when verification is required
 */
export const VerificationRequiredDialog: React.FC<
  VerificationRequiredDialogProps
> = ({ isOpen, onClose, action = "general", carData, title, description }) => {
  const navigate = useNavigate();

  /**
   * Get action-specific content
   */
  const getActionContent = () => {
    switch (action) {
      case "booking":
        return {
          title: title || "Verification Required to Book",
          description:
            description ||
            `To book "${carData?.brand} ${carData?.model}", you need to complete identity verification first.`,
          benefits: [
            "Secure booking process",
            "Trusted member status",
            "Faster future bookings",
            "Enhanced account security",
          ],
        };
      case "listing":
        return {
          title: title || "Verification Required to List Vehicle",
          description:
            description ||
            "To list your vehicle on MobiRides, you need to complete identity verification first.",
          benefits: [
            "Host verification badge",
            "Higher booking rates",
            "Trusted host status",
            "Enhanced earnings potential",
          ],
        };
      default:
        return {
          title: title || "Identity Verification Required",
          description:
            description ||
            "To continue using MobiRides, please complete your identity verification.",
          benefits: [
            "Full platform access",
            "Trusted member badge",
            "Enhanced security",
            "Priority support",
          ],
        };
    }
  };

  /**
   * Handle verification start
   */
  const handleStartVerification = () => {
    // Store the current context for return navigation
    const returnContext = {
      action,
      carData,
      timestamp: Date.now(),
    };

    sessionStorage.setItem(
      "verification_return_context",
      JSON.stringify(returnContext),
    );

    // Navigate to verification
    navigate("/verification");
    onClose();
  };

  const content = getActionContent();

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Shield className="h-6 w-6 text-primary" />
              <DialogTitle>{content.title}</DialogTitle>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="h-6 w-6"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <DialogDescription className="text-left">
            {content.description}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Verification Process Overview */}
          <div className="space-y-3">
            <h4 className="font-medium">Quick Verification Process:</h4>
            <div className="grid grid-cols-1 gap-2">
              <div className="flex items-center space-x-3 p-2 bg-gray-50 rounded-lg">
                <FileText className="h-4 w-4 text-blue-500" />
                <span className="text-sm">Upload ID & documents</span>
                <Badge variant="outline" className="text-xs">
                  2-3 min
                </Badge>
              </div>
              <div className="flex items-center space-x-3 p-2 bg-gray-50 rounded-lg">
                <Camera className="h-4 w-4 text-green-500" />
                <span className="text-sm">Take verification selfie</span>
                <Badge variant="outline" className="text-xs">
                  1 min
                </Badge>
              </div>
              <div className="flex items-center space-x-3 p-2 bg-gray-50 rounded-lg">
                <Phone className="h-4 w-4 text-purple-500" />
                <span className="text-sm">Verify phone number</span>
                <Badge variant="outline" className="text-xs">
                  1 min
                </Badge>
              </div>
            </div>
          </div>

          {/* Benefits */}
          <div className="space-y-3">
            <h4 className="font-medium">You'll get:</h4>
            <div className="space-y-2">
              {content.benefits.map((benefit, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span className="text-sm">{benefit}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Security Notice */}
          <Alert>
            <Shield className="h-4 w-4" />
            <AlertDescription className="text-sm">
              <strong>One-time verification:</strong> Complete this once and
              enjoy seamless access to all MobiRides features.
            </AlertDescription>
          </Alert>

          {/* Action Buttons */}
          <div className="flex flex-col space-y-3">
            <Button
              onClick={handleStartVerification}
              className="w-full flex items-center space-x-2"
            >
              <span>Start Verification</span>
              <ArrowRight className="h-4 w-4" />
            </Button>

            <Button variant="outline" onClick={onClose} className="w-full">
              Maybe Later
            </Button>
          </div>

          {/* Time estimate */}
          <div className="text-center">
            <p className="text-xs text-muted-foreground">
              Total time: ~5 minutes • Secure & encrypted process
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

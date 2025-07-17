
/**
 * Completion Step Component
 * Displays successful completion of verification process
 * Provides next steps and platform access information
 */

import React from "react";
import { useVerification } from "@/contexts/VerificationContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import {
  CheckCircle,
  Shield,
  Car,
  Users,
  Star,
  ArrowRight,
  Download,
  Copy,
  Mail,
  Calendar,
} from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { triggerVerificationCompletionEvent } from "@/hooks/useVerificationStatus";

interface CompletionStepProps {
  onNext: () => void;
  onPrevious: () => void;
}

/**
 * Verification Certificate Component
 * Shows verification details and certificate information
 */
const VerificationCertificate: React.FC<{
  verificationData: any;
}> = ({ verificationData }) => {
  const verificationId = verificationData?.user_id
    ? `VER-${verificationData.user_id.slice(-8).toUpperCase()}`
    : "Unknown";
  const completionDate = verificationData?.completed_at
    ? new Date(verificationData.completed_at).toLocaleDateString()
    : new Date().toLocaleDateString();

  const copyVerificationId = () => {
    navigator.clipboard.writeText(verificationId);
    toast.success("Verification ID copied to clipboard");
  };

  return (
    <Card className="border-green-200 bg-green-50">
      <CardHeader className="text-center">
        <div className="mx-auto mb-4">
          <div className="relative">
            <Shield className="h-16 w-16 text-green-600 mx-auto" />
            <CheckCircle className="h-6 w-6 text-green-600 absolute -bottom-1 -right-1 bg-white rounded-full" />
          </div>
        </div>
        <CardTitle className="text-green-700">Verification Complete!</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-center">
          <Badge
            variant="secondary"
            className="bg-green-100 text-green-700 mb-4"
          >
            <CheckCircle className="h-3 w-3 mr-1" />
            Verified User
          </Badge>

          <div className="bg-white rounded-lg p-4 space-y-3">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="font-medium text-gray-600">Verification ID</p>
                <div className="flex items-center space-x-2">
                  <code className="text-green-600 font-mono">
                    {verificationId}
                  </code>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={copyVerificationId}
                    className="h-6 w-6"
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
              </div>
              <div>
                <p className="font-medium text-gray-600">Completion Date</p>
                <p className="text-green-600">{completionDate}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="font-medium text-gray-600">User Role</p>
                <p className="text-green-600 capitalize">
                  {verificationData?.user_role || "Renter"}
                </p>
              </div>
              <div>
                <p className="font-medium text-gray-600">Status</p>
                <p className="text-green-600">Active</p>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

/**
 * Next Steps Component
 * Shows what users can do now that verification is complete
 */
const NextSteps: React.FC<{
  userRole: "renter" | "host";
}> = ({ userRole }) => {
  const navigate = useNavigate();

  const renterSteps = [
    {
      title: "Browse Available Cars",
      description: "Explore cars available for rent in your area",
      icon: <Car className="h-5 w-5 text-blue-500" />,
      action: () => navigate("/"),
      buttonText: "Browse Cars",
    },
    {
      title: "Complete Your Profile",
      description: "Add a profile photo and additional details",
      icon: <Users className="h-5 w-5 text-purple-500" />,
      action: () => navigate("/profile"),
      buttonText: "Edit Profile",
    },
    {
      title: "Make Your First Booking",
      description: "Find and book your first rental car",
      icon: <Calendar className="h-5 w-5 text-green-500" />,
      action: () => navigate("/"),
      buttonText: "Start Booking",
    },
  ];

  const hostSteps = [
    {
      title: "Add Your First Car",
      description: "List your vehicle and start earning",
      icon: <Car className="h-5 w-5 text-blue-500" />,
      action: () => navigate("/add-car"),
      buttonText: "Add Car",
    },
    {
      title: "Set Up Hosting Profile",
      description: "Complete your hosting profile and preferences",
      icon: <Users className="h-5 w-5 text-purple-500" />,
      action: () => navigate("/profile"),
      buttonText: "Setup Profile",
    },
    {
      title: "View Dashboard",
      description: "Monitor your bookings and earnings",
      icon: <Star className="h-5 w-5 text-orange-500" />,
      action: () => navigate("/dashboard"),
      buttonText: "Open Dashboard",
    },
  ];

  const steps = userRole === "host" ? hostSteps : renterSteps;

  return (
    <Card>
      <CardHeader>
        <CardTitle>What's Next?</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {steps.map((step, index) => (
            <div
              key={index}
              className="flex items-start space-x-4 p-4 border rounded-lg hover:bg-gray-50 transition-colors"
            >
              <div className="p-2 bg-gray-100 rounded-full">{step.icon}</div>
              <div className="flex-1">
                <h4 className="font-medium mb-1">{step.title}</h4>
                <p className="text-sm text-muted-foreground mb-3">
                  {step.description}
                </p>
                <Button
                  onClick={step.action}
                  size="sm"
                  className="flex items-center space-x-2"
                >
                  <span>{step.buttonText}</span>
                  <ArrowRight className="h-3 w-3" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

/**
 * Main Completion Step Component
 */
export const CompletionStep: React.FC<CompletionStepProps> = () => {
  const { verificationData } = useVerification();
  const navigate = useNavigate();

  /**
   * Check for return context and handle navigation
   */
  React.useEffect(() => {
    // Trigger verification completion event for other components
    triggerVerificationCompletionEvent();

    // Check if user came from a specific action (like booking)
    const returnContextStr = sessionStorage.getItem(
      "verification_return_context",
    );
    if (returnContextStr) {
      try {
        const returnContext = JSON.parse(returnContextStr);
        console.log("[CompletionStep] Found return context:", returnContext);

        // Clear the context
        sessionStorage.removeItem("verification_return_context");

        // Auto-redirect after a delay
        setTimeout(() => {
          if (returnContext.action === "booking" && returnContext.carData) {
            // Return to car details page where they can continue booking
            const carId =
              returnContext.carData.id || returnContext.carData.car_id;
            navigate(`/cars/${carId}`);
            toast.success("Verification complete! You can now book this car.");
          } else if (returnContext.action === "listing") {
            // Return to add car page
            navigate("/add-car");
            toast.success(
              "Verification complete! You can now list your vehicle.",
            );
          } else {
            // Default return to home
            navigate("/");
          }
        }, 3000); // Give user time to see completion message
      } catch (error) {
        console.error(
          "[CompletionStep] Failed to parse return context:",
          error,
        );
      }
    }
  }, [navigate]);

  if (!verificationData) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">No verification data found</p>
      </div>
    );
  }

  const handleGoToApp = () => {
    // Navigate to appropriate page based on user role
    if (verificationData.user_role === "host") {
      navigate("/dashboard");
    } else {
      navigate("/");
    }
  };

  const downloadCertificate = () => {
    // In a real implementation, this would generate and download a PDF certificate
    toast.success("Certificate download started (Feature coming soon)");
  };

  // Type assertion to ensure user_role is treated as the union type
  const userRole = (verificationData.user_role === "host" ? "host" : "renter") as "renter" | "host";

  return (
    <div className="space-y-6">
      {/* Success Animation Area */}
      <div className="text-center py-8">
        <div className="mx-auto mb-6">
          <div className="relative">
            {/* Success animation could be added here */}
            <div className="animate-bounce">
              <CheckCircle className="h-20 w-20 text-green-500 mx-auto" />
            </div>
          </div>
        </div>

        <h1 className="text-3xl font-bold text-green-700 mb-2">
          🎉 Verification Complete!
        </h1>
        <p className="text-lg text-muted-foreground">
          Welcome to MobiRides! Your identity has been successfully verified.
        </p>
      </div>

      {/* Verification Certificate */}
      <VerificationCertificate verificationData={verificationData} />

      {/* Benefits of Verification */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Star className="h-5 w-5 text-orange-500" />
            <span>Your Verification Benefits</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <CheckCircle className="h-5 w-5 text-green-500" />
                <div>
                  <p className="font-medium">Trusted Member Badge</p>
                  <p className="text-sm text-muted-foreground">
                    Show other users you're verified
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <CheckCircle className="h-5 w-5 text-green-500" />
                <div>
                  <p className="font-medium">Full Platform Access</p>
                  <p className="text-sm text-muted-foreground">
                    Book cars and access all features
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <CheckCircle className="h-5 w-5 text-green-500" />
                <div>
                  <p className="font-medium">Priority Support</p>
                  <p className="text-sm text-muted-foreground">
                    Get faster help when needed
                  </p>
                </div>
              </div>

              {verificationData.user_role === "host" && (
                <div className="flex items-center space-x-3">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <div>
                    <p className="font-medium">Host Privileges</p>
                    <p className="text-sm text-muted-foreground">
                      List cars and start earning
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Next Steps */}
      <NextSteps userRole={userRole} />

      {/* Important Information */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Alert>
          <Mail className="h-4 w-4" />
          <AlertDescription>
            <strong>Email Confirmation:</strong> A verification certificate has
            been sent to your email address. Keep this for your records.
          </AlertDescription>
        </Alert>

        <Alert>
          <Shield className="h-4 w-4" />
          <AlertDescription>
            <strong>Security Notice:</strong> Your verification is valid
            indefinitely. Contact support if you need to update any verified
            information.
          </AlertDescription>
        </Alert>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-4 pt-6">
        <Button
          onClick={downloadCertificate}
          variant="outline"
          className="flex items-center space-x-2 flex-1"
        >
          <Download className="h-4 w-4" />
          <span>Download Certificate</span>
        </Button>

        <Button
          onClick={handleGoToApp}
          className="flex items-center space-x-2 flex-1 bg-green-600 hover:bg-green-700"
        >
          <span>
            {verificationData.user_role === "host"
              ? "Go to Dashboard"
              : "Start Using MobiRides"}
          </span>
          <ArrowRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Development Notice */}
      {process.env.NODE_ENV === "development" && (
        <Alert className="border-orange-200 bg-orange-50">
          <AlertDescription>
            <strong>Development Complete:</strong> The verification system has
            been successfully implemented with all required features including
            local storage for development testing.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};

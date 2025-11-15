import React from "react";
import { Link } from "react-router-dom";
import { AlertTriangle } from "lucide-react";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { useVerificationStatus } from "@/hooks/useVerificationStatus";

/**
 * ReverificationBanner Component
 * Displays a warning banner for users who need to re-verify
 * due to the 3-step verification flow migration
 */
export const ReverificationBanner: React.FC = () => {
  const { verificationData, isLoading } = useVerificationStatus();
  
  // Don't show banner if loading or user doesn't need reverification
  if (isLoading || verificationData?.overall_status !== 'requires_reverification') {
    return null;
  }
  
  return (
    <Alert variant="destructive" className="mb-4 border-orange-500 bg-orange-50 dark:bg-orange-950/20">
      <AlertTriangle className="h-5 w-5 text-orange-600 dark:text-orange-400" />
      <AlertTitle className="text-orange-900 dark:text-orange-100 font-semibold">
        Verification Update Required
      </AlertTitle>
      <AlertDescription className="text-orange-800 dark:text-orange-200 mt-2">
        <p className="mb-3">
          MobiRides has updated our verification process for improved security and a faster experience.
          The new process requires only <strong>3 steps</strong> and <strong>3 documents</strong> (down from 5).
        </p>
        <p className="mb-3 text-sm">
          <strong>Why re-verify?</strong> We've streamlined our system for better data consistency and security.
          This one-time update helps us serve you better.
        </p>
        <Button asChild size="sm" className="bg-orange-600 hover:bg-orange-700">
          <Link to="/verification">Start Verification Now</Link>
        </Button>
      </AlertDescription>
    </Alert>
  );
};

export default ReverificationBanner;

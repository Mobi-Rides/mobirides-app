
/**
 * Verification Status Hook
 * Provides verification status checking functionality
 */

import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { VerificationService } from "@/services/verificationService";
import { VerificationData, VerificationStatus } from "@/types/verification";

// Global event for verification completion
export const triggerVerificationCompletionEvent = () => {
  window.dispatchEvent(new CustomEvent("verification-completed"));
};

export const useVerificationStatus = () => {
  const { user } = useAuth();
  const [verificationData, setVerificationData] = useState<VerificationData | null>(null);
  const [isVerified, setIsVerified] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const checkVerificationStatus = async () => {
    if (!user?.id) return;

    try {
      setIsLoading(true);
      const data = await VerificationService.loadVerificationData(user.id);
      
      if (data) {
        setVerificationData(data);
        setIsVerified(data.overall_status === VerificationStatus.COMPLETED);
      } else {
        setVerificationData(null);
        setIsVerified(false);
      }
    } catch (error) {
      console.error("Failed to check verification status:", error);
      setVerificationData(null);
      setIsVerified(false);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    checkVerificationStatus();
  }, [user?.id]);

  // Listen for verification completion events
  useEffect(() => {
    const handleVerificationComplete = () => {
      checkVerificationStatus();
    };

    window.addEventListener("verification-completed", handleVerificationComplete);
    return () => {
      window.removeEventListener("verification-completed", handleVerificationComplete);
    };
  }, []);

  return {
    verificationData,
    isVerified,
    isLoading,
    refetch: checkVerificationStatus,
  };
};

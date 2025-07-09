/**
 * Hook to check user verification status
 * Determines if user needs to complete verification before certain actions
 */

import { useState, useEffect } from "react";
import { VerificationService } from "@/services/verificationService";
import { VerificationStatus } from "@/types/verification";
import { supabase } from "@/integrations/supabase/client";

interface VerificationStatusHook {
  isVerified: boolean;
  isLoading: boolean;
  verificationData: any;
  checkVerificationStatus: () => Promise<void>;
}

/**
 * Hook to check and manage user verification status
 */
export const useVerificationStatus = (): VerificationStatusHook => {
  const [isVerified, setIsVerified] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [verificationData, setVerificationData] = useState(null);

  /**
   * Check verification status for current user
   */
  const checkVerificationStatus = async () => {
    try {
      setIsLoading(true);

      // Get current authenticated user
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setIsVerified(false);
        setVerificationData(null);
        return;
      }

      // Check profile verification status first (most reliable source)
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("verification_status, verification_completed_at")
        .eq("id", user.id)
        .single();

      if (profileError) {
        console.error(
          "[VerificationStatus] Error checking profile status:",
          profileError,
        );
        setIsVerified(false);
        setVerificationData(null);
        return;
      }

      // Load full verification data from Supabase
      const verificationData = await VerificationService.loadVerificationData(
        user.id,
      );

      if (verificationData) {
        // Check if verification is completed (prefer profile status as source of truth)
        const profileStatus = profile?.verification_status;
        const isComplete =
          profileStatus === VerificationStatus.COMPLETED ||
          profileStatus === "completed" ||
          verificationData.overallStatus === VerificationStatus.COMPLETED;

        setIsVerified(isComplete);
        setVerificationData(verificationData);

        console.log("[VerificationStatus] User verification status:", {
          userId: user.id,
          isVerified: isComplete,
          profileStatus: profileStatus,
          dataStatus: verificationData.overallStatus,
          completedAt: profile?.verification_completed_at,
        });
      } else {
        // No verification data found - user is not verified
        const isComplete =
          profile?.verification_status === VerificationStatus.COMPLETED ||
          profile?.verification_status === "completed";

        setIsVerified(isComplete);
        setVerificationData(null);

        console.log(
          "[VerificationStatus] No verification data found for user:",
          user.id,
          "Profile status:",
          profile?.verification_status,
        );
      }
    } catch (error) {
      console.error(
        "[VerificationStatus] Failed to check verification status:",
        error,
      );
      setIsVerified(false);
      setVerificationData(null);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Check verification status on mount and when auth changes
   */
  useEffect(() => {
    checkVerificationStatus();

    // Listen for auth state changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" || event === "SIGNED_OUT") {
        checkVerificationStatus();
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  /**
   * Listen for verification completion (for real-time updates)
   */
  useEffect(() => {
    const handleVerificationUpdate = () => {
      checkVerificationStatus();
    };

    // Listen for storage changes (when verification is completed in another tab)
    window.addEventListener("storage", handleVerificationUpdate);

    // Listen for custom verification completion event
    window.addEventListener("verificationCompleted", handleVerificationUpdate);

    return () => {
      window.removeEventListener("storage", handleVerificationUpdate);
      window.removeEventListener(
        "verificationCompleted",
        handleVerificationUpdate,
      );
    };
  }, []);

  return {
    isVerified,
    isLoading,
    verificationData,
    checkVerificationStatus,
  };
};

/**
 * Helper function to trigger verification completion event
 * Call this when verification is completed to notify other components
 */
export const triggerVerificationCompletionEvent = () => {
  const event = new CustomEvent("verificationCompleted");
  window.dispatchEvent(event);
};

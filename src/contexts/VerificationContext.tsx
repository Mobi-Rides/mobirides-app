
/**
 * Verification Context
 * Provides verification state and methods throughout the app
 */

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import {
  VerificationData,
  VerificationStep,
  PersonalInfo,
  PhoneVerification,
  AddressConfirmation,
} from "@/types/verification";
import { VerificationService } from "@/services/verificationService";

interface VerificationContextType {
  // State
  verificationData: VerificationData | null;
  isLoading: boolean;
  error: string | null;
  isInitialized: boolean;

  // Actions
  initializeVerification: (userId: string, userRole: "renter" | "host") => Promise<void>;
  refreshData: () => Promise<void>;
  refreshFromProfile: () => Promise<void>;
  updatePersonalInfo: (personalInfo: Partial<PersonalInfo>) => Promise<void>;
  completeDocumentUpload: (userId: string) => Promise<boolean>;
  completeSelfieVerification: () => Promise<void>;
  updatePhoneVerification: (phoneData: Partial<PhoneVerification>) => Promise<void>;
  updateAddressConfirmation: (addressData: Partial<AddressConfirmation>) => Promise<void>;
  submitForReview: () => Promise<void>;
  navigateToStep: (step: VerificationStep) => Promise<void>;

  // Utilities
  canNavigateToStep: (step: VerificationStep) => boolean;
  getStepProgress: () => { completed: number; total: number; percentage: number };
  resetVerification: () => void;
}

const VerificationContext = createContext<VerificationContextType | undefined>(undefined);

export const useVerification = () => {
  const context = useContext(VerificationContext);
  if (context === undefined) {
    throw new Error("useVerification must be used within a VerificationProvider");
  }
  return context;
};

interface VerificationProviderProps {
  children: React.ReactNode;
}

export const VerificationProvider: React.FC<VerificationProviderProps> = ({ children }) => {
  const [verificationData, setVerificationData] = useState<VerificationData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  const initializeVerification = useCallback(async (userId: string, userRole: "renter" | "host") => {
    // Prevent multiple concurrent initializations
    if (isLoading || isInitialized) {
      console.log("[VerificationContext] Skipping initialization - already loading or initialized");
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      console.log("[VerificationContext] Initializing verification for user:", userId);

      const data = await VerificationService.initializeVerification(userId, userRole);
      setVerificationData(data);
      setIsInitialized(true);
    } catch (error) {
      console.error("[VerificationContext] Failed to initialize verification:", error);
      setError(error instanceof Error ? error.message : "Failed to initialize verification");
    } finally {
      setIsLoading(false);
    }
  }, [isLoading, isInitialized]);

  const refreshData = useCallback(async () => {
    if (!verificationData?.user_id) return;

    try {
      const data = await VerificationService.loadVerificationData(verificationData.user_id);
      if (data) {
        setVerificationData(data);
      }
    } catch (error) {
      console.error("[VerificationContext] Failed to refresh data:", error);
    }
  }, [verificationData?.user_id]);

  const refreshFromProfile = useCallback(async () => {
    if (!verificationData?.user_id) return;

    try {
      setIsLoading(true);
      await VerificationService.refreshFromProfile(verificationData.user_id);
      await refreshData();
    } catch (error) {
      console.error("[VerificationContext] Failed to refresh from profile:", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [verificationData?.user_id, refreshData]);

  const updatePersonalInfo = useCallback(async (personalInfo: Partial<PersonalInfo>) => {
    if (!verificationData?.user_id) throw new Error("No verification data");

    try {
      setIsLoading(true);
      await VerificationService.updatePersonalInfo(verificationData.user_id, personalInfo);
      await refreshData();
    } catch (error) {
      console.error("[VerificationContext] Failed to update personal info:", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [verificationData?.user_id, refreshData]);

  const completeDocumentUpload = useCallback(async (userId: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      const success = await VerificationService.completeDocumentUpload(userId);
      if (success) {
        await refreshData();
      }
      return success;
    } catch (error) {
      console.error("Failed to complete document upload:", error);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [refreshData]);

  const completeSelfieVerification = useCallback(async () => {
    if (!verificationData?.user_id) throw new Error("No verification data");

    try {
      setIsLoading(true);
      await VerificationService.completeSelfieVerification(verificationData.user_id);
      await refreshData();
    } catch (error) {
      console.error("[VerificationContext] Failed to complete selfie verification:", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [verificationData?.user_id, refreshData]);

  const updatePhoneVerification = useCallback(async (phoneData: Partial<PhoneVerification>) => {
    if (!verificationData?.user_id) throw new Error("No verification data");

    try {
      setIsLoading(true);
      await VerificationService.updatePhoneVerification(verificationData.user_id, phoneData);
      await refreshData();
    } catch (error) {
      console.error("[VerificationContext] Failed to update phone verification:", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [verificationData?.user_id, refreshData]);

  const updateAddressConfirmation = useCallback(async (addressData: Partial<AddressConfirmation>) => {
    if (!verificationData?.user_id) throw new Error("No verification data");

    try {
      setIsLoading(true);
      await VerificationService.updateAddressConfirmation(verificationData.user_id, addressData);
      await refreshData();
    } catch (error) {
      console.error("[VerificationContext] Failed to update address confirmation:", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [verificationData?.user_id, refreshData]);

  const submitForReview = useCallback(async () => {
    if (!verificationData?.user_id) throw new Error("No verification data");

    try {
      setIsLoading(true);
      await VerificationService.submitForReview(verificationData.user_id);
      await refreshData();
    } catch (error) {
      console.error("[VerificationContext] Failed to submit for review:", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [verificationData?.user_id, refreshData]);

  const navigateToStep = useCallback(async (step: VerificationStep) => {
    if (!verificationData?.user_id) throw new Error("No verification data");

    try {
      await VerificationService.navigateToStep(verificationData.user_id, step);
      await refreshData();
    } catch (error) {
      console.error("[VerificationContext] Failed to navigate to step:", error);
      throw error;
    }
  }, [verificationData?.user_id, refreshData]);

  const canNavigateToStep = useCallback((step: VerificationStep) => {
    if (!verificationData) return false;

    // Check actual completion status for each step
    switch (step) {
      case VerificationStep.PERSONAL_INFO:
        return true; // Can always access first step
      case VerificationStep.DOCUMENT_UPLOAD:
        return verificationData.personal_info_completed;
      case VerificationStep.SELFIE_VERIFICATION:
        return verificationData.personal_info_completed && verificationData.documents_completed;
      case VerificationStep.PHONE_VERIFICATION:
        return verificationData.personal_info_completed && verificationData.documents_completed && verificationData.selfie_completed;
      case VerificationStep.ADDRESS_CONFIRMATION:
        return verificationData.personal_info_completed && verificationData.documents_completed && verificationData.selfie_completed && verificationData.phone_verified;
      case VerificationStep.REVIEW_SUBMIT:
        return verificationData.personal_info_completed && verificationData.documents_completed && verificationData.selfie_completed && verificationData.phone_verified && verificationData.address_confirmed;
      default:
        return false;
    }
  }, [verificationData]);

  const getStepProgress = useCallback(() => {
    if (!verificationData) return { completed: 0, total: 8, percentage: 0 };

    const steps = Object.values(VerificationStep);
    const currentIndex = steps.indexOf(verificationData.current_step as VerificationStep);
    const completed = currentIndex + 1;
    const total = steps.length;
    const percentage = Math.round((completed / total) * 100);

    return { completed, total, percentage };
  }, [verificationData]);

  const resetVerification = useCallback(() => {
    setVerificationData(null);
    setIsLoading(false);
    setError(null);
    setIsInitialized(false);
  }, []);

  const value: VerificationContextType = {
    // State
    verificationData,
    isLoading,
    error,
    isInitialized,

    // Actions
    initializeVerification,
    refreshData,
    refreshFromProfile,
    updatePersonalInfo,
    completeDocumentUpload,
    completeSelfieVerification,
    updatePhoneVerification,
    updateAddressConfirmation,
    submitForReview,
    navigateToStep,

    // Utilities
    canNavigateToStep,
    getStepProgress,
    resetVerification,
  };

  return (
    <VerificationContext.Provider value={value}>
      {children}
    </VerificationContext.Provider>
  );
};

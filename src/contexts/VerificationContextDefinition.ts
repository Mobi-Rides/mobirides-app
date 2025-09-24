import { createContext } from "react";
import type {
  VerificationStep,
  PersonalInfo,
  PhoneVerification,
  VerificationData,
  VerificationProgress,
} from "@/types/verification";

export interface VerificationContextType {
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
  submitForReview: () => Promise<void>;
  navigateToStep: (step: VerificationStep) => Promise<void>;

  // Utilities
  canNavigateToStep: (step: VerificationStep) => boolean;
  getStepProgress: () => VerificationProgress;
  resetVerification: () => void;
}

export const VerificationContext = createContext<VerificationContextType | undefined>(undefined);
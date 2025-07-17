/**
 * Verification Context for State Management
 * Provides centralized state management for the verification process
 * Handles navigation between steps, data persistence, and validation
 */

import React, {
  createContext,
  useContext,
  useReducer,
  useEffect,
  ReactNode,
} from "react";
import {
  VerificationData,
  VerificationStep,
  VerificationStatus,
  PersonalInfo,
  DocumentUpload,
  PhoneVerification,
  AddressConfirmation,
  StepCompletionData,
} from "@/types/verification";
import { VerificationService } from "@/services/verificationService";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { triggerVerificationCompletionEvent } from "@/hooks/useVerificationStatus";

// Action types for reducer
type VerificationAction =
  | {
      type: "INITIALIZE_VERIFICATION";
      payload: { userId: string; userRole: "renter" | "host" };
    }
  | { type: "LOAD_VERIFICATION_DATA"; payload: VerificationData }
  | { type: "UPDATE_CURRENT_STEP"; payload: VerificationStep }
  | { type: "UPDATE_PERSONAL_INFO"; payload: Partial<PersonalInfo> }
  | { type: "UPDATE_DOCUMENT"; payload: DocumentUpload }
  | { type: "UPDATE_PHONE_VERIFICATION"; payload: Partial<PhoneVerification> }
  | {
      type: "UPDATE_ADDRESS_CONFIRMATION";
      payload: Partial<AddressConfirmation>;
    }
  | { type: "COMPLETE_SELFIE_VERIFICATION" }
  | { type: "SUBMIT_FOR_REVIEW" }
  | { type: "SET_LOADING"; payload: boolean }
  | { type: "SET_ERROR"; payload: string | null }
  | { type: "RESET_VERIFICATION" };

// Context state interface
interface VerificationContextState {
  verificationData: VerificationData | null;
  isLoading: boolean;
  error: string | null;
  isInitialized: boolean;
}

// Context actions interface
interface VerificationContextActions {
  initializeVerification: (
    userId: string,
    userRole: "renter" | "host",
  ) => Promise<void>;
  updatePersonalInfo: (personalInfo: Partial<PersonalInfo>) => Promise<void>;
  updateDocument: (document: DocumentUpload) => Promise<void>;
  updatePhoneVerification: (
    phoneData: Partial<PhoneVerification>,
  ) => Promise<void>;
  updateAddressConfirmation: (
    addressData: Partial<AddressConfirmation>,
  ) => Promise<void>;
  completeSelfieVerification: () => Promise<void>;
  submitForReview: () => Promise<void>;
  navigateToStep: (step: VerificationStep) => void;
  canNavigateToStep: (step: VerificationStep) => boolean;
  getStepProgress: () => {
    completed: number;
    total: number;
    percentage: number;
  };
  resetVerification: () => void;
  refreshData: () => void;
}

// Combined context type
type VerificationContextType = VerificationContextState &
  VerificationContextActions;

// Create context
const VerificationContext = createContext<VerificationContextType | undefined>(
  undefined,
);

// Initial state
const initialState: VerificationContextState = {
  verificationData: null,
  isLoading: false,
  error: null,
  isInitialized: false,
};

/**
 * Verification reducer to handle state updates
 * Manages all verification-related state changes
 */
function verificationReducer(
  state: VerificationContextState,
  action: VerificationAction,
): VerificationContextState {
  switch (action.type) {
    case "INITIALIZE_VERIFICATION":
      return {
        ...state,
        isLoading: true,
        error: null,
      };

    case "LOAD_VERIFICATION_DATA":
      return {
        ...state,
        verificationData: action.payload,
        isLoading: false,
        isInitialized: true,
        error: null,
      };

    case "UPDATE_CURRENT_STEP":
      if (!state.verificationData) return state;
      return {
        ...state,
        verificationData: {
          ...state.verificationData,
          currentStep: action.payload,
        },
      };

    case "UPDATE_PERSONAL_INFO":
      if (!state.verificationData) return state;
      return {
        ...state,
        verificationData: {
          ...state.verificationData,
          personalInfo: {
            ...state.verificationData.personalInfo,
            ...action.payload,
          },
        },
      };

    case "UPDATE_DOCUMENT": {
      if (!state.verificationData) return state;
      const existingDocIndex = state.verificationData.documents.findIndex(
        (doc) => doc.type === action.payload.type,
      );

      let updatedDocuments;
      if (existingDocIndex >= 0) {
        updatedDocuments = [...state.verificationData.documents];
        updatedDocuments[existingDocIndex] = action.payload;
      } else {
        updatedDocuments = [
          ...state.verificationData.documents,
          action.payload,
        ];
      }

      return {
        ...state,
        verificationData: {
          ...state.verificationData,
          documents: updatedDocuments,
        },
      };
    }

    case "UPDATE_PHONE_VERIFICATION":
      if (!state.verificationData) return state;
      return {
        ...state,
        verificationData: {
          ...state.verificationData,
          phoneVerification: {
            ...state.verificationData.phoneVerification,
            ...action.payload,
          },
        },
      };

    case "UPDATE_ADDRESS_CONFIRMATION":
      if (!state.verificationData) return state;
      return {
        ...state,
        verificationData: {
          ...state.verificationData,
          addressConfirmation: {
            ...state.verificationData.addressConfirmation,
            ...action.payload,
          },
        },
      };

    case "SET_LOADING":
      return {
        ...state,
        isLoading: action.payload,
      };

    case "SET_ERROR":
      return {
        ...state,
        error: action.payload,
        isLoading: false,
      };

    case "RESET_VERIFICATION":
      return {
        ...initialState,
      };

    default:
      return state;
  }
}

/**
 * Verification Provider Component
 * Provides verification context to child components
 */
export function VerificationProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(verificationReducer, initialState);
  const { user } = useAuth();

  /**
   * Load existing verification data on mount
   * Attempts to restore previous session data from Supabase
   */
  useEffect(() => {
    let isActive = true; // Prevent race conditions

    const loadExistingData = async () => {
      if (!user?.id) {
        console.log("[VerificationContext] No user ID available, user:", user);
        if (isActive) {
          dispatch({ type: "SET_LOADING", payload: false });
        }
        return;
      }

      // Prevent duplicate calls for the same user
      if (state.verificationData?.userId === user.id && state.isInitialized) {
        console.log(
          "[VerificationContext] Data already loaded for user:",
          user.id,
        );
        return;
      }

      try {
        if (isActive) {
          dispatch({ type: "SET_LOADING", payload: true });
        }
        console.log(
          "[VerificationContext] Starting to load verification data for user:",
          user.id,
          "User object:",
          user,
        );

        // Add timeout to prevent infinite loading
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(
            () => reject(new Error("Verification data loading timeout")),
            10000,
          ),
        );

        const dataPromise = VerificationService.loadVerificationData(user.id);

        const existingData = (await Promise.race([
          dataPromise,
          timeoutPromise,
        ])) as VerificationData | null;

        if (isActive && existingData) {
          dispatch({ type: "LOAD_VERIFICATION_DATA", payload: existingData });
          console.log(
            "[VerificationContext] Loaded existing verification data",
          );

          // Trigger verification status refresh if completed
          if (existingData.overallStatus === VerificationStatus.COMPLETED) {
            triggerVerificationCompletionEvent();
          }
        } else if (isActive) {
          dispatch({ type: "SET_LOADING", payload: false });
          console.log(
            "[VerificationContext] No existing verification data found",
          );
        }
      } catch (error) {
        if (isActive) {
          console.error(
            "[VerificationContext] Failed to load verification data:",
            error,
          );
          dispatch({
            type: "SET_ERROR",
            payload:
              error instanceof Error
                ? error.message
                : "Failed to load verification data",
          });
          dispatch({ type: "SET_LOADING", payload: false });
        }
      }
    };

    loadExistingData();

    return () => {
      isActive = false; // Cleanup function to prevent state updates on unmounted component
    };
  }, [user?.id, state.isInitialized]);

  /**
   * Initialize new verification process
   * Creates new verification record for user
   */
  const initializeVerification = async (
    userId: string,
    userRole: "renter" | "host",
  ) => {
    try {
      dispatch({
        type: "INITIALIZE_VERIFICATION",
        payload: { userId, userRole },
      });

      const newVerificationData =
        await VerificationService.initializeVerification(userId, userRole);
      dispatch({
        type: "LOAD_VERIFICATION_DATA",
        payload: newVerificationData,
      });

      toast.success("Verification process started");
      console.log(
        "[VerificationContext] Verification initialized for user:",
        userId,
      );
    } catch (error) {
      console.error(
        "[VerificationContext] Failed to initialize verification:",
        error,
      );
      dispatch({
        type: "SET_ERROR",
        payload: "Failed to initialize verification",
      });
      toast.error("Failed to start verification process");
    }
  };

  /**
   * Update personal information
   * Validates and saves personal info data
   */
  const updatePersonalInfo = async (personalInfo: Partial<PersonalInfo>) => {
    if (!user?.id) {
      toast.error("User not authenticated");
      return;
    }

    try {
      dispatch({ type: "SET_LOADING", payload: true });

      // Update local state
      dispatch({ type: "UPDATE_PERSONAL_INFO", payload: personalInfo });

      // Save to Supabase
      await VerificationService.updatePersonalInfo(user.id, personalInfo);

      // Reload data to get updated step status
      const updatedData = await VerificationService.loadVerificationData(
        user.id,
      );
      if (updatedData) {
        dispatch({ type: "LOAD_VERIFICATION_DATA", payload: updatedData });
      }

      toast.success("Personal information saved");
      console.log("[VerificationContext] Personal info updated:", personalInfo);
    } catch (error) {
      console.error(
        "[VerificationContext] Failed to update personal info:",
        error,
      );
      dispatch({
        type: "SET_ERROR",
        payload: "Failed to save personal information",
      });
      toast.error("Failed to save personal information");
    } finally {
      dispatch({ type: "SET_LOADING", payload: false });
    }
  };

  /**
   * Update document upload
   * Handles document upload and validation
   */
  const updateDocument = async (document: DocumentUpload) => {
    if (!user?.id) {
      console.error(
        "[VerificationContext] User not authenticated, user:",
        user,
      );
      toast.error("User not authenticated");
      return;
    }

    try {
      dispatch({ type: "SET_LOADING", payload: true });
      console.log(
        "[VerificationContext] Updating document for user:",
        user.id,
        "Document type:",
        document.type,
      );

      // Update local state first to provide immediate feedback
      dispatch({
        type: "UPDATE_DOCUMENT",
        payload: { ...document, status: "completed" },
      });

      // Save to Supabase
      await VerificationService.updateDocument(user.id, document);

      // Reload data to get updated step status
      const updatedData = await VerificationService.loadVerificationData(
        user.id,
      );
      if (updatedData) {
        dispatch({ type: "LOAD_VERIFICATION_DATA", payload: updatedData });
      }

      // Create user-friendly document name
      const documentName = document.type
        .replace(/_/g, " ")
        .replace(/\b\w/g, (l) => l.toUpperCase());

      toast.success(`${documentName} uploaded successfully`);
      console.log("[VerificationContext] Document updated:", document.type);
    } catch (error) {
      console.error(
        "[VerificationContext] Failed to update document:",
        error instanceof Error ? error.message : JSON.stringify(error, null, 2),
      );
      dispatch({ type: "SET_ERROR", payload: "Failed to save document" });
      toast.error("Failed to upload document");
    } finally {
      dispatch({ type: "SET_LOADING", payload: false });
    }
  };

  /**
   * Update phone verification
   * Handles phone verification process
   */
  const updatePhoneVerification = async (
    phoneData: Partial<PhoneVerification>,
  ) => {
    if (!user?.id) {
      toast.error("User not authenticated");
      return;
    }

    console.log(
      "[VerificationContext] Starting phone verification update:",
      phoneData,
    );

    try {
      dispatch({ type: "SET_LOADING", payload: true });

      // Update local state first
      dispatch({ type: "UPDATE_PHONE_VERIFICATION", payload: phoneData });

      // Save to Supabase
      console.log(
        "[VerificationContext] Calling VerificationService.updatePhoneVerification",
      );
      await VerificationService.updatePhoneVerification(user.id, phoneData);
      console.log("[VerificationContext] VerificationService call completed");

      // Reload data to get updated step status
      console.log("[VerificationContext] Reloading verification data");
      const updatedData = await VerificationService.loadVerificationData(
        user.id,
      );
      if (updatedData) {
        dispatch({ type: "LOAD_VERIFICATION_DATA", payload: updatedData });
        console.log(
          "[VerificationContext] Verification data reloaded successfully",
        );
      }

      if (phoneData.isVerified) {
        toast.success("Phone number verified successfully");
      }

      console.log(
        "[VerificationContext] Phone verification updated successfully:",
        phoneData,
      );
    } catch (error) {
      console.error(
        "[VerificationContext] Failed to update phone verification:",
        error,
      );
      dispatch({
        type: "SET_ERROR",
        payload:
          error instanceof Error
            ? error.message
            : "Failed to update phone verification",
      });
      toast.error("Failed to update phone verification");
    } finally {
      console.log("[VerificationContext] Setting loading to false");
      dispatch({ type: "SET_LOADING", payload: false });
    }
  };

  /**
   * Update address confirmation
   * Handles address verification process
   */
  const updateAddressConfirmation = async (
    addressData: Partial<AddressConfirmation>,
  ) => {
    if (!user?.id) {
      toast.error("User not authenticated");
      return;
    }

    try {
      dispatch({ type: "SET_LOADING", payload: true });

      // Update local state
      dispatch({ type: "UPDATE_ADDRESS_CONFIRMATION", payload: addressData });

      // Save to Supabase
      await VerificationService.updateAddressConfirmation(user.id, addressData);

      // Reload data to get updated step status
      const updatedData = await VerificationService.loadVerificationData(
        user.id,
      );
      if (updatedData) {
        dispatch({ type: "LOAD_VERIFICATION_DATA", payload: updatedData });
      }

      if (addressData.isConfirmed) {
        toast.success("Address confirmed successfully");
      }

      console.log(
        "[VerificationContext] Address confirmation updated:",
        addressData,
      );
    } catch (error) {
      console.error(
        "[VerificationContext] Failed to update address confirmation:",
        error,
      );
      dispatch({
        type: "SET_ERROR",
        payload: "Failed to update address confirmation",
      });
      toast.error("Failed to update address confirmation");
    } finally {
      dispatch({ type: "SET_LOADING", payload: false });
    }
  };

  /**
   * Complete selfie verification
   * Marks selfie step as completed
   */
  const completeSelfieVerification = async () => {
    if (!user?.id) {
      toast.error("User not authenticated");
      return;
    }

    try {
      dispatch({ type: "SET_LOADING", payload: true });

      // Update Supabase
      await VerificationService.completeSelfieVerification(user.id);

      // Reload data to get updated step status
      const updatedData = await VerificationService.loadVerificationData(
        user.id,
      );
      if (updatedData) {
        dispatch({ type: "LOAD_VERIFICATION_DATA", payload: updatedData });
      }

      toast.success("Selfie verification completed");
      console.log("[VerificationContext] Selfie verification completed");
    } catch (error) {
      console.error(
        "[VerificationContext] Failed to complete selfie verification:",
        error,
      );
      dispatch({
        type: "SET_ERROR",
        payload: "Failed to complete selfie verification",
      });
      toast.error("Failed to complete selfie verification");
    } finally {
      dispatch({ type: "SET_LOADING", payload: false });
    }
  };

  /**
   * Submit verification for review
   * Final submission of all verification data
   */
  const submitForReview = async () => {
    if (!user?.id) {
      toast.error("User not authenticated");
      return;
    }

    try {
      dispatch({ type: "SET_LOADING", payload: true });

      // Submit for review
      await VerificationService.submitForReview(user.id);

      // Reload data to get updated step status
      const updatedData = await VerificationService.loadVerificationData(
        user.id,
      );
      if (updatedData) {
        dispatch({ type: "LOAD_VERIFICATION_DATA", payload: updatedData });

        // Trigger verification status refresh if completed
        if (updatedData.overallStatus === VerificationStatus.COMPLETED) {
          triggerVerificationCompletionEvent();
        }
      }

      toast.success("Verification submitted for review");
      console.log("[VerificationContext] Verification submitted for review");
    } catch (error) {
      console.error(
        "[VerificationContext] Failed to submit verification:",
        error,
      );
      console.error("[VerificationContext] Error details:", {
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        type: typeof error,
        error,
      });

      const errorMessage =
        error instanceof Error
          ? error.message
          : "Failed to submit verification";
      dispatch({ type: "SET_ERROR", payload: errorMessage });
      toast.error(`Failed to submit verification: ${errorMessage}`);
    } finally {
      dispatch({ type: "SET_LOADING", payload: false });
    }
  };

  /**
   * Navigate to specific verification step
   * Allows manual navigation between steps
   */
  const navigateToStep = (step: VerificationStep) => {
    if (!canNavigateToStep(step)) {
      toast.error("Please complete previous steps first");
      return;
    }

    dispatch({ type: "UPDATE_CURRENT_STEP", payload: step });
    console.log("[VerificationContext] Navigated to step:", step);
  };

  /**
   * Check if user can navigate to a specific step
   * Prevents skipping required steps
   */
  const canNavigateToStep = (step: VerificationStep): boolean => {
    if (!state.verificationData) return false;

    const stepOrder = Object.values(VerificationStep);
    const currentStepIndex = stepOrder.indexOf(
      state.verificationData.currentStep,
    );
    const targetStepIndex = stepOrder.indexOf(step);

    // Can navigate backwards or to current step
    if (targetStepIndex <= currentStepIndex) return true;

    // Can navigate forward only if previous steps are completed
    for (let i = 0; i < targetStepIndex; i++) {
      const stepStatus = state.verificationData.stepStatuses[stepOrder[i]];
      if (stepStatus !== VerificationStatus.COMPLETED) {
        return false;
      }
    }

    return true;
  };

  /**
   * Get verification progress
   * Returns progress statistics
   */
  const getStepProgress = (): {
    completed: number;
    total: number;
    percentage: number;
  } => {
    if (!state.verificationData) {
      return { completed: 0, total: 8, percentage: 0 };
    }

    const allSteps = Object.values(VerificationStep);
    const completedSteps = allSteps.filter(
      (step) =>
        state.verificationData!.stepStatuses[step] ===
        VerificationStatus.COMPLETED,
    );

    return {
      completed: completedSteps.length,
      total: allSteps.length,
      percentage: (completedSteps.length / allSteps.length) * 100,
    };
  };

  /**
   * Reset verification data
   * Clears all verification data (for testing)
   */
  const resetVerification = () => {
    try {
      // For Supabase implementation, we just reset the local state
      // The database data remains for audit purposes
      dispatch({ type: "RESET_VERIFICATION" });
      toast.success("Verification data reset");
      console.log("[VerificationContext] Verification data reset");
    } catch (error) {
      console.error(
        "[VerificationContext] Failed to reset verification:",
        error,
      );
      toast.error("Failed to reset verification data");
    }
  };

  /**
   * Refresh verification data
   * Reloads data from Supabase
   */
  const refreshData = async () => {
    if (!user?.id) return;

    try {
      const currentData = await VerificationService.loadVerificationData(
        user.id,
      );
      if (currentData) {
        dispatch({ type: "LOAD_VERIFICATION_DATA", payload: currentData });
        console.log("[VerificationContext] Data refreshed");
      }
    } catch (error) {
      console.error(
        "[VerificationContext] Failed to refresh data:",
        error instanceof Error ? error.message : JSON.stringify(error, null, 2),
      );
      dispatch({ type: "SET_ERROR", payload: "Failed to refresh data" });
    }
  };

  // Context value
  const contextValue: VerificationContextType = {
    ...state,
    initializeVerification,
    updatePersonalInfo,
    updateDocument,
    updatePhoneVerification,
    updateAddressConfirmation,
    completeSelfieVerification,
    submitForReview,
    navigateToStep,
    canNavigateToStep,
    getStepProgress,
    resetVerification,
    refreshData,
  };

  return (
    <VerificationContext.Provider value={contextValue}>
      {children}
    </VerificationContext.Provider>
  );
}

/**
 * Hook to use verification context
 * Provides type-safe access to verification state and actions
 */
export function useVerification(): VerificationContextType {
  const context = useContext(VerificationContext);
  if (context === undefined) {
    throw new Error(
      "useVerification must be used within a VerificationProvider",
    );
  }
  return context;
}

/**
 * Utility to get overall verification status
 * Checks Supabase verificationData.status if available,
 * otherwise falls back to local step completion logic.
 * Returns NOT_STARTED if no verification data exists or is not started.
 */
export function useVerificationStatus(): VerificationStatus {
  const { verificationData } = useVerification();
  if (!verificationData) {
    return VerificationStatus.NOT_STARTED;
  }

  // Prefer status from Supabase if present
  // Accept both .status and .overall_status for compatibility
  const status =
    (
      verificationData as VerificationData & {
        overall_status?: VerificationStatus | string;
      }
    ).overall_status || undefined;

  if (
    !status ||
    status === VerificationStatus.NOT_STARTED ||
    status === "not_started"
  ) {
    return VerificationStatus.NOT_STARTED;
  }
  if (status === VerificationStatus.COMPLETED || status === "completed") {
    return VerificationStatus.COMPLETED;
  }
  if (status === VerificationStatus.FAILED || status === "failed") {
    return VerificationStatus.FAILED;
  }
  if (status === VerificationStatus.REJECTED || status === "rejected") {
    return VerificationStatus.REJECTED;
  }
  if (
    status === VerificationStatus.PENDING_REVIEW ||
    status === "pending_review"
  ) {
    return VerificationStatus.PENDING_REVIEW;
  }

  // Fallback: check if all steps are completed
  const allSteps = Object.values(VerificationStep);
  const allCompleted = allSteps.every(
    (step) =>
      verificationData.stepStatuses[step] === VerificationStatus.COMPLETED,
  );
  return allCompleted
    ? VerificationStatus.COMPLETED
    : VerificationStatus.IN_PROGRESS;
}

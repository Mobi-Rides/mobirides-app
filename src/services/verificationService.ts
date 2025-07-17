
/**
 * Verification Service
 * Handles all verification-related database operations
 * Updated to work with actual database schema
 */

import { supabase } from "@/integrations/supabase/client";
import {
  VerificationData,
  VerificationStep,
  PersonalInfo,
  PhoneVerification,
  AddressConfirmation,
} from "@/types/verification";

export class VerificationService {
  /**
   * Initialize verification for a new user
   */
  static async initializeVerification(
    userId: string,
    userRole: "renter" | "host"
  ): Promise<VerificationData | null> {
    try {
      console.log("[VerificationService] Initializing verification for user:", userId);

      // Check if verification already exists
      const { data: existing } = await supabase
        .from("user_verifications")
        .select("*")
        .eq("user_id", userId)
        .maybeSingle();

      if (existing) {
        console.log("[VerificationService] Verification already exists:", existing);
        return existing as VerificationData;
      }

      // Create new verification record
      const { data, error } = await supabase
        .from("user_verifications")
        .insert([
          {
            user_id: userId,
            current_step: "personal_info",
            overall_status: "not_started",
            personal_info: {},
            user_role: userRole,
            personal_info_completed: false,
            documents_completed: false,
            selfie_completed: false,
            phone_verified: false,
            address_confirmed: false,
          },
        ])
        .select()
        .single();

      if (error) {
        console.error("[VerificationService] Error creating verification:", error.message, "Code:", error.code);
        throw new Error(`Failed to initialize verification: ${error.message}`);
      }

      console.log("[VerificationService] Created verification:", data);
      return data as VerificationData;
    } catch (error) {
      console.error("[VerificationService] Failed to initialize verification:", error);
      throw error;
    }
  }

  /**
   * Load verification data for a user
   */
  static async loadVerificationData(userId: string): Promise<VerificationData | null> {
    try {
      const { data, error } = await supabase
        .from("user_verifications")
        .select("*")
        .eq("user_id", userId)
        .maybeSingle();

      if (error) {
        console.error("[VerificationService] Error loading verification:", error);
        return null;
      }

      return data as VerificationData;
    } catch (error) {
      console.error("[VerificationService] Failed to load verification:", error);
      return null;
    }
  }

  /**
   * Update personal information
   */
  static async updatePersonalInfo(
    userId: string,
    personalInfo: Partial<PersonalInfo>
  ): Promise<boolean> {
    try {
      const { error } = await supabase
        .from("user_verifications")
        .update({
          personal_info: personalInfo,
          personal_info_completed: true,
          current_step: "document_upload",
          last_updated_at: new Date().toISOString(),
        })
        .eq("user_id", userId);

      if (error) {
        console.error("[VerificationService] Failed to update personal info:", error);
        return false;
      }
      return true;
    } catch (error) {
      console.error("[VerificationService] Failed to update personal info:", error);
      return false;
    }
  }

  /**
   * Complete selfie verification
   */
  static async completeSelfieVerification(userId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from("user_verifications")
        .update({
          selfie_completed: true,
          current_step: "phone_verification",
          last_updated_at: new Date().toISOString(),
        })
        .eq("user_id", userId);

      if (error) {
        console.error("[VerificationService] Failed to complete selfie verification:", error);
        return false;
      }
      return true;
    } catch (error) {
      console.error("[VerificationService] Failed to complete selfie verification:", error);
      return false;
    }
  }

  /**
   * Update phone verification
   */
  static async updatePhoneVerification(
    userId: string,
    phoneData: Partial<PhoneVerification>
  ): Promise<boolean> {
    try {
      const { error } = await supabase
        .from("user_verifications")
        .update({
          phone_verified: !!phoneData.isVerified,
          current_step: phoneData.isVerified
            ? "address_confirmation"
            : "phone_verification",
          last_updated_at: new Date().toISOString(),
        })
        .eq("user_id", userId);

      if (error) {
        console.error("[VerificationService] Failed to update phone verification:", error);
        return false;
      }
      return true;
    } catch (error) {
      console.error("[VerificationService] Failed to update phone verification:", error);
      return false;
    }
  }

  /**
   * Update address confirmation
   */
  static async updateAddressConfirmation(
    userId: string,
    addressData: Partial<AddressConfirmation>
  ): Promise<boolean> {
    try {
      const { error } = await supabase
        .from("user_verifications")
        .update({
          address_confirmed: !!addressData.isConfirmed,
          current_step: addressData.isConfirmed
            ? "review_submit"
            : "address_confirmation",
          last_updated_at: new Date().toISOString(),
        })
        .eq("user_id", userId);

      if (error) {
        console.error("[VerificationService] Failed to update address confirmation:", error);
        return false;
      }
      return true;
    } catch (error) {
      console.error("[VerificationService] Failed to update address confirmation:", error);
      return false;
    }
  }

  /**
   * Submit verification for review
   */
  static async submitForReview(userId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from("user_verifications")
        .update({
          current_step: "processing_status",
          overall_status: "pending_review",
          last_updated_at: new Date().toISOString(),
        })
        .eq("user_id", userId);

      if (error) {
        console.error("[VerificationService] Failed to submit for review:", error);
        return false;
      }
      return true;
    } catch (error) {
      console.error("[VerificationService] Failed to submit for review:", error);
      return false;
    }
  }

  /**
   * Navigate to specific step
   */
  static async navigateToStep(userId: string, step: VerificationStep): Promise<boolean> {
    try {
      const { error } = await supabase
        .from("user_verifications")
        .update({
          current_step: step,
          last_updated_at: new Date().toISOString(),
        })
        .eq("user_id", userId);

      if (error) {
        console.error("[VerificationService] Failed to navigate to step:", error);
        return false;
      }
      return true;
    } catch (error) {
      console.error("[VerificationService] Failed to navigate to step:", error);
      return false;
    }
  }
}

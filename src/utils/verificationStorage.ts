/**
 * ⚠️ DEPRECATED: Local Storage Utilities for Verification System Development
 *
 * This file has been replaced by src/services/verificationService.ts which uses Supabase.
 * The verification system now stores data in the database instead of local storage.
 *
 * This file is kept for reference but should not be used in new implementations.
 *
 * Original description:
 * Provides methods to store and retrieve verification data locally
 * during development, simulating backend persistence
 */

import { supabase } from "@/integrations/supabase/client";
import {
  VerificationData,
  VerificationStep,
  VerificationStatus,
  DocumentUpload,
  PersonalInfo,
  PhoneVerification,
  AddressConfirmation,
} from "@/types/verification";

/**
 * Utility class for managing verification data in Supabase
 */
export class VerificationStorageManager {
  /**
   * Initialize verification data for a new user
   */
  static async initializeVerification(
    userId: string,
    userRole: "renter" | "host",
  ): Promise<VerificationData | null> {
    const now = new Date().toISOString();
    const initialData: Partial<VerificationData> = {
      userId,
      currentStep: VerificationStep.PERSONAL_INFO,
      overallStatus: VerificationStatus.NOT_STARTED,
      startedAt: now,
      lastUpdatedAt: now,
      personalInfo: {},
      documents: [],
      phoneVerification: {},
      addressConfirmation: {},
      userRole,
      isHostVerificationRequired: userRole === "host",
      stepStatuses: {
        [VerificationStep.PERSONAL_INFO]: VerificationStatus.NOT_STARTED,
        [VerificationStep.DOCUMENT_UPLOAD]: VerificationStatus.NOT_STARTED,
        [VerificationStep.SELFIE_VERIFICATION]: VerificationStatus.NOT_STARTED,
        [VerificationStep.PHONE_VERIFICATION]: VerificationStatus.NOT_STARTED,
        [VerificationStep.ADDRESS_CONFIRMATION]: VerificationStatus.NOT_STARTED,
        [VerificationStep.REVIEW_SUBMIT]: VerificationStatus.NOT_STARTED,
        [VerificationStep.PROCESSING_STATUS]: VerificationStatus.NOT_STARTED,
        [VerificationStep.COMPLETION]: VerificationStatus.NOT_STARTED,
      },
    };

    const { data, error } = await supabase
      .from("user_verifications")
      .insert([
        {
          user_id: userId,
          overall_status: "not_started",
          current_step: "personal_info",
          personal_info: {},
          user_role: userRole,
        },
      ])
      .select()
      .single();

    if (error) {
      console.error(
        "[VerificationStorage] Failed to initialize:",
        error.message || JSON.stringify(error, null, 2),
      );
      return null;
    }
    return { ...initialData, ...data } as VerificationData;
  }

  /**
   * Load verification data from Supabase
   */
  static async loadVerificationData(
    userId: string,
  ): Promise<VerificationData | null> {
    const { data, error } = await supabase
      .from("user_verifications")
      .select("*")
      .eq("user_id", userId)
      .single();

    if (error) {
      console.error(
        "[VerificationStorage] Failed to load:",
        error.message || JSON.stringify(error, null, 2),
      );
      return null;
    }
    return data as VerificationData;
  }

  /**
   * Update personal information step
   */
  static async updatePersonalInfo(
    userId: string,
    personalInfo: Partial<PersonalInfo>,
  ): Promise<boolean> {
    const { error } = await supabase
      .from("user_verifications")
      .update({
        personal_info: personalInfo,
        personal_info_completed: true,
        current_step: VerificationStep.DOCUMENT_UPLOAD,
        last_updated_at: new Date().toISOString(),
      })
      .eq("user_id", userId);

    if (error) {
      console.error(
        "[VerificationStorage] Failed to update personal info:",
        error,
      );
      return false;
    }
    return true;
  }

  /**
   * Add or update a document upload
   */
  static async updateDocument(
    userId: string,
    document: DocumentUpload,
  ): Promise<boolean> {
    // Upsert document in verification_documents table
    const { error } = await supabase.from("verification_documents").upsert(
      {
        user_id: userId,
        document_type: document.type,
        file_path: document.filePath,
        file_name: document.fileName,
        file_size: document.fileSize,
        document_number: document.documentNumber,
        expiry_date: document.expiryDate,
        status: document.status,
        uploaded_at: new Date().toISOString(),
      },
      { onConflict: ["user_id", "document_type"] },
    );

    if (error) {
      console.error(
        "[VerificationStorage] Failed to update document:",
        error.message || JSON.stringify(error, null, 2),
      );
      return false;
    }

    // Optionally update user_verifications step status
    await supabase
      .from("user_verifications")
      .update({
        documents_completed: true,
        current_step: VerificationStep.SELFIE_VERIFICATION,
        last_updated_at: new Date().toISOString(),
      })
      .eq("user_id", userId);

    return true;
  }

  /**
   * Update phone verification data
   */
  static async updatePhoneVerification(
    userId: string,
    phoneData: Partial<PhoneVerification>,
  ): Promise<boolean> {
    // Upsert phone verification
    const { error } = await supabase.from("phone_verifications").upsert(
      {
        user_id: userId,
        phone_number: phoneData.phoneNumber,
        country_code: phoneData.countryCode,
        verification_code: phoneData.verificationCode,
        is_verified: phoneData.isVerified,
        last_attempt_at: new Date().toISOString(),
        verified_at: phoneData.isVerified ? new Date().toISOString() : null,
      },
      { onConflict: ["user_id"] },
    );

    if (error) {
      console.error(
        "[VerificationStorage] Failed to update phone verification:",
        error.message || JSON.stringify(error, null, 2),
      );
      return false;
    }

    // Update user_verifications step status
    await supabase
      .from("user_verifications")
      .update({
        phone_verified: !!phoneData.isVerified,
        current_step: phoneData.isVerified
          ? VerificationStep.ADDRESS_CONFIRMATION
          : VerificationStep.PHONE_VERIFICATION,
        last_updated_at: new Date().toISOString(),
      })
      .eq("user_id", userId);

    return true;
  }

  /**
   * Update address confirmation data
   */
  static async updateAddressConfirmation(
    userId: string,
    addressData: Partial<AddressConfirmation>,
  ): Promise<boolean> {
    const { error } = await supabase
      .from("user_verifications")
      .update({
        address_confirmation: addressData,
        address_confirmed: !!addressData.isConfirmed,
        current_step: addressData.isConfirmed
          ? VerificationStep.REVIEW_SUBMIT
          : VerificationStep.ADDRESS_CONFIRMATION,
        last_updated_at: new Date().toISOString(),
      })
      .eq("user_id", userId);

    if (error) {
      console.error(
        "[VerificationStorage] Failed to update address confirmation:",
        error.message || JSON.stringify(error, null, 2),
      );
      return false;
    }
    return true;
  }

  /**
   * Complete selfie verification step
   */
  static async completeSelfieVerification(userId: string): Promise<boolean> {
    const { error } = await supabase
      .from("user_verifications")
      .update({
        selfie_completed: true,
        current_step: VerificationStep.PHONE_VERIFICATION,
        last_updated_at: new Date().toISOString(),
      })
      .eq("user_id", userId);

    if (error) {
      console.error(
        "[VerificationStorage] Failed to complete selfie verification:",
        error.message || JSON.stringify(error, null, 2),
      );
      return false;
    }
    return true;
  }

  /**
   * Submit verification for review
   */
  static async submitForReview(userId: string): Promise<boolean> {
    const { error } = await supabase
      .from("user_verifications")
      .update({
        review_submit_completed: true,
        processing_status: VerificationStatus.PENDING_REVIEW,
        current_step: VerificationStep.PROCESSING_STATUS,
        overall_status: VerificationStatus.PENDING_REVIEW,
        last_updated_at: new Date().toISOString(),
      })
      .eq("user_id", userId);

    if (error) {
      console.error(
        "[VerificationStorage] Failed to submit for review:",
        error.message || JSON.stringify(error, null, 2),
      );
      return false;
    }
    return true;
  }

  /**
   * Clear all verification data (for testing)
   */
  static async clearVerificationData(userId: string): Promise<void> {
    await supabase.from("user_verifications").delete().eq("user_id", userId);
    await supabase
      .from("verification_documents")
      .delete()
      .eq("user_id", userId);
    await supabase.from("phone_verifications").delete().eq("user_id", userId);
  }
}

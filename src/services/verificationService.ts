/**
 * Supabase Verification Service
 * Handles all verification-related database operations
 * Replaces local storage with Supabase database persistence
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
  DocumentType,
} from "@/types/verification";

export interface SupabaseVerificationData {
  id: string;
  user_id: string;
  current_step: string;
  overall_status: string;
  started_at: string;
  completed_at?: string;
  last_updated_at: string;
  personal_info: any;
  personal_info_completed: boolean;
  documents_completed: boolean;
  selfie_completed: boolean;
  phone_verified: boolean;
  address_confirmed: boolean;
  admin_notes?: string;
  rejection_reasons?: string[];
}

export interface SupabaseDocument {
  id: string;
  user_id: string;
  document_type: string;
  file_path: string;
  file_name: string;
  file_size: number;
  document_number?: string;
  expiry_date?: string;
  status: string;
  rejection_reason?: string;
  uploaded_at: string;
  verified_at?: string;
}

export interface SupabasePhoneVerification {
  id: string;
  user_id: string;
  phone_number: string;
  country_code: string;
  verification_code?: string;
  is_verified: boolean;
  attempt_count: number;
  last_attempt_at: string;
  verified_at?: string;
  expires_at: string;
}

/**
 * Verification Service for Supabase operations
 */
export class VerificationService {
  private static loadingCache = new Map<
    string,
    Promise<VerificationData | null>
  >();
  /**
   * Initialize verification for a user
   */
  static async initializeVerification(
    userId: string,
    userRole: "renter" | "host",
  ): Promise<VerificationData> {
    try {
      console.log(
        "[VerificationService] Initializing verification for user:",
        userId,
      );

      // Check if verification already exists
      const { data: existing } = await supabase
        .from("user_verifications")
        .select("*")
        .eq("user_id", userId)
        .single();

      if (existing) {
        console.log("[VerificationService] Found existing verification data");
        return this.mapSupabaseToLocal(existing);
      }

      // Create new verification record
      const { data: newVerification, error } = await supabase
        .from("user_verifications")
        .insert({
          user_id: userId,
          current_step: VerificationStep.PERSONAL_INFO,
          overall_status: VerificationStatus.NOT_STARTED,
          personal_info: {},
          personal_info_completed: false,
          documents_completed: false,
          selfie_completed: false,
          phone_verified: false,
          address_confirmed: false,
        })
        .select()
        .single();

      if (error) {
        console.error(
          "[VerificationService] Error creating verification:",
          error,
          "Code:",
          error.code,
        );

        // If it's an RLS policy error, provide more specific guidance
        if (
          error.code === "PGRST301" ||
          error.message?.includes("RLS") ||
          error.message?.includes("policy")
        ) {
          console.warn(
            "[VerificationService] RLS policy may be blocking insert. Check user_verifications table policies.",
          );
        }

        throw new Error(`Failed to initialize verification: ${error.message}`);
      }

      console.log(
        "[VerificationService] Verification initialized successfully",
      );
      return this.mapSupabaseToLocal(newVerification);
    } catch (error) {
      console.error(
        "[VerificationService] Failed to initialize verification:",
        error,
      );
      throw error;
    }
  }

  /**
   * Load verification data for a user
   */
  static async loadVerificationData(
    userId: string,
  ): Promise<VerificationData | null> {
    try {
      if (!userId || userId === "undefined") {
        console.error(
          "[VerificationService] Invalid user ID provided:",
          userId,
        );
        return null;
      }

      // Check if there's already a loading request for this user
      if (this.loadingCache.has(userId)) {
        console.log(
          "[VerificationService] Using cached loading promise for user:",
          userId,
        );
        return await this.loadingCache.get(userId)!;
      }

      console.log(
        "[VerificationService] Loading verification data for user:",
        userId,
      );

      // Create a new loading promise and cache it
      const loadingPromise = this.performLoadVerificationData(userId);
      this.loadingCache.set(userId, loadingPromise);

      // Clear cache after completion (success or failure)
      loadingPromise.finally(() => {
        this.loadingCache.delete(userId);
      });

      return await loadingPromise;
    } catch (error) {
      console.error(
        "[VerificationService] Failed to load verification data:",
        error,
      );
      throw error;
    }
  }

  /**
   * Actual implementation of loading verification data
   */
  private static async performLoadVerificationData(
    userId: string,
  ): Promise<VerificationData | null> {
    try {
      const { data: verification, error } = await supabase
        .from("user_verifications")
        .select("*")
        .eq("user_id", userId)
        .single();

      if (error) {
        if (error.code === "PGRST116") {
          // No data found
          console.log("[VerificationService] No verification data found");
          return null;
        }

        // Log error details but avoid reading response multiple times
        console.error("[VerificationService] Error loading verification:");
        console.error("Error message:", error.message);
        console.error("Error code:", error.code);
        console.error("Error details:", error.details);

        // If it's an RLS policy error, return null instead of throwing
        if (
          error.code === "PGRST301" ||
          error.message?.includes("RLS") ||
          error.message?.includes("policy")
        ) {
          console.warn(
            "[VerificationService] RLS policy blocking access, returning null",
          );
          return null;
        }

        // Return null instead of throwing to prevent cascading errors
        console.warn(
          "[VerificationService] Returning null due to error:",
          error.message,
        );
        return null;
      }

      // Load related documents
      const { data: documents } = await supabase
        .from("verification_documents")
        .select("*")
        .eq("user_id", userId);

      // Load phone verification (if table exists)
      let phoneVerification = null;
      try {
        const { data } = await supabase
          .from("phone_verifications")
          .select("*")
          .eq("user_id", userId)
          .single();
        phoneVerification = data;
      } catch (error) {
        console.log(
          "[VerificationService] Phone verifications table not available or no data found",
        );
      }

      // Load user profile to get role and verification status as fallback
      const { data: profile } = await supabase
        .from("profiles")
        .select("role, verification_status")
        .eq("id", userId)
        .single();

      const mappedData = this.mapSupabaseToLocal(
        verification,
        documents || [],
        phoneVerification,
        profile,
      );
      console.log(
        "[VerificationService] Verification data loaded successfully",
      );
      return mappedData;
    } catch (error) {
      console.error(
        "[VerificationService] Failed to load verification data:",
        error,
      );
      throw error;
    }
  }

  /**
   * Update personal information
   */
  static async updatePersonalInfo(
    userId: string,
    personalInfo: Partial<PersonalInfo>,
  ): Promise<void> {
    try {
      console.log(
        "[VerificationService] Updating personal info for user:",
        userId,
      );

      // Get current data to merge or create new record
      const { data: current } = await supabase
        .from("user_verifications")
        .select("personal_info")
        .eq("user_id", userId)
        .single();

      const mergedPersonalInfo = {
        ...((current?.personal_info as object) || {}),
        ...personalInfo,
      };

      const isComplete = this.isPersonalInfoComplete(
        mergedPersonalInfo as PersonalInfo,
      );

      // Try UPDATE first, then INSERT if needed (avoiding UPSERT trigger issues)
      const { error: updateError } = await supabase
        .from("user_verifications")
        .update({
          personal_info: mergedPersonalInfo,
          personal_info_completed: isComplete,
          current_step: isComplete
            ? VerificationStep.DOCUMENT_UPLOAD
            : VerificationStep.PERSONAL_INFO,
        })
        .eq("user_id", userId);

      let error = updateError;
      if (updateError) {
        // If UPDATE fails, try INSERT
        const { error: insertError } = await supabase
          .from("user_verifications")
          .insert({
            user_id: userId,
            personal_info: mergedPersonalInfo,
            personal_info_completed: isComplete,
            current_step: isComplete
              ? VerificationStep.DOCUMENT_UPLOAD
              : VerificationStep.PERSONAL_INFO,
          });
        error = insertError;
      }

      if (error) {
        console.error(
          "[VerificationService] Error updating personal info:",
          error,
        );
        throw new Error(`Failed to update personal info: ${error.message}`);
      }

      console.log("[VerificationService] Personal info updated successfully");
    } catch (error) {
      console.error(
        "[VerificationService] Failed to update personal info:",
        error,
      );
      throw error;
    }
  }

  /**
   * Upload and save document
   */
  static async updateDocument(
    userId: string,
    document: DocumentUpload,
  ): Promise<void> {
    try {
      console.log(
        "[VerificationService] Updating document for user:",
        userId,
        document.type,
      );

      // Upload file to Supabase storage if it's a new file
      let filePath = "";
      if (document.file) {
        const fileExt = document.fileName.split(".").pop();
        const fileName = `${userId}/${document.type}.${fileExt}`;

        const { data: uploadData, error: uploadError } = await supabase.storage
          .from("verification-documents")
          .upload(fileName, document.file, {
            upsert: true,
          });

        if (uploadError) {
          console.error(
            "[VerificationService] Error uploading file:",
            uploadError,
          );
          throw new Error(`Failed to upload file: ${uploadError.message}`);
        }

        filePath = uploadData.path;
      }

      // Save/update document record
      const documentData = {
        user_id: userId,
        document_type: document.type,
        file_path: filePath,
        file_name: document.fileName,
        file_size: document.fileSize,
        document_number: document.documentNumber,
        expiry_date: document.expiryDate,
        status: VerificationStatus.COMPLETED, // Show as completed immediately for better UX
      };

      const { error } = await supabase
        .from("verification_documents")
        .upsert(documentData, {
          onConflict: "user_id,document_type",
        });

      if (error) {
        console.error("[VerificationService] Error saving document:", error);
        throw new Error(`Failed to save document: ${error.message}`);
      }

      // Check if all required documents are uploaded
      await this.updateDocumentCompletionStatus(userId);

      console.log("[VerificationService] Document updated successfully");
    } catch (error) {
      console.error("[VerificationService] Failed to update document:", error);
      throw error;
    }
  }

  /**
   * Update phone verification
   */
  static async updatePhoneVerification(
    userId: string,
    phoneData: Partial<PhoneVerification>,
  ): Promise<void> {
    try {
      console.log(
        "[VerificationService] Updating phone verification for user:",
        userId,
        "Data:",
        phoneData,
      );

      const phoneVerificationData = {
        user_id: userId,
        phone_number: phoneData.phoneNumber || "",
        country_code: phoneData.countryCode || "+267",
        verification_code: phoneData.verificationCode || null,
        is_verified: phoneData.isVerified || false,
        attempt_count: phoneData.attemptCount || 0,
        last_attempt_at: new Date().toISOString(),
        verified_at: phoneData.isVerified ? new Date().toISOString() : null,
        expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString(), // 10 minutes
      };

      console.log(
        "[VerificationService] Phone verification data to upsert:",
        phoneVerificationData,
      );

      // Try to update phone_verifications table, but don't fail if it doesn't exist
      let phoneTableSuccess = false;
      try {
        const { error: phoneError } = await supabase
          .from("phone_verifications")
          .upsert(phoneVerificationData, {
            onConflict: "user_id",
          });

        if (phoneError) {
          console.warn(
            "[VerificationService] Phone verifications table error:",
            phoneError,
            "Code:",
            phoneError.code,
          );
          // Continue with simplified approach if table doesn't exist or has issues
        } else {
          phoneTableSuccess = true;
          console.log(
            "[VerificationService] Phone verification table updated successfully",
          );
        }
      } catch (error) {
        console.warn(
          "[VerificationService] Phone verifications table not available, using simplified approach",
        );
      }

      // Update main verification record regardless of phone_verifications table status
      const mainUpdateData: any = {};

      if (phoneData.isVerified) {
        mainUpdateData.phone_verified = true;
        mainUpdateData.current_step = VerificationStep.ADDRESS_CONFIRMATION;
      }

      // Only update if there's data to update
      let mainError = null;
      if (Object.keys(mainUpdateData).length > 0) {
        const { error } = await supabase
          .from("user_verifications")
          .update(mainUpdateData)
          .eq("user_id", userId);
        mainError = error;
      }

      if (mainError) {
        console.error(
          "[VerificationService] Error updating main verification record:",
          mainError,
        );
        throw new Error(
          `Failed to update verification status: ${mainError.message}`,
        );
      }

      console.log(
        "[VerificationService] Phone verification updated successfully",
      );
    } catch (error) {
      console.error(
        "[VerificationService] Failed to update phone verification:",
        error,
      );
      throw error;
    }
  }

  /**
   * Update address confirmation
   */
  static async updateAddressConfirmation(
    userId: string,
    addressData: Partial<AddressConfirmation>,
  ): Promise<void> {
    try {
      console.log(
        "[VerificationService] Updating address confirmation for user:",
        userId,
      );

      if (addressData.isConfirmed) {
        const { error } = await supabase
          .from("user_verifications")
          .update({
            address_confirmed: true,
            current_step: VerificationStep.REVIEW_SUBMIT,
          })
          .eq("user_id", userId);

        if (error) {
          console.error(
            "[VerificationService] Error updating address confirmation:",
            error,
          );
          throw new Error(
            `Failed to update address confirmation: ${error.message}`,
          );
        }
      }

      console.log(
        "[VerificationService] Address confirmation updated successfully",
      );
    } catch (error) {
      console.error(
        "[VerificationService] Failed to update address confirmation:",
        error,
      );
      throw error;
    }
  }

  /**
   * Complete selfie verification
   */
  static async completeSelfieVerification(userId: string): Promise<void> {
    try {
      console.log(
        "[VerificationService] Completing selfie verification for user:",
        userId,
      );

      const { error } = await supabase
        .from("user_verifications")
        .update({
          selfie_completed: true,
          current_step: VerificationStep.PHONE_VERIFICATION,
        })
        .eq("user_id", userId);

      if (error) {
        console.error(
          "[VerificationService] Error completing selfie verification:",
          error,
        );
        throw new Error(
          `Failed to complete selfie verification: ${error.message}`,
        );
      }

      console.log(
        "[VerificationService] Selfie verification completed successfully",
      );
    } catch (error) {
      console.error(
        "[VerificationService] Failed to complete selfie verification:",
        error,
      );
      throw error;
    }
  }

  /**
   * Submit verification for review
   */
  /**
   * Submit verification for review - FIXED VERSION
   */
  /**
   * Submit verification for review
   */
  static async submitForReview(userId: string): Promise<void> {
    try {
      console.log(
        "[VerificationService] Submitting verification for review for user:",
        userId,
      );

      // First check if record exists
      const { data: existingRecord, error: checkError } = await supabase
        .from("user_verifications")
        .select("id, user_id")
        .eq("user_id", userId)
        .single();

      if (checkError && checkError.code !== "PGRST116") {
        // PGRST116 is "not found" error, which is expected if no record exists
        console.error(
          "[VerificationService] Error checking for existing record:",
          checkError,
        );
        throw new Error(
          `Failed to check verification status: ${checkError.message}`,
        );
      }

      if (existingRecord) {
        // Record exists, try to update with a workaround for the trigger issue
        console.log(
          "[VerificationService] Updating existing verification record",
        );

        // Try a simple update first - just the essential fields
        const { error: updateError } = await supabase
          .from("user_verifications")
          .update({
            current_step: VerificationStep.PROCESSING_STATUS,
            overall_status: VerificationStatus.PENDING_REVIEW,
          })
          .eq("user_id", userId);

        if (updateError) {
          console.error(
            "[VerificationService] Error updating verification record:",
            updateError,
          );
          console.error("Message:", updateError.message);
          console.error("Code:", updateError.code);
          console.error("Details:", updateError.details);
          console.error("Hint:", updateError.hint);

          // If update fails due to trigger issues, we'll still update the profile
          // and let the UI handle the step transition based on profile status
          console.warn(
            "[VerificationService] Update failed, continuing with profile update only",
          );
        } else {
          console.log(
            "[VerificationService] Verification record updated successfully",
          );
        }
      } else {
        // No record exists, create new one
        console.log("[VerificationService] Creating new verification record");
        const { data: insertData, error: insertError } = await supabase
          .from("user_verifications")
          .insert({
            user_id: userId,
            current_step: VerificationStep.PROCESSING_STATUS,
            overall_status: VerificationStatus.PENDING_REVIEW,
            personal_info: {},
            personal_info_completed: true, // Assume completed if submitting
            documents_completed: true, // Assume completed if submitting
            selfie_completed: true, // Assume completed if submitting
            phone_verified: true, // Assume completed if submitting
            address_confirmed: true, // Assume completed if submitting
          })
          .select();

        if (insertError) {
          console.error(
            "[VerificationService] Error creating verification record:",
          );
          console.error("Message:", insertError.message);
          console.error("Code:", insertError.code);
          console.error("Details:", insertError.details);
          console.error("Hint:", insertError.hint);
          console.error("Full error:", JSON.stringify(insertError, null, 2));
          throw new Error(
            `Failed to create verification: ${insertError.message}`,
          );
        }
        console.log(
          "[VerificationService] New verification record created:",
          insertData,
        );
      }

      // Update profile verification status (this is crucial for the UI to work)
      const { error: profileError } = await supabase
        .from("profiles")
        .update({
          verification_status: VerificationStatus.PENDING_REVIEW,
        })
        .eq("id", userId);

      if (profileError) {
        console.error(
          "[VerificationService] Error updating profile verification status:",
        );
        console.error("Message:", profileError.message);
        console.error("Code:", profileError.code);
        console.error("Details:", profileError.details);

        // This is critical - if we can't update the profile, the UI won't work
        throw new Error(
          `Failed to update profile verification status: ${profileError.message}`,
        );
      }

      console.log(
        "[VerificationService] Verification submitted for review successfully",
      );
    } catch (error) {
      console.error(
        "[VerificationService] Failed to submit for review:",
        error instanceof Error ? error.message : error,
      );
      throw error;
    }
  }

  /**
   * Complete verification (admin function)
   */
  static async completeVerification(userId: string): Promise<void> {
    try {
      console.log(
        "[VerificationService] Completing verification for user:",
        userId,
      );

      const now = new Date().toISOString();

      // Update verification status
      const { error: verificationError } = await supabase
        .from("user_verifications")
        .update({
          current_step: VerificationStep.COMPLETION,
          overall_status: VerificationStatus.COMPLETED,
          completed_at: now,
        })
        .eq("user_id", userId);

      if (verificationError) {
        console.error(
          "[VerificationService] Error completing verification:",
          verificationError,
        );
        throw new Error(
          `Failed to complete verification: ${verificationError.message}`,
        );
      }

      // Update profile verification status
      const { error: profileError } = await supabase
        .from("profiles")
        .update({
          verification_status: VerificationStatus.COMPLETED,
          verification_completed_at: now,
        })
        .eq("id", userId);

      if (profileError) {
        console.error(
          "[VerificationService] Error updating profile verification status:",
          profileError,
        );
        // Don't throw here as the main verification update succeeded
      }

      console.log("[VerificationService] Verification completed successfully");
    } catch (error) {
      console.error(
        "[VerificationService] Failed to complete verification:",
        error,
      );
      throw error;
    }
  }

  /**
   * Reject verification (admin function)
   */
  static async rejectVerification(
    userId: string,
    reason: string,
  ): Promise<void> {
    try {
      console.log(
        "[VerificationService] Rejecting verification for user:",
        userId,
      );

      // Update verification status
      const { error: verificationError } = await supabase
        .from("user_verifications")
        .update({
          current_step: VerificationStep.PERSONAL_INFO, // Reset to first step
          overall_status: VerificationStatus.REJECTED,
          rejection_reasons: [reason],
        })
        .eq("user_id", userId);

      if (verificationError) {
        console.error(
          "[VerificationService] Error rejecting verification:",
          verificationError,
        );
        throw new Error(
          `Failed to reject verification: ${verificationError.message}`,
        );
      }

      // Update profile verification status
      const { error: profileError } = await supabase
        .from("profiles")
        .update({
          verification_status: VerificationStatus.REJECTED,
          verification_rejected_reason: reason,
        })
        .eq("id", userId);

      if (profileError) {
        console.error(
          "[VerificationService] Error updating profile verification status:",
          profileError,
        );
        // Don't throw here as the main verification update succeeded
      }

      console.log("[VerificationService] Verification rejected successfully");
    } catch (error) {
      console.error(
        "[VerificationService] Failed to reject verification:",
        error,
      );
      throw error;
    }
  }

  /**
   * Check and update document completion status
   */
  private static async updateDocumentCompletionStatus(
    userId: string,
  ): Promise<void> {
    const { data: documents } = await supabase
      .from("verification_documents")
      .select("document_type")
      .eq("user_id", userId);

    const { data: userVerification } = await supabase
      .from("user_verifications")
      .select("*")
      .eq("user_id", userId)
      .single();

    if (!documents || !userVerification) return;

    const requiredDocuments = [
      DocumentType.NATIONAL_ID_FRONT,
      DocumentType.NATIONAL_ID_BACK,
      DocumentType.DRIVING_LICENSE_FRONT,
      DocumentType.DRIVING_LICENSE_BACK,
      DocumentType.PROOF_OF_ADDRESS,
      DocumentType.PROOF_OF_INCOME,
    ];

    const hasAllRequired = requiredDocuments.every((docType) =>
      documents.some((doc) => doc.document_type === docType),
    );

    if (hasAllRequired) {
      await supabase
        .from("user_verifications")
        .update({
          documents_completed: true,
          current_step: VerificationStep.SELFIE_VERIFICATION,
        })
        .eq("user_id", userId);
    }
  }

  /**
   * Check if personal info is complete
   */
  private static isPersonalInfoComplete(personalInfo: PersonalInfo): boolean {
    return !!(
      personalInfo.fullName &&
      personalInfo.dateOfBirth &&
      personalInfo.nationalIdNumber &&
      personalInfo.phoneNumber &&
      personalInfo.email &&
      personalInfo.address?.street &&
      personalInfo.address?.area &&
      personalInfo.address?.city &&
      personalInfo.emergencyContact?.name &&
      personalInfo.emergencyContact?.relationship &&
      personalInfo.emergencyContact?.phoneNumber
    );
  }

  /**
   * Map Supabase data to local VerificationData format
   */
  private static mapSupabaseToLocal(
    verification: SupabaseVerificationData,
    documents: SupabaseDocument[] = [],
    phoneVerification?: SupabasePhoneVerification,
    profile?: { role: string; verification_status?: string } | null,
  ): VerificationData {
    const stepStatuses: Record<VerificationStep, VerificationStatus> = {
      [VerificationStep.PERSONAL_INFO]: verification.personal_info_completed
        ? VerificationStatus.COMPLETED
        : VerificationStatus.NOT_STARTED,
      [VerificationStep.DOCUMENT_UPLOAD]: verification.documents_completed
        ? VerificationStatus.COMPLETED
        : VerificationStatus.NOT_STARTED,
      [VerificationStep.SELFIE_VERIFICATION]: verification.selfie_completed
        ? VerificationStatus.COMPLETED
        : VerificationStatus.NOT_STARTED,
      [VerificationStep.PHONE_VERIFICATION]: verification.phone_verified
        ? VerificationStatus.COMPLETED
        : VerificationStatus.NOT_STARTED,
      [VerificationStep.ADDRESS_CONFIRMATION]: verification.address_confirmed
        ? VerificationStatus.COMPLETED
        : VerificationStatus.NOT_STARTED,
      [VerificationStep.REVIEW_SUBMIT]:
        // Mark as completed if verification has been submitted (current step is beyond review or status is pending/completed)
        verification.current_step === VerificationStep.PROCESSING_STATUS ||
        verification.current_step === VerificationStep.COMPLETION ||
        verification.overall_status === VerificationStatus.PENDING_REVIEW ||
        verification.overall_status === VerificationStatus.COMPLETED ||
        profile?.verification_status === VerificationStatus.PENDING_REVIEW ||
        profile?.verification_status === VerificationStatus.COMPLETED
          ? VerificationStatus.COMPLETED
          : VerificationStatus.NOT_STARTED,
      [VerificationStep.PROCESSING_STATUS]:
        // Use profile verification status as fallback due to user_verifications update issues
        profile?.verification_status === VerificationStatus.PENDING_REVIEW ||
        verification.overall_status === VerificationStatus.PENDING_REVIEW
          ? VerificationStatus.PENDING_REVIEW
          : VerificationStatus.NOT_STARTED,
      [VerificationStep.COMPLETION]:
        // Use profile verification status as fallback
        profile?.verification_status === VerificationStatus.COMPLETED ||
        verification.overall_status === VerificationStatus.COMPLETED
          ? VerificationStatus.COMPLETED
          : VerificationStatus.NOT_STARTED,
    };

    const mappedDocuments: DocumentUpload[] = documents.map((doc) => ({
      type: doc.document_type as DocumentType,
      file: null,
      fileName: doc.file_name,
      fileSize: doc.file_size,
      uploadedAt: doc.uploaded_at,
      status: doc.status as VerificationStatus,
      rejectionReason: doc.rejection_reason,
      expiryDate: doc.expiry_date,
      documentNumber: doc.document_number,
    }));

    const mappedPhoneVerification: Partial<PhoneVerification> =
      phoneVerification
        ? {
            phoneNumber: phoneVerification.phone_number,
            countryCode: phoneVerification.country_code,
            verificationCode: phoneVerification.verification_code || "",
            isVerified: phoneVerification.is_verified,
            attemptCount: phoneVerification.attempt_count,
            lastAttemptAt: phoneVerification.last_attempt_at,
          }
        : {};

    const userRole = (profile?.role as "renter" | "host") || "renter";

    return {
      userId: verification.user_id,
      currentStep: verification.current_step as VerificationStep,
      overallStatus:
        (profile?.verification_status as VerificationStatus) ||
        (verification.overall_status as VerificationStatus),
      startedAt: verification.started_at,
      lastUpdatedAt: verification.last_updated_at,
      completedAt: verification.completed_at,
      personalInfo: verification.personal_info || {},
      documents: mappedDocuments,
      phoneVerification: mappedPhoneVerification,
      addressConfirmation: {},
      stepStatuses,
      adminNotes: verification.admin_notes,
      rejectionReasons: verification.rejection_reasons,
      userRole: userRole,
      isHostVerificationRequired: userRole === "host",
    };
  }
}

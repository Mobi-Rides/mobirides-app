
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

interface ProfileData {
  full_name: string | null;
  phone_number: string | null;
  emergency_contact_name: string | null;
  emergency_contact_phone: string | null;
  role: string;
}

export class VerificationService {
  /**
   * Upload a verification document to Supabase Storage
   */
  static async uploadDocument(
    userId: string,
    documentId: string,
    file: File
  ): Promise<string> {
    try {
      const ext = file.type === "application/pdf" ? "pdf" : file.type.includes("png") ? "png" : "jpg";
      const path = `${userId}/${documentId}-${Date.now()}.${ext}`;
      const { error } = await supabase.storage
        .from("verification-documents")
        .upload(path, file, { upsert: true, contentType: file.type });
      
      if (error) {
        console.error("[VerificationService] Document upload failed:", error);
        throw error;
      }

      // Persist a database record for the uploaded document so admins can review it
      try {
        // Check if a record exists for this user and document type
        const { data: existingRows, error: fetchErr } = await supabase
          .from("verification_documents")
          .select("id")
          .eq("user_id", userId)
          .eq("document_type", documentId as any);

        if (fetchErr) {
          console.warn("[VerificationService] Failed to check existing verification_documents:", fetchErr);
        }

        if (existingRows && existingRows.length > 0) {
          // Update the latest record
          const targetId = existingRows[0].id;
          const { error: updateErr } = await supabase
            .from("verification_documents")
            .update({
              file_path: path,
              file_name: file.name,
              file_size: file.size,
              status: "in_progress",
              uploaded_at: new Date().toISOString(),
            })
            .eq("id", targetId);
          if (updateErr) {
            console.error("[VerificationService] Failed to update verification_documents:", updateErr);
          }
        } else {
          // Insert a new record
          const { error: insertErr } = await supabase
            .from("verification_documents")
            .insert({
              user_id: userId,
              document_type: documentId as any,
              file_path: path,
              file_name: file.name,
              file_size: file.size,
              status: "in_progress",
              uploaded_at: new Date().toISOString(),
            });
          if (insertErr) {
            console.error("[VerificationService] Failed to insert verification_documents:", insertErr);
          }
        }
      } catch (docErr) {
        console.error("[VerificationService] Exception while saving verification_documents:", docErr);
      }

      return path;
    } catch (err) {
      console.error("[VerificationService] Document upload exception:", err);
      throw err;
    }
  }

  /**
   * Upload a selfie photo to Supabase Storage
   */
  static async uploadSelfie(userId: string, file: File): Promise<string> {
    try {
      const ext = file.type.includes("png") ? "png" : "jpg";
      const path = `${userId}/selfie-${Date.now()}.${ext}`;
      const { error } = await supabase.storage
        .from("verification-selfies")
        .upload(path, file, { upsert: true, contentType: file.type });
      
      if (error) {
        console.error("[VerificationService] Selfie upload failed:", error);
        throw error;
      }

      // Persist or update selfie record in verification_documents (tracked under document_type "selfie_photo")
      try {
        const { data: existingRows, error: fetchErr } = await supabase
          .from("verification_documents")
          .select("id")
          .eq("user_id", userId)
          .eq("document_type", "selfie_photo");

        if (fetchErr) {
          console.warn("[VerificationService] Failed to check existing selfie record:", fetchErr);
        }

        if (existingRows && existingRows.length > 0) {
          const targetId = existingRows[0].id;
          const { error: updateErr } = await supabase
            .from("verification_documents")
            .update({
              file_path: path,
              file_name: file.name,
              file_size: file.size,
              status: "in_progress",
              uploaded_at: new Date().toISOString(),
            })
            .eq("id", targetId);
          if (updateErr) {
            console.error("[VerificationService] Failed to update selfie record:", updateErr);
          }
        } else {
          const { error: insertErr } = await supabase
            .from("verification_documents")
            .insert({
              user_id: userId,
              document_type: "selfie_photo" as any,
              file_path: path,
              file_name: file.name,
              file_size: file.size,
              status: "in_progress",
              uploaded_at: new Date().toISOString(),
            });
          if (insertErr) {
            console.error("[VerificationService] Failed to insert selfie record:", insertErr);
          }
        }
      } catch (docErr) {
        console.error("[VerificationService] Exception while saving selfie record:", docErr);
      }

      return path;
    } catch (err) {
      console.error("[VerificationService] Selfie upload exception:", err);
      throw err;
    }
  }

  /**
   * Backfill verification_documents from existing Storage objects for a user.
   * Returns the number of records inserted/updated.
   */
  static async syncDocumentsFromStorageForUser(userId: string): Promise<number> {
    let changed = 0;
    try {
      // List documents in verification-documents bucket under user folder
      const { data: docObjects, error: docListErr } = await supabase.storage
        .from("verification-documents")
        .list(userId, { limit: 100 });

      if (docListErr) {
        console.warn("[VerificationService] Failed to list verification-documents:", docListErr);
      }

      for (const obj of docObjects || []) {
        // file_path is userId/filename
        const filePath = `${userId}/${obj.name}`;
        const fileName = obj.name;
        const guessedType = fileName.split("-")[0]; // e.g., national_id_front-123.jpg
        const fileSize = (obj as any)?.metadata?.size ?? 0;

        // Skip unknown types
        if (!guessedType) continue;

        const { data: existingRows } = await supabase
          .from("verification_documents")
          .select("id")
          .eq("user_id", userId)
          .eq("document_type", guessedType as any);

        if (existingRows && existingRows.length > 0) {
          const targetId = existingRows[0].id;
          const { error: updateErr } = await supabase
            .from("verification_documents")
            .update({
              file_path: filePath,
              file_name: fileName,
              file_size: fileSize,
              status: "in_progress",
              uploaded_at: new Date().toISOString(),
            })
            .eq("id", targetId);
          if (!updateErr) changed++;
        } else {
          const { error: insertErr } = await supabase
            .from("verification_documents")
            .insert({
              user_id: userId,
              document_type: guessedType as any,
              file_path: filePath,
              file_name: fileName,
              file_size: fileSize,
              status: "in_progress",
              uploaded_at: new Date().toISOString(),
            });
          if (!insertErr) changed++;
        }
      }

      // List selfies in verification-selfies bucket
      const { data: selfieObjects, error: selfieListErr } = await supabase.storage
        .from("verification-selfies")
        .list(userId, { limit: 100 });

      if (selfieListErr) {
        console.warn("[VerificationService] Failed to list verification-selfies:", selfieListErr);
      }

      for (const obj of selfieObjects || []) {
        const filePath = `${userId}/${obj.name}`;
        const fileName = obj.name;
        const fileSize = (obj as any)?.metadata?.size ?? 0;
        const docType = "selfie_photo";

        const { data: existingRows } = await supabase
          .from("verification_documents")
          .select("id")
          .eq("user_id", userId)
          .eq("document_type", docType);

        if (existingRows && existingRows.length > 0) {
          const targetId = existingRows[0].id;
          const { error: updateErr } = await supabase
            .from("verification_documents")
            .update({
              file_path: filePath,
              file_name: fileName,
              file_size: fileSize,
              status: "in_progress",
              uploaded_at: new Date().toISOString(),
            })
            .eq("id", targetId);
          if (!updateErr) changed++;
        } else {
          const { error: insertErr } = await supabase
            .from("verification_documents")
            .insert({
              user_id: userId,
              document_type: docType as any,
              file_path: filePath,
              file_name: fileName,
              file_size: fileSize,
              status: "in_progress",
              uploaded_at: new Date().toISOString(),
            });
          if (!insertErr) changed++;
        }
      }

      return changed;
    } catch (err) {
      console.error("[VerificationService] syncDocumentsFromStorageForUser exception:", err);
      return changed;
    }
  }
  /**
   * Fetch user profile data for verification initialization
   */
  static async fetchUserProfileData(userId: string): Promise<ProfileData | null> {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("full_name, phone_number, emergency_contact_name, emergency_contact_phone, role")
        .eq("id", userId)
        .maybeSingle();

      if (error) {
        console.error("[VerificationService] Error fetching profile:", error);
        return null;
      }

      return data;
    } catch (error) {
      console.error("[VerificationService] Failed to fetch profile:", error);
      return null;
    }
  }

  /**
   * Map profile data to personal info structure
   */
  static mapProfileToPersonalInfo(profile: ProfileData | null, userEmail: string | null): Partial<PersonalInfo> {
    if (!profile) return { email: userEmail || "" };

    return {
      fullName: profile.full_name || "",
      phoneNumber: profile.phone_number || "",
      email: userEmail || "",
      emergencyContact: {
        name: profile.emergency_contact_name || "",
        relationship: "", // Default empty, not stored in profile
        phoneNumber: profile.emergency_contact_phone || "",
      },
      // Default empty values for fields not in profile
      dateOfBirth: "",
      nationalIdNumber: "",
      address: {
        street: "",
        area: "",
        city: "",
        postalCode: "",
      },
    };
  }

  /**
   * Determine completion status based on profile data
   */
  static determineCompletionStatus(profile: ProfileData | null) {
    if (!profile) {
      return {
        personal_info_completed: false,
        phone_verified: false,
      };
    }

    return {
      personal_info_completed: !!(profile.full_name && profile.phone_number),
      phone_verified: !!profile.phone_number,
    };
  }

  /**
   * Initialize verification for a new user with profile data integration
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

      // Fetch existing profile data
      const profileData = await this.fetchUserProfileData(userId);
      console.log("[VerificationService] Fetched profile data:", profileData);

      // Get user email from auth session
      const { data: { user } } = await supabase.auth.getUser();
      const userEmail = user?.email || null;

      // Map profile data to personal info
      const personalInfo = this.mapProfileToPersonalInfo(profileData, userEmail);
      const completionStatus = this.determineCompletionStatus(profileData);

      // Determine initial step based on profile completeness
      let currentStep: any = "personal_info";
      if (completionStatus.personal_info_completed) {
        currentStep = "document_upload";
      }

      // Create new verification record with mapped data
      const { data, error } = await supabase
        .from("user_verifications")
        .insert([
          {
            user_id: userId,
            current_step: currentStep,
            overall_status: "not_started",
            personal_info: personalInfo,
            personal_info_completed: completionStatus.personal_info_completed,
            documents_completed: false,
            selfie_completed: false,
            phone_verified: false,
            address_confirmed: true,
          },
        ])
        .select()
        .single();

      if (error) {
        console.error("[VerificationService] Error creating verification:", error.message, "Code:", error.code);
        throw new Error(`Failed to initialize verification: ${error.message}`);
      }

      console.log("[VerificationService] Created verification with profile data:", data);
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
   * Complete document upload (1-DOCUMENT FLOW)
   * Check for 1 required document: national_id_front
   */
  static async completeDocumentUpload(userId: string): Promise<boolean> {
    try {
      // Check if the required documents are uploaded
      // 3-DOCUMENT FLOW: national_id_front, national_id_back, and selfie_photo are required
      const requiredDocTypes = ['national_id_front', 'national_id_back', 'selfie_photo'] as const;
      
      const { data: docs, error: fetchError } = await supabase
        .from("verification_documents")
        .select('document_type')
        .eq("user_id", userId)
        .in('document_type', requiredDocTypes as any);

      if (fetchError) {
        console.error("[VerificationService] Failed to fetch documents:", fetchError);
        return false;
      }

      // Verify all required documents are present
      // We need to check if we have unique document types matching the count of required types
      const uploadedTypes = new Set(docs?.map(d => d.document_type));
      const missingDocs = requiredDocTypes.filter(type => !uploadedTypes.has(type));

      if (missingDocs.length > 0) {
        console.warn("[VerificationService] Required documents missing:", missingDocs);
        return false;
      }

      // Mark documents as completed and move to review step
      const { error } = await supabase
        .from("user_verifications")
        .update({
          documents_completed: true,
          current_step: "review_submit",
          last_updated_at: new Date().toISOString(),
        })
        .eq("user_id", userId);

      if (error) {
        console.error("[VerificationService] Failed to complete document upload:", error);
        return false;
      }
      return true;
    } catch (error) {
      console.error("[VerificationService] Failed to complete document upload:", error);
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
      // Phone verification removed in v2 flow; advance to review_submit
      const { error } = await supabase
        .from("user_verifications")
        .update({
          phone_verified: false,
          address_confirmed: true,
          current_step: "review_submit",
          last_updated_at: new Date().toISOString(),
        })
        .eq("user_id", userId);

      if (error) {
        console.error("[VerificationService] Phone verification (deprecated) update failed:", error);
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
          address_confirmed: true,
          current_step: "review_submit",
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
          current_step: "review_submit",
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
   * Complete verification (for admin/development use)
   */
  static async completeVerification(userId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from("user_verifications")
        .update({
          current_step: "review_submit",
          overall_status: "completed",
          completed_at: new Date().toISOString(),
          last_updated_at: new Date().toISOString(),
        })
        .eq("user_id", userId);

      if (error) {
        console.error("[VerificationService] Failed to complete verification:", error);
        return false;
      }
      return true;
    } catch (error) {
      console.error("[VerificationService] Failed to complete verification:", error);
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

  /**
   * Refresh verification data from current profile
   */
  static async refreshFromProfile(userId: string): Promise<boolean> {
    try {
      const profileData = await this.fetchUserProfileData(userId);
      const { data: { user } } = await supabase.auth.getUser();
      const userEmail = user?.email || null;

      const personalInfo = this.mapProfileToPersonalInfo(profileData, userEmail);
      const completionStatus = this.determineCompletionStatus(profileData);

      const { error } = await supabase
        .from("user_verifications")
        .update({
          personal_info: personalInfo,
          personal_info_completed: completionStatus.personal_info_completed,
          phone_verified: completionStatus.phone_verified,
          last_updated_at: new Date().toISOString(),
        })
        .eq("user_id", userId);

      if (error) {
        console.error("[VerificationService] Failed to refresh from profile:", error);
        return false;
      }
      return true;
    } catch (error) {
      console.error("[VerificationService] Failed to refresh from profile:", error);
      return false;
    }
  }
}

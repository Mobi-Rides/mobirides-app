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
  avatar_url: string | null;
}

export class VerificationService {
  /**
   * Fetch user profile data for verification initialization
   */
  static async fetchUserProfileData(userId: string): Promise<ProfileData | null> {
    try {
      console.log("[VerificationService] Fetching profile data for user:", userId);
      
      const { data, error } = await supabase
        .from("profiles")
        .select("full_name, phone_number, emergency_contact_name, emergency_contact_phone, role, avatar_url")
        .eq("id", userId)
        .maybeSingle();

      if (error) {
        console.error("[VerificationService] Error fetching profile:", error);
        return null;
      }

      console.log("[VerificationService] Profile data fetched:", data);
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
    console.log("[VerificationService] Mapping profile to personal info:", { profile, userEmail });
    
    if (!profile) {
      return { 
        email: userEmail || "",
        fullName: "",
        phoneNumber: "",
        dateOfBirth: "",
        nationalIdNumber: "",
        address: {
          street: "",
          area: "",
          city: "",
          postalCode: "",
        },
        emergencyContact: {
          name: "",
          relationship: "",
          phoneNumber: "",
        },
      };
    }

    const mappedData = {
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

    console.log("[VerificationService] Mapped personal info:", mappedData);
    return mappedData;
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
        console.log("[VerificationService] Verification already exists, refreshing with profile data");
        
        // Always refresh existing verification with latest profile data
        const profileData = await this.fetchUserProfileData(userId);
        const { data: { user } } = await supabase.auth.getUser();
        const userEmail = user?.email || null;
        
        const personalInfo = this.mapProfileToPersonalInfo(profileData, userEmail);
        const completionStatus = this.determineCompletionStatus(profileData);

        // Update existing verification with fresh profile data
        const { data: updated, error: updateError } = await supabase
          .from("user_verifications")
          .update({
            personal_info: personalInfo,
            personal_info_completed: completionStatus.personal_info_completed,
            phone_verified: completionStatus.phone_verified,
            last_updated_at: new Date().toISOString(),
          })
          .eq("user_id", userId)
          .select()
          .single();

        if (updateError) {
          console.error("[VerificationService] Error updating verification with profile data:", updateError);
          return existing as VerificationData;
        }

        console.log("[VerificationService] Updated verification with profile data:", updated);
        return updated as VerificationData;
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
      let currentStep = "personal_info";
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
            user_role: userRole,
            personal_info_completed: completionStatus.personal_info_completed,
            documents_completed: false,
            selfie_completed: false,
            phone_verified: completionStatus.phone_verified,
            address_confirmed: false,
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
   * Refresh verification data from current profile
   */
  static async refreshFromProfile(userId: string): Promise<boolean> {
    try {
      console.log("[VerificationService] Refreshing verification from profile for user:", userId);
      
      const profileData = await this.fetchUserProfileData(userId);
      const { data: { user } } = await supabase.auth.getUser();
      const userEmail = user?.email || null;

      const personalInfo = this.mapProfileToPersonalInfo(profileData, userEmail);
      const completionStatus = this.determineCompletionStatus(profileData);

      console.log("[VerificationService] Updating verification with refreshed profile data:", {
        personalInfo,
        completionStatus
      });

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
      
      console.log("[VerificationService] Successfully refreshed verification from profile");
      return true;
    } catch (error) {
      console.error("[VerificationService] Failed to refresh from profile:", error);
      return false;
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
   * Complete verification (for admin/development use)
   */
  static async completeVerification(userId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from("user_verifications")
        .update({
          current_step: "completion",
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
}

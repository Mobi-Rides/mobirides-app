
/**
 * Type definitions for the User Verification System
 * Updated to match actual database schema
 */

// Verification steps enum for progress tracking
// Updated: Removed ADDRESS_CONFIRMATION step from user flow
export enum VerificationStep {
  PERSONAL_INFO = "personal_info",
  DOCUMENT_UPLOAD = "document_upload",
  SELFIE_VERIFICATION = "selfie_verification",
  PHONE_VERIFICATION = "phone_verification",
  REVIEW_SUBMIT = "review_submit",
  PROCESSING_STATUS = "processing_status",
  COMPLETION = "completion",
}

// Verification status for each step and overall process
export enum VerificationStatus {
  NOT_STARTED = "not_started",
  IN_PROGRESS = "in_progress",
  COMPLETED = "completed",
  FAILED = "failed",
  REJECTED = "rejected",
  PENDING_REVIEW = "pending_review",
}

// Document types required for Botswana standards
export enum DocumentType {
  NATIONAL_ID_FRONT = "national_id_front",
  NATIONAL_ID_BACK = "national_id_back",
  DRIVING_LICENSE_FRONT = "driving_license_front",
  DRIVING_LICENSE_BACK = "driving_license_back",
  PROOF_OF_ADDRESS = "proof_of_address",
  VEHICLE_REGISTRATION = "vehicle_registration",
  VEHICLE_OWNERSHIP = "vehicle_ownership",
  PROOF_OF_INCOME = "proof_of_income",
  SELFIE_PHOTO = "selfie_photo",
}

// Personal information structure for Botswana users
export interface PersonalInfo {
  fullName: string;
  dateOfBirth: string;
  nationalIdNumber: string;
  phoneNumber: string;
  email: string;
  address: {
    street: string;
    area: string;
    city: string;
    postalCode?: string;
  };
  emergencyContact: {
    name: string;
    relationship: string;
    phoneNumber: string;
  };
}

// Document upload structure with metadata
export interface DocumentUpload {
  type: DocumentType;
  file: File | null;
  fileName: string;
  fileSize: number;
  uploadedAt: string;
  status: VerificationStatus;
  rejectionReason?: string;
  expiryDate?: string;
  documentNumber?: string;
}

// Phone verification data
export interface PhoneVerification {
  phoneNumber: string;
  countryCode: string;
  verificationCode: string;
  isVerified: boolean;
  attemptCount: number;
  lastAttemptAt: string;
}

// Selfie verification data
export interface SelfieVerification {
  selfieFile: File | null;
  fileName: string;
  fileSize: number;
  uploadedAt: string;
  status: VerificationStatus;
  rejectionReason?: string;
  isVerified: boolean;
}

// Address confirmation data
export interface AddressConfirmation {
  currentAddress: PersonalInfo["address"];
  confirmationMethod: "document" | "utility_bill" | "bank_statement";
  isConfirmed: boolean;
  confirmationDate?: string;
}

// Database verification data structure (matches actual DB schema)
export interface VerificationData {
  id: string;
  user_id: string;
  current_step: string;
  overall_status: string;
  created_at: string;
  last_updated_at: string;
  completed_at?: string;
  
  // Step completion flags (matches DB)
  personal_info_completed: boolean;
  documents_completed: boolean;
  selfie_completed: boolean;
  phone_verified: boolean;
  address_confirmed: boolean;
  
  // Data storage
  personal_info: Record<string, unknown>;
  user_role: string;
  
  // Admin fields
  admin_notes?: string;
  rejection_reasons?: string[];
}

// Progress tracking interface
export interface VerificationProgress {
  completed: number;
  total: number;
  percentage: number;
}

// Validation error structure
export interface ValidationError {
  field: string;
  message: string;
  code: string;
}

// Step completion data
export interface StepCompletionData {
  step: VerificationStep;
  isValid: boolean;
  errors: ValidationError[];
  data: Record<string, unknown>;
}

// Local storage keys for development
export const STORAGE_KEYS = {
  VERIFICATION_DATA: "mobirides_verification_data",
  CURRENT_STEP: "mobirides_verification_step",
  UPLOADED_DOCUMENTS: "mobirides_verification_documents",
  PHONE_VERIFICATION: "mobirides_phone_verification",
  PERSONAL_INFO: "mobirides_personal_info",
} as const;

// Document requirements configuration
export interface DocumentRequirement {
  type: DocumentType;
  required: boolean;
  maxSizeMB: number;
  allowedFormats: string[];
  description: string;
  botswanaSpecific?: boolean;
}

export const BOTSWANA_DOCUMENT_REQUIREMENTS: DocumentRequirement[] = [
  {
    type: DocumentType.NATIONAL_ID_FRONT,
    required: true,
    maxSizeMB: 5,
    allowedFormats: ["image/jpeg", "image/png", "application/pdf"],
    description: "Front side of Botswana National ID (Omang)",
    botswanaSpecific: true,
  },
  {
    type: DocumentType.NATIONAL_ID_BACK,
    required: true,
    maxSizeMB: 5,
    allowedFormats: ["image/jpeg", "image/png", "application/pdf"],
    description: "Back side of Botswana National ID (Omang)",
    botswanaSpecific: true,
  },
  {
    type: DocumentType.DRIVING_LICENSE_FRONT,
    required: true,
    maxSizeMB: 5,
    allowedFormats: ["image/jpeg", "image/png", "application/pdf"],
    description: "Front side of valid Botswana Driving License",
  },
  {
    type: DocumentType.DRIVING_LICENSE_BACK,
    required: true,
    maxSizeMB: 5,
    allowedFormats: ["image/jpeg", "image/png", "application/pdf"],
    description: "Back side of valid Botswana Driving License",
  },
  {
    type: DocumentType.PROOF_OF_ADDRESS,
    required: false, // No longer required in user flow - auto-completed
    maxSizeMB: 5,
    allowedFormats: ["image/jpeg", "image/png", "application/pdf"],
    description: "Utility bill or bank statement (max 3 months old) - Optional",
  },
  {
    type: DocumentType.PROOF_OF_INCOME,
    required: true,
    maxSizeMB: 5,
    allowedFormats: ["image/jpeg", "image/png", "application/pdf"],
    description: "Proof of Income (required for verification)",
  },
];

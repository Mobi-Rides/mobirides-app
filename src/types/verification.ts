/**
 * Type definitions for the User Verification System
 * Includes Botswana-specific requirements and multi-step verification flow
 */

// Verification steps enum for progress tracking
export enum VerificationStep {
  PERSONAL_INFO = "personal_info",
  DOCUMENT_UPLOAD = "document_upload",
  SELFIE_VERIFICATION = "selfie_verification",
  PHONE_VERIFICATION = "phone_verification",
  ADDRESS_CONFIRMATION = "address_confirmation",
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
  NATIONAL_ID_FRONT = "national_id_front", // Omang front
  NATIONAL_ID_BACK = "national_id_back", // Omang back
  DRIVING_LICENSE_FRONT = "driving_license_front",
  DRIVING_LICENSE_BACK = "driving_license_back",
  PROOF_OF_ADDRESS = "proof_of_address", // Utility bill/bank statement
  VEHICLE_REGISTRATION = "vehicle_registration", // For hosts only
  VEHICLE_OWNERSHIP = "vehicle_ownership", // For hosts only
  PROOF_OF_INCOME = "proof_of_income", // Optional
  SELFIE_PHOTO = "selfie_photo",
}

// Personal information structure for Botswana users
export interface PersonalInfo {
  fullName: string;
  dateOfBirth: string;
  nationalIdNumber: string; // Omang number
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
  expiryDate?: string; // For licenses and ID documents
  documentNumber?: string; // License number, ID number, etc.
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

// Address confirmation data
export interface AddressConfirmation {
  currentAddress: PersonalInfo["address"];
  confirmationMethod: "document" | "utility_bill" | "bank_statement";
  isConfirmed: boolean;
  confirmationDate?: string;
}

// Complete verification data structure
export interface VerificationData {
  userId: string;
  currentStep: VerificationStep;
  overallStatus: VerificationStatus;
  startedAt: string;
  lastUpdatedAt: string;
  completedAt?: string;

  // Step-specific data
  personalInfo: Partial<PersonalInfo>;
  documents: DocumentUpload[];
  phoneVerification: Partial<PhoneVerification>;
  addressConfirmation: Partial<AddressConfirmation>;

  // Tracking and metadata
  stepStatuses: Record<VerificationStep, VerificationStatus>;
  adminNotes?: string;
  rejectionReasons?: string[];

  // Role-specific requirements
  userRole: "renter" | "host";
  isHostVerificationRequired: boolean;
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
  data: Record<string, unknown>; // Step-specific data
}

// Progress tracking
export interface VerificationProgress {
  currentStep: VerificationStep;
  completedSteps: VerificationStep[];
  totalSteps: number;
  progressPercentage: number;
  estimatedTimeRemaining: string;
}

// Local storage keys for development
export const STORAGE_KEYS = {
  VERIFICATION_DATA: "mobirides_verification_data",
  CURRENT_STEP: "mobirides_verification_step",
  UPLOADED_DOCUMENTS: "mobirides_verification_documents",
  PHONE_VERIFICATION: "mobirides_phone_verification",
  PERSONAL_INFO: "mobirides_personal_info",
} as const;

// Configuration for document requirements
export interface DocumentRequirement {
  type: DocumentType;
  required: boolean;
  maxSizeMB: number;
  allowedFormats: string[];
  description: string;
  botswanaSpecific?: boolean;
}

// Botswana-specific document requirements configuration
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
    required: true,
    maxSizeMB: 5,
    allowedFormats: ["image/jpeg", "image/png", "application/pdf"],
    description: "Utility bill or bank statement (max 3 months old)",
  },
  {
    type: DocumentType.VEHICLE_REGISTRATION,
    required: false, // Only for hosts
    maxSizeMB: 5,
    allowedFormats: ["image/jpeg", "image/png", "application/pdf"],
    description: "Vehicle Registration Certificate (for car owners only)",
  },
  {
    type: DocumentType.VEHICLE_OWNERSHIP,
    required: false, // Only for hosts
    maxSizeMB: 5,
    allowedFormats: ["image/jpeg", "image/png", "application/pdf"],
    description: "Proof of Vehicle Ownership (for car owners only)",
  },
  {
    type: DocumentType.PROOF_OF_INCOME,
    required: true,
    maxSizeMB: 5,
    allowedFormats: ["image/jpeg", "image/png", "application/pdf"],
    description: "Proof of Income (required for verification)",
  },
];

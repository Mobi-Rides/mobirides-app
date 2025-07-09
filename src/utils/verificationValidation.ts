/**
 * Zod Validation Schemas for User Verification System
 * Includes Botswana-specific validation rules and requirements
 */

import { z } from "zod";
import { DocumentType } from "@/types/verification";

/**
 * Personal Information Validation Schema
 * Includes Botswana-specific field requirements and format validation
 */
export const PersonalInfoSchema = z.object({
  fullName: z
    .string()
    .min(2, "Full name must be at least 2 characters")
    .max(100, "Full name must not exceed 100 characters")
    .regex(/^[a-zA-Z\s]+$/, "Full name can only contain letters and spaces")
    .refine(
      (name) => name.trim().split(" ").length >= 2,
      "Please provide at least first and last name",
    ),

  dateOfBirth: z
    .string()
    .refine((date) => {
      const birthDate = new Date(date);
      const today = new Date();
      const age = today.getFullYear() - birthDate.getFullYear();
      return age >= 18 && age <= 100;
    }, "You must be between 18 and 100 years old")
    .refine((date) => {
      const birthDate = new Date(date);
      return birthDate <= new Date();
    }, "Date of birth cannot be in the future"),

  nationalIdNumber: z
    .string()
    .length(9, "Botswana National ID (Omang) must be exactly 9 digits")
    .regex(/^\d{9}$/, "National ID must contain only numbers"),

  phoneNumber: z
    .string()
    .regex(
      /^\+267\d{8}$/,
      "Phone number must be in format +267XXXXXXXX (Botswana)",
    )
    .refine((phone) => {
      // Check for valid Botswana mobile prefixes (71, 72, 73, 74, 75, 76, 77)
      const prefix = phone.substring(4, 6);
      return ["71", "72", "73", "74", "75", "76", "77"].includes(prefix);
    }, "Please provide a valid Botswana mobile number"),

  email: z
    .string()
    .email("Please provide a valid email address")
    .max(255, "Email address is too long"),

  address: z.object({
    street: z
      .string()
      .min(5, "Street address must be at least 5 characters")
      .max(200, "Street address is too long"),

    area: z
      .string()
      .min(2, "Area/Suburb must be at least 2 characters")
      .max(100, "Area/Suburb name is too long"),

    city: z
      .string()
      .min(2, "City must be at least 2 characters")
      .max(100, "City name is too long")
      .refine((city) => {
        // Validate common Botswana cities/towns
        const botswanaCities = [
          "gaborone",
          "francistown",
          "maun",
          "kasane",
          "serowe",
          "molepolole",
          "kanye",
          "mahalapye",
          "palapye",
          "lobatse",
          "jwaneng",
          "orapa",
          "selebi-phikwe",
          "letlhakane",
          "mochudi",
          "ramotswa",
          "tlokweng",
        ];
        return (
          botswanaCities.includes(city.toLowerCase()) ||
          city.toLowerCase().includes("gaborone")
        );
      }, "Please provide a valid Botswana city/town"),

    postalCode: z
      .string()
      .optional()
      .refine(
        (code) => !code || /^\d{5}$/.test(code),
        "Postal code must be 5 digits if provided",
      ),
  }),

  emergencyContact: z.object({
    name: z
      .string()
      .min(2, "Emergency contact name must be at least 2 characters")
      .max(100, "Emergency contact name is too long")
      .regex(/^[a-zA-Z\s]+$/, "Name can only contain letters and spaces"),

    relationship: z
      .string()
      .min(2, "Relationship must be specified")
      .max(50, "Relationship description is too long"),

    phoneNumber: z
      .string()
      .regex(
        /^\+267\d{8}$/,
        "Emergency contact phone must be in format +267XXXXXXXX",
      ),
  }),
});

/**
 * Phone Verification Schema
 * Validates phone number and verification code format
 */
export const PhoneVerificationSchema = z.object({
  phoneNumber: z
    .string()
    .regex(
      /^\+267\d{8}$/,
      "Phone number must be in Botswana format (+267XXXXXXXX)",
    ),

  countryCode: z
    .string()
    .refine(
      (code) => code === "+267",
      "Only Botswana phone numbers are supported",
    ),

  verificationCode: z
    .string()
    .length(6, "Verification code must be exactly 6 digits")
    .regex(/^\d{6}$/, "Verification code must contain only numbers"),
});

/**
 * Document Upload Validation Schema
 * Validates file types, sizes, and metadata
 */
export const DocumentUploadSchema = z.object({
  type: z.nativeEnum(DocumentType, {
    errorMap: () => ({ message: "Invalid document type" }),
  }),

  file: z
    .instanceof(File, { message: "A valid file must be selected" })
    .refine(
      (file) => file.size <= 5 * 1024 * 1024,
      "File size must be less than 5MB",
    )
    .refine((file) => {
      const allowedTypes = ["image/jpeg", "image/png", "application/pdf"];
      return allowedTypes.includes(file.type);
    }, "File must be a JPEG, PNG, or PDF"),

  fileName: z
    .string()
    .min(1, "File name is required")
    .max(255, "File name is too long"),

  documentNumber: z
    .string()
    .optional()
    .refine((num) => {
      if (!num) return true; // Optional field
      // Validate based on document type
      return num.length >= 3 && num.length <= 20;
    }, "Document number must be between 3 and 20 characters"),

  expiryDate: z
    .string()
    .optional()
    .refine((date) => {
      if (!date) return true; // Optional field
      const expiry = new Date(date);
      const today = new Date();
      return expiry > today;
    }, "Document must not be expired"),
});

/**
 * Address Confirmation Schema
 * Validates address confirmation method and data
 */
export const AddressConfirmationSchema = z.object({
  currentAddress: PersonalInfoSchema.shape.address,

  confirmationMethod: z.enum(["document", "utility_bill", "bank_statement"], {
    errorMap: () => ({ message: "Please select a valid confirmation method" }),
  }),

  isConfirmed: z
    .boolean()
    .refine(
      (confirmed) => confirmed === true,
      "Address must be confirmed to proceed",
    ),
});

/**
 * Complete Verification Submission Schema
 * Validates all required data before final submission
 */
export const VerificationSubmissionSchema = z.object({
  personalInfo: PersonalInfoSchema,

  documentsCompleted: z
    .boolean()
    .refine(
      (completed) => completed === true,
      "All required documents must be uploaded",
    ),

  phoneVerified: z
    .boolean()
    .refine((verified) => verified === true, "Phone number must be verified"),

  addressConfirmed: z
    .boolean()
    .refine((confirmed) => confirmed === true, "Address must be confirmed"),

  selfieCompleted: z
    .boolean()
    .refine(
      (completed) => completed === true,
      "Selfie verification must be completed",
    ),

  termsAccepted: z
    .boolean()
    .refine(
      (accepted) => accepted === true,
      "You must accept the terms and conditions",
    ),

  dataConsent: z
    .boolean()
    .refine(
      (consented) => consented === true,
      "You must consent to data processing",
    ),
});

/**
 * Helper function to validate document requirements based on user role
 * Returns required document types for renter vs host
 */
export function getRequiredDocuments(
  userRole: "renter" | "host",
): DocumentType[] {
  const baseRequired = [
    DocumentType.NATIONAL_ID_FRONT,
    DocumentType.NATIONAL_ID_BACK,
    DocumentType.DRIVING_LICENSE_FRONT,
    DocumentType.DRIVING_LICENSE_BACK,
    DocumentType.PROOF_OF_ADDRESS,
  ];

  if (userRole === "host") {
    return [
      ...baseRequired,
      DocumentType.VEHICLE_REGISTRATION,
      DocumentType.VEHICLE_OWNERSHIP,
    ];
  }

  return baseRequired;
}

/**
 * Validate Omang (National ID) number - simple format validation
 * Just checks basic format requirements
 */
export function validateOmangNumber(omangNumber: string): {
  isValid: boolean;
  error?: string;
} {
  // Remove any spaces or dashes
  const cleanOmang = omangNumber.replace(/[\s-]/g, "");

  // Check basic format (9 digits)
  if (!/^\d{9}$/.test(cleanOmang)) {
    return { isValid: false, error: "Omang must be exactly 9 digits" };
  }

  // Simple validation - just check format
  return { isValid: true };
}

/**
 * Generate validation error messages for forms
 * Provides user-friendly error messages
 */
export function formatValidationErrors(
  errors: z.ZodError,
): Record<string, string> {
  const formattedErrors: Record<string, string> = {};

  errors.errors.forEach((error) => {
    const path = error.path.join(".");
    formattedErrors[path] = error.message;
  });

  return formattedErrors;
}

/**
 * Validate file upload before processing
 * Additional security and format checks
 */
export function validateFileUpload(
  file: File,
  documentType: DocumentType,
): {
  isValid: boolean;
  error?: string;
} {
  // File size check (5MB limit)
  if (file.size > 5 * 1024 * 1024) {
    return { isValid: false, error: "File size must be less than 5MB" };
  }

  // File type check
  const allowedTypes = ["image/jpeg", "image/png", "application/pdf"];
  if (!allowedTypes.includes(file.type)) {
    return {
      isValid: false,
      error: "Only JPEG, PNG, and PDF files are allowed",
    };
  }

  // File name validation
  if (file.name.length > 255) {
    return { isValid: false, error: "File name is too long" };
  }

  // Check for suspicious file extensions
  const suspiciousExtensions = [".exe", ".bat", ".com", ".scr", ".pif"];
  const hasStusiciousExtension = suspiciousExtensions.some((ext) =>
    file.name.toLowerCase().endsWith(ext),
  );

  if (hasStusiciousExtension) {
    return {
      isValid: false,
      error: "File type not allowed for security reasons",
    };
  }

  return { isValid: true };
}

// All schemas are already exported as const declarations above

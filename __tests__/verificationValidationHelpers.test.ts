import { z } from "zod";
import {
  formatValidationErrors,
  getRequiredDocuments,
  validateFileUpload,
  validateOmangNumber,
} from "@/utils/verificationValidation";
import { DocumentType } from "@/types/verification";

describe("verification validation helpers", () => {
  it("returns base required documents for renter", () => {
    const docs = getRequiredDocuments("renter");
    expect(docs).toContain(DocumentType.NATIONAL_ID_FRONT);
    expect(docs).toContain(DocumentType.DRIVING_LICENSE_FRONT);
    expect(docs).not.toContain(DocumentType.VEHICLE_REGISTRATION);
  });

  it("includes host-specific required documents for host", () => {
    const docs = getRequiredDocuments("host");
    expect(docs).toContain(DocumentType.VEHICLE_REGISTRATION);
    expect(docs).toContain(DocumentType.VEHICLE_OWNERSHIP);
  });

  it("validates omang format and strips spaces and dashes", () => {
    expect(validateOmangNumber("123 456-789")).toEqual({ isValid: true });
    expect(validateOmangNumber("12345")).toEqual({
      isValid: false,
      error: "Omang must be exactly 9 digits",
    });
  });

  it("formats zod validation errors into keyed object", () => {
    const schema = z.object({
      fullName: z.string().min(2, "Name too short"),
      age: z.number().min(18, "Must be an adult"),
    });

    const result = schema.safeParse({ fullName: "A", age: 15 });
    expect(result.success).toBe(false);

    if (result.success) {
      throw new Error("Expected validation to fail");
    }

    const formatted = formatValidationErrors(result.error);
    expect(formatted.fullName).toBe("Name too short");
    expect(formatted.age).toBe("Must be an adult");
  });

  it("rejects file uploads with oversized files", () => {
    const file = {
      size: 6 * 1024 * 1024,
      type: "application/pdf",
      name: "id.pdf",
    } as File;

    expect(validateFileUpload(file, DocumentType.NATIONAL_ID_FRONT)).toEqual({
      isValid: false,
      error: "File size must be less than 5MB",
    });
  });

  it("rejects file uploads with unsupported mime types", () => {
    const file = {
      size: 1024,
      type: "text/plain",
      name: "notes.txt",
    } as File;

    expect(validateFileUpload(file, DocumentType.NATIONAL_ID_FRONT)).toEqual({
      isValid: false,
      error: "Only JPEG, PNG, and PDF files are allowed",
    });
  });

  it("rejects suspicious file extensions", () => {
    const file = {
      size: 1024,
      type: "application/pdf",
      name: "malware.exe",
    } as File;

    expect(validateFileUpload(file, DocumentType.NATIONAL_ID_FRONT)).toEqual({
      isValid: false,
      error: "File type not allowed for security reasons",
    });
  });

  it("accepts valid file uploads", () => {
    const file = {
      size: 1024,
      type: "application/pdf",
      name: "verification-document.pdf",
    } as File;

    expect(validateFileUpload(file, DocumentType.NATIONAL_ID_FRONT)).toEqual({ isValid: true });
  });
});
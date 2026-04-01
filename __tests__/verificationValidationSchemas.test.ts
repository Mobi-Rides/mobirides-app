import {
  AddressConfirmationSchema,
  DocumentUploadSchema,
  PersonalInfoSchema,
  PhoneVerificationSchema,
  VerificationSubmissionSchema,
} from "@/utils/verificationValidation";
import { DocumentType } from "@/types/verification";

const validPersonalInfo = {
  fullName: "Jane Doe",
  dateOfBirth: "1995-04-12",
  nationalIdNumber: "123456789",
  phoneNumber: "+26771234567",
  email: "jane@example.com",
  address: {
    street: "123 Main Street",
    area: "Block 8",
    city: "Gaborone",
    postalCode: "00001",
  },
  emergencyContact: {
    name: "John Doe",
    relationship: "Brother",
    phoneNumber: "+26772123456",
  },
};

describe("verification validation schemas", () => {
  it("accepts valid personal info payload", () => {
    const result = PersonalInfoSchema.safeParse(validPersonalInfo);
    expect(result.success).toBe(true);
  });

  it("rejects invalid Botswana phone prefix", () => {
    const result = PersonalInfoSchema.safeParse({
      ...validPersonalInfo,
      phoneNumber: "+26799123456",
    });

    expect(result.success).toBe(false);
  });

  it("rejects future date of birth", () => {
    const result = PersonalInfoSchema.safeParse({
      ...validPersonalInfo,
      dateOfBirth: "2099-01-01",
    });

    expect(result.success).toBe(false);
  });

  it("rejects unknown city", () => {
    const result = PersonalInfoSchema.safeParse({
      ...validPersonalInfo,
      address: {
        ...validPersonalInfo.address,
        city: "Atlantis",
      },
    });

    expect(result.success).toBe(false);
  });

  it("validates phone verification payload", () => {
    expect(
      PhoneVerificationSchema.safeParse({
        phoneNumber: "+26772123456",
        countryCode: "+267",
        verificationCode: "123456",
      }).success,
    ).toBe(true);

    expect(
      PhoneVerificationSchema.safeParse({
        phoneNumber: "+26772123456",
        countryCode: "+1",
        verificationCode: "12345A",
      }).success,
    ).toBe(false);
  });

  it("validates document upload schema constraints", () => {
    const validFile = new File(["doc"], "license.pdf", { type: "application/pdf" });
    const valid = DocumentUploadSchema.safeParse({
      type: DocumentType.DRIVING_LICENSE_FRONT,
      file: validFile,
      fileName: "license.pdf",
      documentNumber: "ABC123",
      expiryDate: "2030-01-01",
    });
    expect(valid.success).toBe(true);

    const expired = DocumentUploadSchema.safeParse({
      type: DocumentType.DRIVING_LICENSE_FRONT,
      file: validFile,
      fileName: "license.pdf",
      documentNumber: "AB",
      expiryDate: "2000-01-01",
    });
    expect(expired.success).toBe(false);
  });

  it("validates address confirmation and complete submission flags", () => {
    const addressResult = AddressConfirmationSchema.safeParse({
      currentAddress: validPersonalInfo.address,
      confirmationMethod: "utility_bill",
      isConfirmed: true,
    });
    expect(addressResult.success).toBe(true);

    const submissionResult = VerificationSubmissionSchema.safeParse({
      personalInfo: validPersonalInfo,
      documentsCompleted: true,
      phoneVerified: true,
      addressConfirmed: true,
      selfieCompleted: true,
      termsAccepted: true,
      dataConsent: true,
    });
    expect(submissionResult.success).toBe(true);

    const invalidSubmission = VerificationSubmissionSchema.safeParse({
      personalInfo: validPersonalInfo,
      documentsCompleted: false,
      phoneVerified: true,
      addressConfirmed: true,
      selfieCompleted: true,
      termsAccepted: false,
      dataConsent: true,
    });
    expect(invalidSubmission.success).toBe(false);
  });
});
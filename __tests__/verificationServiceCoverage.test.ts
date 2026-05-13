import { VerificationService } from "@/services/verificationService";
import { supabase } from "@/integrations/supabase/client";

jest.mock("@/integrations/supabase/client", () => ({
  supabase: {
    from: jest.fn(),
    auth: {
      getUser: jest.fn(),
    },
    rpc: jest.fn(),
    storage: {
      from: jest.fn(),
    },
  },
}));

jest.mock("@/services/notificationService", () => ({
  ResendEmailService: {
    getInstance: jest.fn(() => ({
      sendEmail: jest.fn().mockResolvedValue({ success: true }),
    })),
  },
}));

const makeMutationQuery = (result: { error?: unknown } = {}) => {
  const query = {
    update: jest.fn(() => query),
    insert: jest.fn(() => query),
    select: jest.fn(() => query),
    eq: jest.fn(() => Promise.resolve({ error: result.error ?? null })),
    single: jest.fn(() => Promise.resolve({ data: { current_step: "personal_info" }, error: result.error ?? null })),
  };
  return query;
};

const makeSelectQuery = (result: { data?: unknown; error?: unknown } = {}) => {
  const query = {
    select: jest.fn(() => query),
    eq: jest.fn(() => query),
    in: jest.fn(() => Promise.resolve({ data: result.data ?? [], error: result.error ?? null })),
    maybeSingle: jest.fn(() => Promise.resolve({ data: result.data ?? null, error: result.error ?? null })),
    single: jest.fn(() => Promise.resolve({ data: result.data ?? null, error: result.error ?? null })),
  };
  return query;
};

describe("VerificationService coverage", () => {
  const userId = `user-${Math.random().toString(16).slice(2)}`;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, "error").mockImplementation(() => {});
    jest.spyOn(console, "warn").mockImplementation(() => {});
    jest.spyOn(console, "log").mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("maps profile data into the personal info shape without requiring row IDs", () => {
    const profile = {
      full_name: "Test User",
      phone_number: "+26770000000",
      emergency_contact_name: "Emergency Contact",
      emergency_contact_phone: "+26771111111",
      role: "renter",
    };

    expect(VerificationService.mapProfileToPersonalInfo(profile, "user@example.com")).toMatchObject({
      fullName: profile.full_name,
      phoneNumber: profile.phone_number,
      email: "user@example.com",
      emergencyContact: {
        name: profile.emergency_contact_name,
        phoneNumber: profile.emergency_contact_phone,
      },
      address: {
        street: "",
        area: "",
        city: "",
        postalCode: "",
      },
    });

    expect(VerificationService.mapProfileToPersonalInfo(null, null)).toEqual({ email: "" });
  });

  it("derives completion status from profile completeness", () => {
    expect(VerificationService.determineCompletionStatus(null)).toEqual({
      personal_info_completed: false,
      phone_verified: false,
    });

    expect(VerificationService.determineCompletionStatus({
      full_name: "Complete User",
      phone_number: "+26770000000",
      emergency_contact_name: null,
      emergency_contact_phone: null,
      role: "host",
    })).toEqual({
      personal_info_completed: true,
      phone_verified: true,
    });
  });

  it("fetches profile data and returns null on fetch errors", async () => {
    const profile = {
      full_name: "Profile User",
      phone_number: null,
      emergency_contact_name: null,
      emergency_contact_phone: null,
      role: "renter",
    };
    (supabase.from as jest.Mock).mockReturnValueOnce(makeSelectQuery({ data: profile }));

    await expect(VerificationService.fetchUserProfileData(userId)).resolves.toEqual(profile);

    (supabase.from as jest.Mock).mockReturnValueOnce(makeSelectQuery({ error: { message: "read failed" } }));
    await expect(VerificationService.fetchUserProfileData(userId)).resolves.toBeNull();
  });

  it("updates verification step payloads using semantic fields", async () => {
    const mutation = makeMutationQuery();
    (supabase.from as jest.Mock).mockReturnValue(mutation);

    await expect(VerificationService.updatePersonalInfo(userId, { fullName: "Updated User" })).resolves.toBe(true);
    expect(mutation.update).toHaveBeenCalledWith(expect.objectContaining({
      personal_info_completed: true,
      current_step: "document_upload",
    }));

    await expect(VerificationService.updatePhoneVerification(userId, {})).resolves.toBe(true);
    expect(mutation.update).toHaveBeenCalledWith(expect.objectContaining({
      phone_verified: false,
      address_confirmed: true,
      current_step: "review_submit",
    }));

    await expect(VerificationService.updateAddressConfirmation(userId, {})).resolves.toBe(true);
    expect(mutation.update).toHaveBeenCalledWith(expect.objectContaining({
      address_confirmed: true,
      current_step: "review_submit",
    }));
  });

  it("requires all verification documents before completing upload", async () => {
    const missingDocuments = makeSelectQuery({ data: [{ document_type: "national_id_front" }] });
    (supabase.from as jest.Mock).mockReturnValueOnce(missingDocuments);

    await expect(VerificationService.completeDocumentUpload(userId)).resolves.toBe(false);

    const completeDocuments = makeSelectQuery({
      data: [
        { document_type: "selfie_photo" },
        { document_type: "national_id_back" },
        { document_type: "national_id_front" },
      ],
    });
    const updateQuery = makeMutationQuery();
    (supabase.from as jest.Mock)
      .mockReturnValueOnce(completeDocuments)
      .mockReturnValueOnce(updateQuery);

    await expect(VerificationService.completeDocumentUpload(userId)).resolves.toBe(true);
    expect(updateQuery.update).toHaveBeenCalledWith(expect.objectContaining({
      documents_completed: true,
      current_step: "review_submit",
    }));
  });

  it("submits, navigates, and completes verification through public methods", async () => {
    const mutation = makeMutationQuery();
    (supabase.from as jest.Mock).mockReturnValue(mutation);
    (supabase.rpc as jest.Mock).mockResolvedValue({ data: [], error: null });

    await expect(VerificationService.submitForReview(userId)).resolves.toBe(true);
    expect(mutation.update).toHaveBeenCalledWith(expect.objectContaining({
      overall_status: "pending_review",
      current_step: "review_submit",
    }));

    await expect(VerificationService.navigateToStep(userId, "document_upload" as any)).resolves.toBe(true);
    expect(mutation.update).toHaveBeenCalledWith(expect.objectContaining({
      current_step: "document_upload",
    }));

    await expect(VerificationService.completeVerification(userId)).resolves.toBe(true);
    expect(mutation.update).toHaveBeenCalledWith(expect.objectContaining({
      overall_status: "completed",
      current_step: "review_submit",
    }));
  });
});

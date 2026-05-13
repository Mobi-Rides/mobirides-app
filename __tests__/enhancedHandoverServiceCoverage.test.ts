import {
  HANDOVER_STEPS,
  completeHandoverStep,
  createIdentityVerificationCheck,
  createVehicleConditionReport,
  getHandoverSteps,
  getIdentityVerificationChecks,
  getVehicleConditionReports,
  initializeHandoverSteps,
  updateIdentityVerificationStatus,
  updateVehicleConditionReport,
  uploadHandoverPhoto,
} from "@/services/enhancedHandoverService";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/utils/toast-utils";
import { compressImage } from "@/utils/imageCompression";

jest.mock("@/integrations/supabase/client", () => ({
  supabase: {
    auth: { getUser: jest.fn() },
    from: jest.fn(),
    rpc: jest.fn(),
    storage: { from: jest.fn() },
  },
}));

jest.mock("@/utils/toast-utils", () => ({
  toast: {
    error: jest.fn(),
    info: jest.fn(),
    success: jest.fn(),
  },
}));

jest.mock("@/utils/imageCompression", () => ({
  compressImage: jest.fn(),
  formatFileSize: jest.fn((size: number) => `${size} B`),
  isImageFile: jest.fn((file: File) => file.type.startsWith("image/")),
}));

const makeUser = (id = "user-1") => {
  (supabase.auth.getUser as jest.Mock).mockResolvedValue({ data: { user: { id } } });
};

const selectEqQuery = (response: unknown) => ({
  select: jest.fn().mockReturnValue({
    eq: jest.fn().mockResolvedValue(response),
  }),
});

const insertSelectSingleQuery = (response: unknown) => ({
  insert: jest.fn().mockReturnValue({
    select: jest.fn().mockReturnValue({
      single: jest.fn().mockResolvedValue(response),
    }),
  }),
});

describe("enhancedHandoverService coverage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, "error").mockImplementation(() => undefined);
    jest.spyOn(console, "warn").mockImplementation(() => undefined);
    jest.spyOn(console, "log").mockImplementation(() => undefined);
    jest.useFakeTimers();
    jest.setSystemTime(new Date("2026-05-12T08:00:00.000Z"));
  });

  afterEach(() => {
    jest.useRealTimers();
    (console.error as jest.Mock).mockRestore();
    (console.warn as jest.Mock).mockRestore();
    (console.log as jest.Mock).mockRestore();
  });

  it("initializes default handover steps when none exist", async () => {
    const insert = jest.fn().mockResolvedValue({ error: null });
    (supabase.from as jest.Mock)
      .mockReturnValueOnce(selectEqQuery({ data: [], error: null }))
      .mockReturnValueOnce({ insert });

    await expect(initializeHandoverSteps("session-1")).resolves.toBe(true);

    expect(insert).toHaveBeenCalledWith(
      HANDOVER_STEPS.map((step) => ({
        handover_session_id: "session-1",
        step_name: step.name,
        step_order: step.order,
        step_owner: step.owner,
        is_completed: false,
      })),
    );
  });

  it("returns existing ordered handover steps and skips duplicate initialization", async () => {
    const existing = [{ id: "step-1", step_order: 1 }];
    const order = jest.fn().mockResolvedValue({ data: existing, error: null });
    const eq = jest.fn().mockReturnValue({ order });

    (supabase.from as jest.Mock)
      .mockReturnValueOnce(selectEqQuery({ data: existing, error: null }))
      .mockReturnValueOnce({ select: jest.fn().mockReturnValue({ eq }) });

    await expect(initializeHandoverSteps("session-2")).resolves.toBe(true);
    await expect(getHandoverSteps("session-2")).resolves.toEqual(existing);

    expect(order).toHaveBeenCalledWith("step_order");
  });

  it("validates required completion data before calling the handover RPC", async () => {
    makeUser();

    await expect(completeHandoverStep("session-3", "location_selection", "host", {
      latitude: -24.6,
    })).resolves.toBe(false);

    expect(supabase.rpc).not.toHaveBeenCalled();
    expect(toast.error).toHaveBeenCalledWith("Location coordinates and address are required");
  });

  it("completes a valid step through the advance RPC", async () => {
    makeUser("host-1");
    (supabase.rpc as jest.Mock).mockResolvedValue({ data: { success: true }, error: null });

    await expect(completeHandoverStep("session-4", "location_selection", "host", {
      latitude: -24.6282,
      longitude: 25.9231,
      address: "Gaborone CBD",
    })).resolves.toBe(true);

    expect(supabase.rpc).toHaveBeenCalledWith("advance_handover_step", {
      p_session_id: "session-4",
      p_completed_step_name: "location_selection",
      p_user_id: "host-1",
      p_user_role: "host",
      p_completion_data: {
        latitude: -24.6282,
        longitude: 25.9231,
        address: "Gaborone CBD",
      },
    });
    expect(toast.success).toHaveBeenCalledWith("location selection completed");
  });

  it("uploads a handover photo and reports progress", async () => {
    makeUser("renter-1");
    const progress = jest.fn();
    const file = new File(["image"], "handover.jpg", { type: "image/jpeg" });
    const upload = jest.fn().mockResolvedValue({ error: null });
    const getPublicUrl = jest.fn().mockReturnValue({ data: { publicUrl: "https://cdn.example/handover.jpg" } });
    (supabase.storage.from as jest.Mock).mockReturnValue({ upload, getPublicUrl });

    await expect(uploadHandoverPhoto(file, "session-5", "front", 1, progress)).resolves.toBe(
      "https://cdn.example/handover.jpg",
    );

    expect(upload).toHaveBeenCalledWith(
      expect.stringMatching(/^renter-1\/session-5\/front_\d+\.jpg$/),
      file,
    );
    expect(progress.mock.calls.map(([value]) => value)).toEqual([10, 30, 50, 80, 100]);
    expect(toast.success).toHaveBeenCalledWith("Photo uploaded successfully (5 B)");
  });

  it("compresses large images before upload", async () => {
    makeUser("renter-2");
    const original = new File([new Uint8Array(600 * 1024)], "large.jpg", { type: "image/jpeg" });
    const compressed = new File(["small"], "large.jpg", { type: "image/jpeg" });
    (compressImage as jest.Mock).mockResolvedValue(compressed);
    (supabase.storage.from as jest.Mock).mockReturnValue({
      upload: jest.fn().mockResolvedValue({ error: null }),
      getPublicUrl: jest.fn().mockReturnValue({ data: { publicUrl: "https://cdn.example/small.jpg" } }),
    });

    await expect(uploadHandoverPhoto(original, "session-6", "dashboard", 1)).resolves.toBe(
      "https://cdn.example/small.jpg",
    );

    expect(compressImage).toHaveBeenCalledWith(original, expect.objectContaining({ maxWidth: 1920 }));
    expect(toast.success).toHaveBeenCalledWith(expect.stringMatching(/^Image optimized:/));
  });

  it("creates, updates, and reads vehicle condition reports", async () => {
    makeUser("reporter-1");
    const created = { id: "report-1", vehicle_photos: "[]", damage_reports: "[]" };
    const updateEq = jest.fn().mockResolvedValue({ error: null });
    const update = jest.fn().mockReturnValue({ eq: updateEq });

    (supabase.from as jest.Mock)
      .mockReturnValueOnce(insertSelectSingleQuery({ data: created, error: null }))
      .mockReturnValueOnce({ update })
      .mockReturnValueOnce(selectEqQuery({
        data: [{ id: "report-1", vehicle_photos: "[]", damage_reports: "[{\"id\":\"damage-1\"}]" }],
        error: null,
      }));

    await expect(createVehicleConditionReport({
      handover_session_id: "session-7",
      booking_id: "booking-1",
      car_id: "car-1",
      report_type: "pickup",
      vehicle_photos: [],
      damage_reports: [],
      is_acknowledged: true,
    })).resolves.toEqual(created);

    await expect(updateVehicleConditionReport("report-1", {
      vehicle_photos: [],
      damage_reports: [],
      additional_notes: "clean",
    })).resolves.toBe(true);

    await expect(getVehicleConditionReports("session-7")).resolves.toEqual([
      { id: "report-1", vehicle_photos: [], damage_reports: [{ id: "damage-1" }] },
    ]);

    expect(update).toHaveBeenCalledWith(expect.objectContaining({
      vehicle_photos: "[]",
      damage_reports: "[]",
      additional_notes: "clean",
    }));
    expect(updateEq).toHaveBeenCalledWith("id", "report-1");
  });

  it("creates and updates identity verification checks", async () => {
    makeUser("verifier-1");
    const updateEq = jest.fn().mockResolvedValue({ error: null });
    const update = jest.fn().mockReturnValue({ eq: updateEq });
    const checks = [{ id: "check-1", verification_status: "verified" }];

    (supabase.from as jest.Mock)
      .mockReturnValueOnce(insertSelectSingleQuery({ data: { id: "check-1" }, error: null }))
      .mockReturnValueOnce({ update })
      .mockReturnValueOnce(selectEqQuery({ data: checks, error: null }));

    await expect(createIdentityVerificationCheck({
      handover_session_id: "session-8",
      verifier_id: "ignored",
      verified_user_id: "renter-1",
      verification_status: "pending",
    })).resolves.toEqual({ id: "check-1" });

    await expect(updateIdentityVerificationStatus("check-1", "verified", "license matches")).resolves.toBe(true);
    await expect(getIdentityVerificationChecks("session-8")).resolves.toEqual(checks);

    expect(update).toHaveBeenCalledWith({
      verification_status: "verified",
      verification_notes: "license matches",
      verified_at: "2026-05-12T08:00:00.000Z",
    });
    expect(updateEq).toHaveBeenCalledWith("id", "check-1");
  });
});

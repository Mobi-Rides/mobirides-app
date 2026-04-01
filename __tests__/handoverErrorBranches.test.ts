import {
  createPickupHandoverSession,
  createReturnHandoverSession,
  getHandoverSession,
  getLatestHandoverSession,
  hasCompletedPickupHandover,
  completeHandover,
} from "../src/services/handoverService";

jest.mock("@/utils/toast-utils", () => ({
  toast: {
    error: jest.fn(),
    success: jest.fn(),
    info: jest.fn(),
  },
}));

const createMockChain = (data: any = null, error: any = null) => {
  const chain: any = {
    select: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    order: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    single: jest.fn().mockResolvedValue({ data, error }),
    maybeSingle: jest.fn().mockResolvedValue({ data, error }),
    then: (onFulfilled: (value: { data: any; error: any }) => unknown) =>
      Promise.resolve({ data, error }).then(onFulfilled),
  };

  return chain;
};

jest.mock("@/integrations/supabase/client", () => ({
  supabase: {
    from: jest.fn(),
    auth: {
      getUser: jest.fn(),
    },
    rpc: jest.fn(),
    channel: jest.fn(),
  },
}));

import { supabase } from "@/integrations/supabase/client";

describe("handover error branches", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (supabase.auth.getUser as jest.Mock).mockResolvedValue({
      data: { user: { id: "host-1" } },
      error: null,
    });
  });

  it("throws not-found foreign key error for pickup create", async () => {
    (supabase.from as jest.Mock)
      .mockReturnValueOnce(createMockChain(null))
      .mockReturnValueOnce(createMockChain(null, { code: "23503", message: "fk fail" }));

    await expect(
      createPickupHandoverSession({ booking_id: "b1", host_id: "h1", renter_id: "r1" }),
    ).rejects.toThrow("record not found");
  });

  it("handles return create unique violation by fetching existing session", async () => {
    const existing = { id: "return-existing", booking_id: "b2", handover_type: "return" };

    (supabase.from as jest.Mock)
      .mockReturnValueOnce(createMockChain(null))
      .mockReturnValueOnce(createMockChain(null, { code: "23505", message: "duplicate" }))
      .mockReturnValueOnce(createMockChain(existing));

    const result = await createReturnHandoverSession({ booking_id: "b2", host_id: "h2", renter_id: "r2" });
    expect(result.id).toBe("return-existing");
  });

  it("returns null for getHandoverSession/getLatest on query errors", async () => {
    (supabase.from as jest.Mock)
      .mockReturnValueOnce(createMockChain(null, new Error("fetch failed")))
      .mockReturnValueOnce(createMockChain(null, new Error("fetch latest failed")));

    await expect(getHandoverSession("booking-err")).resolves.toBeNull();
    await expect(getLatestHandoverSession("booking-err")).resolves.toBeNull();
  });

  it("returns false for hasCompletedPickupHandover on error", async () => {
    (supabase.from as jest.Mock).mockReturnValue(createMockChain(null, new Error("query failed")));
    await expect(hasCompletedPickupHandover("booking-err")).resolves.toBe(false);
  });

  it("returns false when completeHandover update fails", async () => {
    (supabase.from as jest.Mock)
      .mockReturnValueOnce(createMockChain({ booking_id: "b9", handover_type: "pickup" }, null))
      .mockReturnValueOnce(createMockChain(null, new Error("update failed")));

    await expect(completeHandover("handover-fail")).resolves.toBe(false);
  });
});
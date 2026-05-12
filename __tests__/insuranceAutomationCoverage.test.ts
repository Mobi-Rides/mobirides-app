import { InsuranceAutomationService } from "@/services/insurance/automationService";
import { InsuranceService } from "@/services/insuranceService";
import { supabase } from "@/integrations/supabase/client";

jest.mock("@/integrations/supabase/client", () => ({
  supabase: {
    from: jest.fn(),
  },
}));

jest.mock("@/services/insuranceService", () => ({
  InsuranceService: {
    logClaimActivity: jest.fn(),
  },
}));

const selectQuery = (response: unknown) => ({
  select: jest.fn().mockReturnValue({
    eq: jest.fn().mockReturnValue({
      lt: jest.fn().mockReturnValue({
        limit: jest.fn().mockResolvedValue(response),
      }),
    }),
  }),
});

const updateQuery = (response: unknown) => ({
  update: jest.fn().mockReturnValue({
    eq: jest.fn().mockResolvedValue(response),
  }),
});

describe("InsuranceAutomationService coverage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, "log").mockImplementation(() => undefined);
    jest.spyOn(console, "error").mockImplementation(() => undefined);
  });

  afterEach(() => {
    (console.log as jest.Mock).mockRestore();
    (console.error as jest.Mock).mockRestore();
  });

  it("expires active policies and counts per-row update failures", async () => {
    (supabase.from as jest.Mock)
      .mockReturnValueOnce(selectQuery({
        data: [{ id: "policy-1" }, { id: "policy-2" }],
        error: null,
      }))
      .mockReturnValueOnce(updateQuery({ error: null }))
      .mockReturnValueOnce(updateQuery({ error: { message: "update failed" } }));

    await expect(InsuranceAutomationService.checkPolicyExpirations()).resolves.toEqual({
      processed: 1,
      errors: 1,
    });
  });

  it("returns zero when no expired policies or eligible claims exist", async () => {
    (supabase.from as jest.Mock)
      .mockReturnValueOnce(selectQuery({ data: [], error: null }))
      .mockReturnValueOnce(selectQuery({ data: [], error: null }));

    await expect(InsuranceAutomationService.checkPolicyExpirations()).resolves.toEqual({ processed: 0, errors: 0 });
    await expect(InsuranceAutomationService.autoProcessSmallClaims()).resolves.toEqual({ processed: 0, errors: 0 });
  });

  it("auto-approves small claims and records row failures", async () => {
    (InsuranceService.logClaimActivity as jest.Mock).mockResolvedValue(undefined);
    (supabase.from as jest.Mock)
      .mockReturnValueOnce(selectQuery({
        data: [
          { id: "claim-1", claim_number: "CLM-001", estimated_damage_cost: 200 },
          { id: "claim-2", claim_number: "CLM-002", estimated_damage_cost: 300 },
        ],
        error: null,
      }))
      .mockReturnValueOnce(updateQuery({ error: null }))
      .mockReturnValueOnce(updateQuery({ error: { message: "claim update failed" } }));

    await expect(InsuranceAutomationService.autoProcessSmallClaims(500)).resolves.toEqual({
      processed: 1,
      errors: 1,
    });

    expect(InsuranceService.logClaimActivity).toHaveBeenCalledWith(
      "claim-1",
      "approved",
      "Auto-approved by system (Low Value < P500)",
      undefined,
      { auto_approval: true },
    );
  });

  it("handles top-level query errors without throwing", async () => {
    (supabase.from as jest.Mock)
      .mockReturnValueOnce(selectQuery({ data: null, error: { message: "policy query failed" } }))
      .mockReturnValueOnce(selectQuery({ data: null, error: { message: "claim query failed" } }));

    await expect(InsuranceAutomationService.checkPolicyExpirations()).resolves.toEqual({ processed: 0, errors: 0 });
    await expect(InsuranceAutomationService.autoProcessSmallClaims()).resolves.toEqual({ processed: 0, errors: 0 });
  });
});

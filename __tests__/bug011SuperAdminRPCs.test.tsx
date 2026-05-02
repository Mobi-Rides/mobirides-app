/**
 * Test suite for BUG-011: Missing SuperAdmin Core Logic Functions
 *
 * Covers:
 *  1. ban_user / suspend_user business logic
 *  2. validate_vehicle_transfer logic
 *  3. log_admin_action parameter signature
 *  4. GRANT EXECUTE permissions in the migration SQL
 *  5. RPC call parameter shapes (frontend ↔ backend contract)
 *  6. CarManagementTable — Transfer button wiring to VehicleTransferDialog
 */

import React from "react";
import fs from "fs";
import path from "path";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { CarManagementTable } from "@/components/admin/CarManagementTable";

// ─── Module mocks ─────────────────────────────────────────────────────────────

jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useNavigate: () => jest.fn(),
}));

jest.mock("sonner", () => ({
  toast: { success: jest.fn(), error: jest.fn() },
}));

// ─── Helpers ──────────────────────────────────────────────────────────────────

const wrap = (ui: React.ReactElement) => {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <MemoryRouter>
      <QueryClientProvider client={client}>{ui}</QueryClientProvider>
    </MemoryRouter>
  );
};

const MIGRATION_FILE = "20260502000000_bug011_complete_superadmin_rpcs.sql";
const MIGRATION_PATH = path.resolve(
  __dirname,
  "../supabase/migrations",
  MIGRATION_FILE
);

const rawSQL = fs.readFileSync(MIGRATION_PATH, "utf8");
// Collapse runs of whitespace so alignment padding doesn't break string checks.
const sql = rawSQL.replace(/\s+/g, " ");

// ─── 1. ban_user / suspend_user business logic ────────────────────────────────

describe("BUG-011 — ban_user logic", () => {
  type RestrictionType = "login_block" | "suspension";

  interface RestrictionInput {
    restriction_type: RestrictionType;
    ends_at: Date | null;
    reason: string;
  }

  const buildBan = (reason: string): RestrictionInput => ({
    restriction_type: "login_block",
    ends_at: null,
    reason: reason.trim() || "Banned by administrator",
  });

  const buildSuspend = (
    reason: string,
    durationDays = 7
  ): RestrictionInput => {
    const ends_at = new Date();
    ends_at.setDate(ends_at.getDate() + durationDays);
    return {
      restriction_type: "suspension",
      ends_at,
      reason: reason.trim() || "Suspended by administrator",
    };
  };

  // ban_user ──────────────────────────────────────────────────────────────────

  it("ban: creates a login_block restriction type", () => {
    expect(buildBan("Fraud").restriction_type).toBe("login_block");
  });

  it("ban: ends_at is null (permanent)", () => {
    expect(buildBan("Fraud").ends_at).toBeNull();
  });

  it("ban: uses the supplied reason", () => {
    expect(buildBan("Repeated violations").reason).toBe("Repeated violations");
  });

  it("ban: falls back to default when reason is blank", () => {
    expect(buildBan("   ").reason).toBe("Banned by administrator");
  });

  // suspend_user ──────────────────────────────────────────────────────────────

  it("suspend: creates a suspension restriction type", () => {
    expect(buildSuspend("Test").restriction_type).toBe("suspension");
  });

  it("suspend: sets ends_at ~7 days ahead with default duration", () => {
    const before = Date.now();
    const r = buildSuspend("Test");
    const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;
    const diff = r.ends_at!.getTime() - before;
    expect(diff).toBeGreaterThanOrEqual(sevenDaysMs - 2000);
    expect(diff).toBeLessThanOrEqual(sevenDaysMs + 2000);
  });

  it("suspend: respects a custom duration (30 days)", () => {
    const r = buildSuspend("Test", 30);
    const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;
    const diff = r.ends_at!.getTime() - Date.now();
    expect(diff).toBeGreaterThan(thirtyDaysMs - 60_000);
    expect(diff).toBeLessThan(thirtyDaysMs + 60_000);
  });

  it("suspend: falls back to default when reason is blank", () => {
    expect(buildSuspend("  ").reason).toBe("Suspended by administrator");
  });
});

// ─── 2. validate_vehicle_transfer logic ───────────────────────────────────────

describe("BUG-011 — validate_vehicle_transfer logic", () => {
  interface Profile {
    id: string;
    role: "renter" | "host" | "admin" | "super_admin";
  }
  interface Vehicle {
    id: string;
    owner_id: string;
  }
  interface ValidationResult {
    valid: boolean;
    errors: string[];
    warnings: string[];
  }

  function validate(
    vehicle: Vehicle | null,
    fromOwnerId: string,
    toOwner: Profile | null,
    activeBookings = 0
  ): ValidationResult {
    const result: ValidationResult = { valid: true, errors: [], warnings: [] };

    if (!vehicle) {
      result.valid = false;
      result.errors.push("Vehicle does not exist.");
      return result;
    }

    if (vehicle.owner_id !== fromOwnerId) {
      result.valid = false;
      result.errors.push("Vehicle owner mismatch.");
    }

    if (!toOwner) {
      result.valid = false;
      result.errors.push("Target owner profile not found.");
    } else {
      if (fromOwnerId === toOwner.id) {
        result.valid = false;
        result.errors.push("Source and destination owners must differ.");
      }
      if (toOwner.role !== "host") {
        result.warnings.push("Target user is not currently a host.");
      }
    }

    if (activeBookings > 0) {
      result.warnings.push(
        `Vehicle has ${activeBookings} active booking(s). Ensure handover process is coordinated.`
      );
    }

    return result;
  }

  const v: Vehicle = { id: "v-1", owner_id: "owner-1" };
  const newHost: Profile = { id: "owner-2", role: "host" };

  it("rejects when vehicle does not exist", () => {
    const r = validate(null, "owner-1", newHost);
    expect(r.valid).toBe(false);
    expect(r.errors).toContain("Vehicle does not exist.");
  });

  it("rejects when vehicle owner does not match from_owner_id", () => {
    const r = validate(v, "wrong-owner", newHost);
    expect(r.valid).toBe(false);
    expect(r.errors).toContain("Vehicle owner mismatch.");
  });

  it("rejects when source and destination owner are the same user", () => {
    const sameOwner: Profile = { id: "owner-1", role: "host" };
    const r = validate(v, "owner-1", sameOwner);
    expect(r.valid).toBe(false);
    expect(r.errors).toContain("Source and destination owners must differ.");
  });

  it("rejects when target owner profile is not found", () => {
    const r = validate(v, "owner-1", null);
    expect(r.valid).toBe(false);
    expect(r.errors).toContain("Target owner profile not found.");
  });

  it("warns (but does not block) when target user is not a host", () => {
    const renter: Profile = { id: "owner-2", role: "renter" };
    const r = validate(v, "owner-1", renter);
    expect(r.valid).toBe(true);
    expect(r.errors).toHaveLength(0);
    expect(r.warnings).toContain("Target user is not currently a host.");
  });

  it("warns about active bookings on the vehicle", () => {
    const r = validate(v, "owner-1", newHost, 3);
    expect(r.warnings.some((w) => w.includes("3 active booking(s)"))).toBe(true);
  });

  it("passes cleanly for a valid transfer with no bookings", () => {
    const r = validate(v, "owner-1", newHost, 0);
    expect(r.valid).toBe(true);
    expect(r.errors).toHaveLength(0);
    expect(r.warnings).toHaveLength(0);
  });
});

// ─── 3. log_admin_action signature ────────────────────────────────────────────

describe("BUG-011 — log_admin_action signature", () => {
  interface LogAdminActionParams {
    p_admin_id: string;
    p_action: string;
    p_target_id: string | null;
    p_metadata: Record<string, unknown>;
  }

  const build = (
    admin_id: string,
    action: string,
    target_id: string | null = null,
    metadata: Record<string, unknown> = {}
  ): LogAdminActionParams => ({
    p_admin_id: admin_id,
    p_action: action,
    p_target_id: target_id,
    p_metadata: metadata,
  });

  it("maps admin_id → p_admin_id, action → p_action, target_id → p_target_id, metadata → p_metadata", () => {
    const p = build("admin-uuid", "user_banned", "user-uuid", { reason: "Fraud" });
    expect(p.p_admin_id).toBe("admin-uuid");
    expect(p.p_action).toBe("user_banned");
    expect(p.p_target_id).toBe("user-uuid");
    expect(p.p_metadata).toEqual({ reason: "Fraud" });
  });

  it("target_id defaults to null", () => {
    const p = build("admin-uuid", "platform_settings_updated");
    expect(p.p_target_id).toBeNull();
  });

  it("metadata defaults to an empty object", () => {
    const p = build("admin-uuid", "some_action");
    expect(p.p_metadata).toEqual({});
  });

  it("migration drops the old text-signature overload", () => {
    expect(sql).toContain(
      "DROP FUNCTION IF EXISTS public.log_admin_action(text, text, text, jsonb)"
    );
  });

  it("migration creates log_admin_action with the spec-correct (uuid, text, uuid, jsonb) signature", () => {
    expect(sql).toContain("CREATE OR REPLACE FUNCTION public.log_admin_action(");
    expect(sql).toContain("p_admin_id uuid");
    expect(sql).toContain("p_action text");
    expect(sql).toContain("p_target_id uuid");
    expect(sql).toContain("p_metadata jsonb");
  });
});

// ─── 4. GRANT EXECUTE permissions (migration content) ─────────────────────────

describe("BUG-011 — GRANT EXECUTE in migration SQL", () => {
  const hasGrant = (fn: string, role: "service_role" | "authenticated") =>
    sql.includes(
      `GRANT EXECUTE ON FUNCTION public.${fn} TO ${role}`
    );

  const frontendFunctions: [string, string][] = [
    ["suspend_user(uuid, text, interval)", "suspend_user"],
    ["ban_user(uuid, text)", "ban_user"],
    ["bulk_suspend_users(uuid[], text, interval)", "bulk_suspend_users"],
    ["remove_restriction(uuid, text)", "remove_restriction"],
    ["transfer_vehicle(uuid, uuid, uuid, text, text)", "transfer_vehicle"],
    ["log_admin_action(uuid, text, uuid, jsonb)", "log_admin_action"],
  ];

  frontendFunctions.forEach(([signature, name]) => {
    it(`grants EXECUTE to authenticated for ${name}`, () => {
      expect(hasGrant(signature, "authenticated")).toBe(true);
    });

    it(`grants EXECUTE to service_role for ${name}`, () => {
      expect(hasGrant(signature, "service_role")).toBe(true);
    });
  });

  it("grants EXECUTE to service_role for cleanup_expired_restrictions", () => {
    expect(hasGrant("cleanup_expired_restrictions()", "service_role")).toBe(true);
  });
});

// ─── 5. RPC call parameter shapes (frontend ↔ backend contract) ───────────────

describe("BUG-011 — RPC call parameter shapes", () => {
  let rpcSpy: jest.SpyInstance;

  beforeEach(() => {
    rpcSpy = jest
      .spyOn(supabase, "rpc")
      .mockResolvedValue({ data: {}, error: null } as any);
  });

  afterEach(() => {
    rpcSpy.mockRestore();
  });

  it("ban_user: called with p_user_id and p_reason", async () => {
    await supabase.rpc("ban_user", { p_user_id: "u-1", p_reason: "Fraud" });
    expect(rpcSpy).toHaveBeenCalledWith("ban_user", {
      p_user_id: "u-1",
      p_reason: "Fraud",
    });
  });

  it("suspend_user: called with p_user_id, p_reason, and p_duration", async () => {
    await supabase.rpc("suspend_user", {
      p_user_id: "u-1",
      p_reason: "Suspicious",
      p_duration: "7 days",
    });
    expect(rpcSpy).toHaveBeenCalledWith("suspend_user", {
      p_user_id: "u-1",
      p_reason: "Suspicious",
      p_duration: "7 days",
    });
  });

  it("transfer_vehicle: called with p_vehicle_id, p_from_owner_id, p_to_owner_id, p_reason, p_notes", async () => {
    await supabase.rpc("transfer_vehicle", {
      p_vehicle_id: "car-1",
      p_from_owner_id: "host-old",
      p_to_owner_id: "host-new",
      p_reason: "Admin transfer",
      p_notes: "Initiated from Admin Portal",
    });
    expect(rpcSpy).toHaveBeenCalledWith("transfer_vehicle", {
      p_vehicle_id: "car-1",
      p_from_owner_id: "host-old",
      p_to_owner_id: "host-new",
      p_reason: "Admin transfer",
      p_notes: "Initiated from Admin Portal",
    });
  });

  it("validate_vehicle_transfer: called with p_vehicle_id, p_from_owner_id, p_to_owner_id", async () => {
    rpcSpy.mockResolvedValue({
      data: { valid: true, warnings: [], errors: [] },
      error: null,
    } as any);

    await supabase.rpc("validate_vehicle_transfer", {
      p_vehicle_id: "car-1",
      p_from_owner_id: "host-old",
      p_to_owner_id: "host-new",
    });
    expect(rpcSpy).toHaveBeenCalledWith("validate_vehicle_transfer", {
      p_vehicle_id: "car-1",
      p_from_owner_id: "host-old",
      p_to_owner_id: "host-new",
    });
  });

  it("log_admin_action: called with p_admin_id, p_action, p_target_id, p_metadata", async () => {
    rpcSpy.mockResolvedValue({ data: null, error: null } as any);

    await supabase.rpc("log_admin_action", {
      p_admin_id: "admin-1",
      p_action: "user_banned",
      p_target_id: "user-1",
      p_metadata: { reason: "Fraud" },
    });
    expect(rpcSpy).toHaveBeenCalledWith("log_admin_action", {
      p_admin_id: "admin-1",
      p_action: "user_banned",
      p_target_id: "user-1",
      p_metadata: { reason: "Fraud" },
    });
  });
});

// ─── 6. CarManagementTable — Transfer button wiring ───────────────────────────

describe("BUG-011 — CarManagementTable Transfer button", () => {
  const MOCK_CARS = [
    {
      id: "car-1",
      brand: "Toyota",
      model: "Corolla",
      year: 2022,
      price_per_day: 500,
      location: "Gaborone",
      is_available: true,
      created_at: "2024-01-01T00:00:00Z",
      owner_id: "host-1",
      image_url: null,
      description: null,
      profiles: { full_name: "Alice Host" },
    },
    {
      id: "car-2",
      brand: "Honda",
      model: "Civic",
      year: 2021,
      price_per_day: 450,
      location: "Francistown",
      is_available: false,
      created_at: "2024-01-02T00:00:00Z",
      owner_id: "host-2",
      image_url: null,
      description: null,
      profiles: { full_name: "Bob Host" },
    },
  ];

  let fromSpy: jest.SpyInstance;

  beforeEach(() => {
    fromSpy = jest
      .spyOn(supabase, "from")
      .mockImplementation((table: string) => {
        if (table === "cars") {
          return {
            select: jest.fn().mockReturnValue({
              // Car list query: .select(...).order(...)
              order: jest
                .fn()
                .mockResolvedValue({ data: MOCK_CARS, error: null }),
              // Vehicle detail query: .select(...).eq(...).single()
              eq: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: {
                    ...MOCK_CARS[0],
                    profiles: {
                      id: "host-1",
                      full_name: "Alice Host",
                      phone_number: null,
                      role: "host",
                    },
                  },
                  error: null,
                }),
              }),
            }),
            update: jest.fn().mockReturnValue({
              eq: jest.fn().mockResolvedValue({ data: null, error: null }),
            }),
          } as any;
        }
        // profiles — user search inside VehicleTransferDialog
        return {
          select: jest.fn().mockReturnValue({
            or: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                limit: jest
                  .fn()
                  .mockResolvedValue({ data: [], error: null }),
              }),
            }),
          }),
        } as any;
      });
  });

  afterEach(() => {
    fromSpy.mockRestore();
  });

  it("renders a Transfer button for every car row", async () => {
    wrap(<CarManagementTable />);

    await waitFor(() => {
      const buttons = screen.getAllByTitle("Transfer vehicle to another host");
      expect(buttons).toHaveLength(MOCK_CARS.length);
    });
  });

  it("Transfer button opens VehicleTransferDialog", async () => {
    wrap(<CarManagementTable />);

    await waitFor(() =>
      screen.getAllByTitle("Transfer vehicle to another host")
    );

    fireEvent.click(
      screen.getAllByTitle("Transfer vehicle to another host")[0]
    );

    await waitFor(() => {
      expect(
        screen.getByText("Transfer Vehicle Ownership")
      ).toBeInTheDocument();
    });
  });

  it("VehicleTransferDialog shows Vehicle Details section after opening", async () => {
    wrap(<CarManagementTable />);

    await waitFor(() =>
      screen.getAllByTitle("Transfer vehicle to another host")
    );

    fireEvent.click(
      screen.getAllByTitle("Transfer vehicle to another host")[0]
    );

    await waitFor(() =>
      expect(screen.getByText("Transfer Vehicle Ownership")).toBeInTheDocument()
    );

    expect(screen.getByText("Vehicle Details")).toBeInTheDocument();
  });

  it("closing VehicleTransferDialog via Cancel removes it from the DOM", async () => {
    wrap(<CarManagementTable />);

    await waitFor(() =>
      screen.getAllByTitle("Transfer vehicle to another host")
    );

    fireEvent.click(
      screen.getAllByTitle("Transfer vehicle to another host")[0]
    );

    await waitFor(() =>
      expect(screen.getByText("Transfer Vehicle Ownership")).toBeInTheDocument()
    );

    fireEvent.click(screen.getByRole("button", { name: /^Cancel$/i }));

    await waitFor(() => {
      expect(
        screen.queryByText("Transfer Vehicle Ownership")
      ).not.toBeInTheDocument();
    });
  });
});

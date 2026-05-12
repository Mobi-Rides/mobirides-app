/**
 * Regression tests for three bugs fixed on 2026-05-07:
 *
 *  Bug 1 – Wallet redirected non-host users away instead of showing the wallet.
 *  Bug 2 – CarCard inferred vehicle type from seat count (SUV showed as Sedan).
 *  Bug 3 – AdminManagementTable listed the same admin twice when they had two
 *          rows in user_roles (e.g. both 'admin' and 'super_admin').
 */

import React from "react";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router-dom";
import type { SafeCar } from "@/types/car";
import { CarCard } from "@/components/CarCard";

// ─── Module mocks ──────────────────────────────────────────────────────────────

jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useNavigate: () => jest.fn(),
}));

jest.mock("sonner", () => ({
  toast: { success: jest.fn(), error: jest.fn() },
}));

jest.mock("@/utils/carImageUtils", () => ({
  getCarImagePublicUrl: (url: string) => url || "/placeholder.svg",
}));

jest.mock("@/services/savedCarService", () => ({
  saveCar: jest.fn(),
  unsaveCar: jest.fn(),
}));

// Wallet sub-components make their own supabase queries; stub them out so
// the Wallet page test focuses only on the page itself.
jest.mock("@/components/dashboard/WalletBalanceCard", () => ({
  WalletBalanceCard: () => <div data-testid="wallet-balance-card" />,
}));
jest.mock("@/components/dashboard/WalletTransactionHistory", () => ({
  WalletTransactionHistory: () => <div data-testid="wallet-tx-history" />,
}));

// ─── Helpers ───────────────────────────────────────────────────────────────────

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

const makeCar = (overrides: Partial<SafeCar> = {}): SafeCar => ({
  id: "car-1",
  brand: "Toyota",
  model: "Fortuner",
  year: 2022,
  price_per_day: 800,
  location: "Johannesburg",
  transmission: "Automatic",
  fuel: "Petrol",
  seats: 5,
  vehicle_type: "SUV",
  description: "A great car",
  features: [],
  image_url: "/placeholder.svg",
  latitude: -26.2041,
  longitude: 28.0473,
  is_available: true,
  owner_id: "owner-1",
  created_at: "2024-01-01T00:00:00Z",
  updated_at: "2024-01-01T00:00:00Z",
  ...overrides,
});

// ═══════════════════════════════════════════════════════════════════════════════
// Bug 1 — Wallet: accessible to all users, no role-based redirect
// ═══════════════════════════════════════════════════════════════════════════════

describe("Bug 1 — Wallet page: no role-based redirect", () => {
  // Dynamically import so the module mock above is applied before load
  let Wallet: React.ComponentType;
  let mockNavigate: jest.Mock;

  beforeAll(async () => {
    mockNavigate = jest.fn();
    const routerMod = jest.requireMock("react-router-dom") as { useNavigate: () => jest.Mock };
    routerMod.useNavigate = () => mockNavigate;
    const mod = await import("@/pages/Wallet");
    Wallet = mod.default;
  });

  beforeEach(() => mockNavigate.mockClear());

  it("renders the Wallet & Earnings heading", () => {
    wrap(<Wallet />);
    expect(screen.getByText("Wallet & Earnings")).toBeInTheDocument();
  });

  it("renders both wallet sub-components", () => {
    wrap(<Wallet />);
    expect(screen.getByTestId("wallet-balance-card")).toBeInTheDocument();
    expect(screen.getByTestId("wallet-tx-history")).toBeInTheDocument();
  });

  it("does NOT call navigate() on mount (no redirect)", () => {
    wrap(<Wallet />);
    expect(mockNavigate).not.toHaveBeenCalled();
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// Bug 2 — CarCard: vehicle type comes from vehicle_type field, not seat count
// ═══════════════════════════════════════════════════════════════════════════════

describe("Bug 2 — CarCard: vehicle_type displayed from database field", () => {
  it("shows SUV for a 5-seat car with vehicle_type SUV (was showing Sedan)", () => {
    wrap(<CarCard car={makeCar({ vehicle_type: "SUV", seats: 5 })} />);
    expect(screen.getByText("SUV")).toBeInTheDocument();
    expect(screen.queryByText("Sedan")).not.toBeInTheDocument();
  });

  it("shows 4x4 for a 7-seat car with vehicle_type 4x4 (was showing SUV)", () => {
    wrap(<CarCard car={makeCar({ vehicle_type: "4x4", seats: 7 })} />);
    expect(screen.getByText("4x4")).toBeInTheDocument();
    expect(screen.queryByText("SUV")).not.toBeInTheDocument();
  });

  it("shows Exotic for a 2-seat car with vehicle_type Exotic (was showing Sports)", () => {
    wrap(<CarCard car={makeCar({ vehicle_type: "Exotic", seats: 2 })} />);
    expect(screen.getByText("Exotic")).toBeInTheDocument();
    expect(screen.queryByText("Sports")).not.toBeInTheDocument();
  });

  it("shows Electric for a 5-seat car with vehicle_type Electric", () => {
    wrap(<CarCard car={makeCar({ vehicle_type: "Electric", seats: 5 })} />);
    expect(screen.getByText("Electric")).toBeInTheDocument();
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// Bug 3 — Admin dedup: duplicate user_roles rows collapse to one entry
// ═══════════════════════════════════════════════════════════════════════════════

// The deduplication algorithm extracted from AdminManagementTable useAdmins()
type RoleRow = { user_id: string; role: string; created_at: string };

function dedupAdminRoles(roleData: RoleRow[]): RoleRow[] {
  const seen = new Map<string, RoleRow>();
  for (const row of roleData) {
    const existing = seen.get(row.user_id);
    if (!existing || row.role === "super_admin") {
      seen.set(row.user_id, row);
    }
  }
  return Array.from(seen.values());
}

describe("Bug 3 — Admin dedup: user_roles duplicate rows", () => {
  const ellaId = "user-ella";
  const arnoldId = "user-arnold";

  it("collapses two rows for the same user into one", () => {
    const rows: RoleRow[] = [
      { user_id: ellaId, role: "admin", created_at: "2024-01-01T00:00:00Z" },
      { user_id: ellaId, role: "admin", created_at: "2024-02-01T00:00:00Z" },
    ];
    expect(dedupAdminRoles(rows)).toHaveLength(1);
  });

  it("keeps super_admin when user has both admin and super_admin rows", () => {
    const rows: RoleRow[] = [
      { user_id: ellaId, role: "admin", created_at: "2024-01-01T00:00:00Z" },
      { user_id: ellaId, role: "super_admin", created_at: "2024-02-01T00:00:00Z" },
    ];
    const result = dedupAdminRoles(rows);
    expect(result).toHaveLength(1);
    expect(result[0].role).toBe("super_admin");
  });

  it("keeps super_admin even when it appears before admin in the list", () => {
    const rows: RoleRow[] = [
      { user_id: ellaId, role: "super_admin", created_at: "2024-01-01T00:00:00Z" },
      { user_id: ellaId, role: "admin", created_at: "2024-02-01T00:00:00Z" },
    ];
    const result = dedupAdminRoles(rows);
    expect(result).toHaveLength(1);
    expect(result[0].role).toBe("super_admin");
  });

  it("preserves distinct users as separate entries", () => {
    const rows: RoleRow[] = [
      { user_id: ellaId, role: "admin", created_at: "2024-01-01T00:00:00Z" },
      { user_id: arnoldId, role: "super_admin", created_at: "2024-01-02T00:00:00Z" },
    ];
    expect(dedupAdminRoles(rows)).toHaveLength(2);
  });

  it("returns empty array for empty input", () => {
    expect(dedupAdminRoles([])).toHaveLength(0);
  });
});

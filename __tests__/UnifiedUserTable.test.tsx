import React from "react";
import { render, fireEvent, screen } from "@testing-library/react";
import '@testing-library/jest-dom';
import { UnifiedUserTable } from "../src/components/admin/UnifiedUserTable";
import * as exportUtils from "../src/utils/exportToCSV";
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

jest.mock("../src/hooks/useAdminUsersComplete", () => ({
  useAdminUsersComplete: () => ({
    data: globalThis.__MOCK_USERS__ || [],
    isLoading: false,
    error: null,
    refetch: jest.fn(),
  })
}));

const makeUsers = (count: number) => Array.from({ length: count }, (_, i) => ({
  id: `user-${i}`,
  full_name: `User ${i}`,
  email: `user${i}@test.com`,
  role: i % 2 === 0 ? "admin" : "host",
  user_roles: [i % 2 === 0 ? "admin" : "host"],
  verification_status: i % 3 === 0 ? "verified" : "pending",
  is_deleted: false,
  is_restricted: false,
  vehicles_count: i,
  bookings_count: i * 2,
  created_at: new Date(2023, 0, i + 1).toISOString(),
  phone_number: `+123456789${i}`,
}));

describe("UnifiedUserTable CSV Export", () => {
  it("exports all users (not just paginated) to CSV when >100 entries", () => {
    const users = makeUsers(120);
    globalThis.__MOCK_USERS__ = users;
    const onUserSelect = jest.fn();
    const onSelectAll = jest.fn();
    // Mock exportToCSV to capture arguments
    const exportSpy = jest.spyOn(exportUtils, "exportToCSV").mockImplementation(() => {});

    const queryClient = new QueryClient();
    render(
      <QueryClientProvider client={queryClient}>
        <UnifiedUserTable
          selectedUsers={[]}
          onUserSelect={onUserSelect}
          onSelectAll={onSelectAll}
        />
      </QueryClientProvider>
    );

    // Find and click the export button
    const exportBtn = screen.getByText(/Export CSV/i);
    fireEvent.click(exportBtn);

    expect(exportSpy).toHaveBeenCalled();
    const [rows, filename, columns] = exportSpy.mock.calls[0];
    expect(rows.length).toBe(120);
    expect(filename).toContain("users_export");
    expect(columns[0].key).toBe("name");
    exportSpy.mockRestore();
  });
});

describe("UnifiedUserTable Sorting & Filtering", () => {
  it("exports users in sorted order (by name)", () => {
    const users = [
      { id: "1", full_name: "Charlie", email: "c@test.com", role: "admin", user_roles: ["admin"], verification_status: "verified", is_deleted: false, is_restricted: false, vehicles_count: 1, bookings_count: 2, created_at: new Date(2023, 0, 3).toISOString(), phone_number: "+1" },
      { id: "2", full_name: "Alice", email: "a@test.com", role: "host", user_roles: ["host"], verification_status: "pending", is_deleted: false, is_restricted: false, vehicles_count: 2, bookings_count: 3, created_at: new Date(2023, 0, 1).toISOString(), phone_number: "+2" },
      { id: "3", full_name: "Bob", email: "b@test.com", role: "host", user_roles: ["host"], verification_status: "pending", is_deleted: false, is_restricted: false, vehicles_count: 3, bookings_count: 4, created_at: new Date(2023, 0, 2).toISOString(), phone_number: "+3" },
    ];
    globalThis.__MOCK_USERS__ = users;
    const onUserSelect = jest.fn();
    const onSelectAll = jest.fn();
    const exportSpy = jest.spyOn(exportUtils, "exportToCSV").mockImplementation(() => {});
    const queryClient = new QueryClient();
    render(
      <QueryClientProvider client={queryClient}>
        <UnifiedUserTable
          selectedUsers={[]}
          onUserSelect={onUserSelect}
          onSelectAll={onSelectAll}
        />
      </QueryClientProvider>
    );
    // Find all elements with 'User' and click the sortable header (should be the second one)
    const allUserHeaders = screen.getAllByText(/^User$/i);
    // Find the one that is inside a th (table header)
    const nameHeader = allUserHeaders.find(el => el.closest('th'));
    fireEvent.click(nameHeader!);
    // Click export
    const exportBtn = screen.getByText(/Export CSV/i);
    fireEvent.click(exportBtn);
    // The exported rows should be sorted by name ascending (Alice, Bob, Charlie)
    const [rows] = exportSpy.mock.calls[0];
    expect(rows[0].name).toBe("Alice");
    expect(rows[1].name).toBe("Bob");
    expect(rows[2].name).toBe("Charlie");
    exportSpy.mockRestore();
  });

  it("filters users by search term (email)", () => {
    const users = [
      { id: "1", full_name: "Charlie", email: "c@test.com", role: "admin", user_roles: ["admin"], verification_status: "verified", is_deleted: false, is_restricted: false, vehicles_count: 1, bookings_count: 2, created_at: new Date(2023, 0, 3).toISOString(), phone_number: "+1" },
      { id: "2", full_name: "Alice", email: "a@test.com", role: "host", user_roles: ["host"], verification_status: "pending", is_deleted: false, is_restricted: false, vehicles_count: 2, bookings_count: 3, created_at: new Date(2023, 0, 1).toISOString(), phone_number: "+2" },
      { id: "3", full_name: "Bob", email: "b@test.com", role: "host", user_roles: ["host"], verification_status: "pending", is_deleted: false, is_restricted: false, vehicles_count: 3, bookings_count: 4, created_at: new Date(2023, 0, 2).toISOString(), phone_number: "+3" },
    ];
    globalThis.__MOCK_USERS__ = users;
    const onUserSelect = jest.fn();
    const onSelectAll = jest.fn();
    const queryClient = new QueryClient();
    render(
      <QueryClientProvider client={queryClient}>
        <UnifiedUserTable
          selectedUsers={[]}
          onUserSelect={onUserSelect}
          onSelectAll={onSelectAll}
        />
      </QueryClientProvider>
    );
    // Enter search term for Bob's email
    const searchInput = screen.getByPlaceholderText(/search by name, email, role/i);
    fireEvent.change(searchInput, { target: { value: "b@test.com" } });
    // Only Bob should be visible
    expect(screen.getByText("Bob")).toBeInTheDocument();
    expect(screen.queryByText("Alice")).not.toBeInTheDocument();
    expect(screen.queryByText("Charlie")).not.toBeInTheDocument();
  });
});


# Monthly User Numbers Table — Admin Dashboard

## What We're Building

A standalone `MonthlyUserGrowthTable` component added to the Admin Dashboard showing real user sign-ups month by month from January 2025 to the current month, with test accounts and admin accounts excluded.

---

## Data Confirmed from the Database

The following real numbers are confirmed live from the DB (test accounts filtered by `full_name ILIKE '%test%'`, `'%dummy%'`, `'%tester%'` and `role NOT IN ('admin', 'super_admin')`):

| Month | New Users | Renters | Hosts | Cumulative Total |
|-------|-----------|---------|-------|-----------------|
| Jan 2025 | 5 | 1 | 4 | 5 |
| Feb 2025 | 3 | 3 | 0 | 8 |
| Mar 2025 | 6 | 5 | 1 | 14 |
| Apr 2025 | 21 | 20 | 1 | 35 |
| May 2025 | 41 | 39 | 2 | 76 |
| Jun 2025 | 18 | 14 | 4 | 94 |
| Jul 2025 | 5 | 5 | 0 | 99 |
| Aug 2025 | 6 | 6 | 0 | 105 |
| Sep 2025 | 11 | 11 | 0 | 116 |
| Oct 2025 | 3 | 3 | 0 | 119 |
| Nov 2025 | 7 | 7 | 0 | 126 |
| Dec 2025 | 8 | 8 | 0 | 134 |
| Jan 2026 | 20 | 19 | 1 | 154 |
| Feb 2026 | 7 | 7 | 0 | 161 |

---

## What Gets Excluded as "Test Accounts"

- `role IN ('admin', 'super_admin')` — platform staff
- `full_name ILIKE '%test%'` — e.g., "Test User", "Test Renter"
- `full_name ILIKE '%dummy%'` — e.g., "Dummy Account Loago"
- `full_name ILIKE '%tester%'` — e.g., "Admin Tester"

---

## Files to Create / Change

| File | Action |
|------|--------|
| `src/components/admin/MonthlyUserGrowthTable.tsx` | **Create** — new standalone component |
| `src/pages/admin/AdminDashboard.tsx` | **Edit** — add the table below AdminStats |

---

## Technical Details

### Component: `MonthlyUserGrowthTable`

Uses `useQuery` (TanStack React Query) to fetch monthly user data via Supabase RPC-style `select` with a date filter. The query mirrors the verified SQL:

```typescript
const { data } = await supabase
  .from("profiles")
  .select("created_at, role")
  .gte("created_at", "2025-01-01")
  .not("role", "in", "(admin,super_admin)")
  .not("full_name", "ilike", "%test%")  // chained filters
  .not("full_name", "ilike", "%dummy%")
  .not("full_name", "ilike", "%tester%");
```

The component then groups returned rows client-side by `DATE_TRUNC('month', created_at)` to produce per-month counts for:
- **New Users** (total that month)
- **Renters** (role = 'renter')
- **Hosts** (role = 'host')
- **Cumulative Total** (running sum)
- **MoM Change** (month-over-month growth, shown as +/- with colour coding: green for growth, red for decline)

### Table Columns

| # | Column | Description |
|---|--------|-------------|
| 1 | Month | "Jan 2025", "Feb 2025" ... |
| 2 | New Users | Total signups that month (excl. test) |
| 3 | Renters | Renter-role signups |
| 4 | Hosts | Host-role signups |
| 5 | MoM Change | e.g. `+16 ↑` or `-3 ↓` vs previous month |
| 6 | Cumulative Total | Running total since Jan 2025 |

### Dashboard Placement

Placed between `AdminStats` and the Analytics Dashboard section so it's immediately visible on page load. It uses the existing `Card` + `Table` components for visual consistency with the rest of the portal. Most-recent month at the top (descending order). No pagination needed (max 24 rows per 2 years).

### No Migration Required

This is purely a read operation on the existing `profiles` table. No schema changes are needed.

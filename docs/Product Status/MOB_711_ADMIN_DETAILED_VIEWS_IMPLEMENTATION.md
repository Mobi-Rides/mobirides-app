# Jira Implementation Plan: Admin Portal Detailed Views

## Ticket Details
**Ticket ID:** MOB-711
**Type:** Enhancement / Feature
**Assignee:** Arnold (Snr Engineer)
**Status:** TODO
**Priority:** High (P1)
**Epic:** Admin Portal Overhaul
**Sprint:** Sprint 10

## Describe the Issue (User Story)
**As an Admin**, I need to be able to click an explicit "View Details" icon (`<Eye />`) on major tables (Bookings, Withdrawals, Messages, etc.) without entering an edit interface or relying strictly on aggregated inline info.
**So that** I can securely audit deep relationship data (like specific payout destinations or precise routing coordinates) before taking destructive actions or approvals.

## Acceptance Criteria
- [ ] **BookingManagementTable:** Add an `<Eye />` icon to the Actions column that opens a `BookingDetailsDialog` (displaying detailed cost breakdown, mapped route summary, and host/renter summary).
- [ ] **WithdrawalRequestsTable:** Add an `<Eye />` icon that opens a `PayoutDetailsDialog` (displaying target bank/mobile money info, linked earning transactions, and user wallet summary).
- [ ] **InsuranceRemittanceTable:** Add an `<Eye />` icon that opens an `InsuranceCoverageDialog` (displaying all specific bookings covered under that remittance block).
- [ ] **MessageManagementTable:** Add an `<Eye />` icon that opens a `MessageThreadViewer` (showing full thread history and user contact context).
- [ ] **CarManagementTable:** Add an `<Eye />` icon alongside the existing Edit icon to view a read-only preview of the public vehicle listing.
- [ ] **TransactionLedgerTable / RecentTransactionsTable:** Add an `<Eye />` icon to open the existing `TransactionJourneyDialog`.

## Technical Implementation Steps

### Phase 1: Reusable Dialog Foundations
1. Ensure `Dialog`, `DialogContent`, `DialogHeader`, `DialogTitle` are imported from `@/components/ui/dialog`.
2. Import the `Eye` icon from `lucide-react` across the 6 target tables.

### Phase 2: Booking Management Update
1. Create `components/admin/BookingDetailsDialog.tsx` that accepts a `bookingId`.
2. Fetch `bookings` joined with `cars`, `profiles`, and `payment_transactions`.
3. In `BookingManagementTable.tsx`, add an `Eye` icon action button that sets `selectedBookingId` and opens the modal.

### Phase 3: Finance Tables Update
1. **Withdrawals:** Create `PayoutDetailsDialog.tsx` showing `wallet_transactions` grouped by status. Add `Eye` icon to `WithdrawalRequestsTable`.
2. **Insurance:** Create `InsuranceCoverageDialog.tsx` showing related `bookings`. Add `Eye` button to `InsuranceRemittanceTable`.

### Phase 4: UI/UX Standardization
1. **Car Management:** Wrap the specific car data in a read-only `CarPreviewDialog`.
2. **Messages:** Ensure full text scaling and conversation flow in `MessageThreadViewer`.
3. **Ledgers:** Hook up `TransactionJourneyDialog.tsx` to the general ledger tables utilizing existing patterns from `PaymentTransactionsTable`.

## Definition of Done (DoD)
- All 6 target tables contain an `<Eye />` action icon in the final column.
- Clicking the `<Eye />` icon consistently opens a read-only detailed modal or slide-over.
- Code passes ESLint with no unused lucide-react imports.
- Dialogs perform optimized data fetching with `react-query` using proper Supabase joins.

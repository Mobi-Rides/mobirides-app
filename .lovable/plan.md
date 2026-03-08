

## Next Critical Fix Assessment

Based on the Admin Portal Hotfix plan (`HOTFIX_ADMIN_PORTAL_2026_02_24.md`), here is the current state:

### Completed (12 of 26 tickets done)
MOB-101, 102, 114, 115, 116, 118, 119, 120, 123, 124, 125 -- all resolved.

### Remaining P0 (Build-Blocking) -- Do These First

| Order | Ticket | Description | Effort |
|-------|--------|-------------|--------|
| 1 | **MOB-126** | Fix `BookingDialog` + `RenterPaymentModal` TS2739 -- missing `base_price` and `total_multiplier` in `PricingCalculation` objects | XS (15 min) |
| 2 | **MOB-103** | Fix `CarVerificationTable` -- rows render outside `<Table>` DOM structure in full mode; hardcoded `.limit(10)` blocks pagination | S (1 hr) |

### Remaining P1 (High Priority) -- Next After P0

| Order | Ticket | Description | Effort |
|-------|--------|-------------|--------|
| 3 | **MOB-111** | Fix `get_admin_users_complete` RPC -- `is_restricted` ignores `active = true` check (migration) | XS |
| 4 | **MOB-107** | Deploy `bulk-delete-users` edge function (currently 404) | XS |
| 5 | **MOB-105** | Add auth verification to `assign-role` / `bulk-assign-role` (security vulnerability) | M |
| 6 | **MOB-106** | Fix role INSERT → UPSERT for duplicate handling | XS |
| 7 | **MOB-104** | Fix `UserEditDialog` to sync `user_roles` table alongside `profiles.role` | S |
| 8 | **MOB-121** | Migrate remaining avatar consumers to `getAvatarPublicUrl` utility | M |
| 9 | **MOB-110** | Fix `delete-user-with-transfer` FK coverage (20+ missing tables) | L (3-4 hrs) |

### Recommendation

**Start with MOB-126** -- it is a P0 build-blocking error that takes ~15 minutes. It just requires adding two missing properties (`base_price`, `total_multiplier`) to inline `PricingCalculation` objects in `BookingDialog.tsx` and `RenterPaymentModal.tsx`.

Then move to **MOB-103** (car verification table structure fix).

After the two P0s are clear, tackle the P1 security cluster (MOB-105, 106, 104) since those represent privilege escalation risks.


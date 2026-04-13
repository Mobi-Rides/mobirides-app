# Schema Audit Findings — 24 March 2026

**Branch:** fix/f4-f5-handover-booking-status-transitions  
**Audited via:** `npx supabase db dump --local`

---

## ✅ Confirmed Healthy

| Area | Detail |
|------|--------|
| `booking_status` enum | All 6 values present: `pending`, `awaiting_payment`, `confirmed`, `in_progress`, `completed`, `cancelled` |
| `bookings` columns | `payment_status`, `payment_deadline`, `payment_transaction_id`, `actual_end_date` all migrated |
| `host_wallets` | `pending_balance` and `balance` correctly separated |
| `payment_transactions` | Fully migrated with all expected columns |
| `release_pending_earnings()` | Correct: moves `pending_balance → balance`, creates `earnings_released` wallet transaction, guards against non-completed status |
| `credit_pending_earnings()` | Present and callable |
| `process_due_earnings_releases()` | Scheduled fallback — catches completed bookings with unreleased earnings after 24h buffer |

---

## ⚠️ Issue 1 — Duplicate Booking Status Trigger (DOCUMENTED, NOT FIXED)

**Severity:** Medium — causes double notifications on every booking INSERT/UPDATE  
**Decision:** Leave as-is for now; fix in a dedicated cleanup migration.

Two triggers on `public.bookings` both call `handle_booking_status_change()`:

```sql
-- Trigger 1
CREATE OR REPLACE TRIGGER "booking_status_change_trigger"
AFTER INSERT OR UPDATE ON "public"."bookings"
FOR EACH ROW EXECUTE FUNCTION "public"."handle_booking_status_change"();

-- Trigger 2 (duplicate)
CREATE OR REPLACE TRIGGER "trigger_handle_booking_status_change"
AFTER INSERT OR UPDATE ON "public"."bookings"
FOR EACH ROW EXECUTE FUNCTION "public"."handle_booking_status_change"();
```

**Effect:** Every `booking_confirmed`, `booking_cancelled`, and `booking_request` notification is created twice.  
**Fix when ready:** Drop one trigger, e.g. `DROP TRIGGER booking_status_change_trigger ON public.bookings;`

---

## 🔴 Issue 2 — `handle_booking_status_change` Missing `completed` Case (FIXED)

**Severity:** Critical — `release_pending_earnings()` was never called from the DB layer.  
**Fix:** Migration `20260324000100_fix_booking_completed_trigger.sql` — adds `completed` case to the trigger function.

The trigger only handled:
- `pending → confirmed` → send `booking_confirmed` notification
- `pending/confirmed → cancelled` → send `booking_cancelled` notification  
- `INSERT` with `pending` → send `booking_request` notification

It did **not** handle `→ completed`, meaning `release_pending_earnings()` was never called from the DB side. The system was entirely dependent on the frontend calling it, which was also broken in `EnhancedHandoverSheet.tsx` and `ResizableHandoverTray.tsx` (see F4/F5 in `20260323_PAYMENT_PRODUCTION_READINESS_PLAN.md`).

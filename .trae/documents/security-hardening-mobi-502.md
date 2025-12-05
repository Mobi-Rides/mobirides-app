# MOBI-502 — Security Vulnerabilities 5–8 Fix: Implementation Notes

Release: v2.4.0
Owner: Arnold
Status: Applied and verified on connected Supabase project

## Scope
- Storage RLS recursion fix for verification buckets
- Wallet security hardening (owner updates removed; admin visibility added)
- Audit logs access secured behind uniform admin check
- Message encryption foundation (pgcrypto + helpers)

## Changes
- Storage
  - Policy: `verification_admin_read_all` now uses `public.is_admin()` (SECURITY DEFINER, non-recursive)
  - Per-user folder policies preserved for `verification-*` buckets
- Wallets
  - `host_wallets`: owner UPDATE removed; owners retain SELECT; admin SELECT via `public.is_admin()`
  - `wallet_transactions`: admin SELECT added; service_role manages ALL
  - Introduced secure RPCs for host-initiated balance changes:
    - `public.wallet_topup(amount, method, reference)`
    - `public.wallet_withdraw(amount, description)`
    - Both validate auth, update balance, insert transaction rows, and log audit events
- Audit Logs
  - Read policy unified to `public.is_admin()`
- Encryption
  - Enabled `pgcrypto`
  - Added `get_encryption_key()` (reads `app.encryption_key`)
  - Added `encrypt_message_content(text)` / `decrypt_message_content(bytea)` helpers

## Verification
- RLS matrix (authenticated renter/host/admin/anon) for storage, wallets, audit logs
- Successful RPC flows: top-up and withdrawal return JSON `{ success, balance, transaction_id }`
- No recursion observed; admin checks centralized; encryption functions available

## Rollback
- Drop new policies and recreate previous versions if required
- Revoke RPCs from `authenticated` and remove functions
- Disable `pgcrypto` only if not used elsewhere

## Follow-ups
- Migrate messaging to encrypted columns + RPC-only inserts
- Refactor remaining wallet mutation paths to use RPC/service-role consistently

## File References
- `supabase/migrations/20251201140303_fix_storage_rls.sql`
- `supabase/migrations/20251201140403_harden_wallet_security.sql`
- `supabase/migrations/20251201140503_secure_admin_logs.sql`
- `supabase/migrations/20251201140533_enforce_message_encryption.sql`
- `supabase/migrations/20251201141003_wallet_adjustment_rpc.sql`

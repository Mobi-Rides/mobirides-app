

## Remaining P1 Tickets — Summary

From the hotfix plan (lines 745-774), there are **8 open P1 tickets** remaining:

| # | Ticket | Description | Effort | Type |
|---|--------|-------------|--------|------|
| 1 | **MOB-111** | Fix `get_admin_users_complete` RPC — `is_restricted` subquery ignores `active = true` | XS | Migration |
| 2 | **MOB-105** | Add auth + admin verification to `assign-role` and `bulk-assign-role` edge functions (security vulnerability — any user can escalate privileges) | M | Edge Function |
| 3 | **MOB-106** | Change role assignment from INSERT to UPSERT — currently throws on duplicate roles | XS | Edge Function |
| 4 | **MOB-104** | `UserEditDialog` updates `profiles.role` but skips `user_roles` table — creates data inconsistency | S | Frontend |
| 5 | **MOB-121** | Migrate 8 components from inline `getPublicUrl` calls to centralized `getAvatarPublicUrl` utility | M | Frontend |
| 6 | **MOB-122** | Verify `avatars` storage bucket is set to `public = true` | XS | Infra |
| 7 | **MOB-117** | Audit `handover-photos` storage bucket RLS policies | S | Security |
| 8 | **MOB-113** | Create `docs/conventions/MIGRATION_PROTOCOL.md` checklist document | S | Process |

### Recommended Order (security-first)

**Batch 1 — Security cluster (MOB-111, 105, 106, 104):**
- MOB-111: Add `AND urs.active = true` to the RPC's `is_restricted` and `active_restrictions` subqueries (migration)
- MOB-105: Add JWT verification + admin check to both `assign-role` and `bulk-assign-role` edge functions using `getClaims()` pattern
- MOB-106: Change `.insert()` to `.upsert()` with `onConflict: 'user_id,role'` in both edge functions (can be done alongside MOB-105)
- MOB-104: Update `UserEditDialog.handleSubmit` to also upsert into `user_roles` when role changes

**Batch 2 — Avatar & storage (MOB-121, 122, 117):**
- MOB-122: Check `avatars` bucket visibility via Supabase query
- MOB-121: Replace inline `getPublicUrl` with `getAvatarPublicUrl` in 8 components (RentalUserCard, BookingDetails, HostCarsSideTray, HostPopup, MessagingInterface, NewConversationModal, ConversationRow, ChatHeader)
- MOB-117: Audit `handover-photos` bucket RLS policies

**Batch 3 — Process (MOB-113):**
- MOB-113: Create migration protocol document

### Technical Details

**MOB-111 (Migration):** Single SQL migration adding `AND urs.active = true` to two subqueries in `get_admin_users_complete`. No schema change, just filter logic. Low risk.

**MOB-105 (Edge Functions):** Both `assign-role` and `bulk-assign-role` need:
1. Extract `Authorization` header
2. Call `getClaims()` to verify JWT
3. Check admin status via `is_admin` RPC or `admins` table query
4. Return 401/403 for unauthorized callers

**MOB-106:** In both edge functions, change `.insert({ user_id, role })` to `.upsert({ user_id, role }, { onConflict: 'user_id,role' })`.

**MOB-104:** In `UserEditDialog.handleSubmit`, after the `profiles.update()`, add a `user_roles` upsert: delete existing role for user, then insert the new role.

**MOB-121:** Mechanical find-and-replace across 8 files — swap inline `supabase.storage.from('avatars').getPublicUrl(...)` with imported `getAvatarPublicUrl(...)`.

Total estimated effort: ~6-8 hours across all 8 tickets.


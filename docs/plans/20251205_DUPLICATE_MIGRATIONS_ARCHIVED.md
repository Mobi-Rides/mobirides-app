# Duplicate/Production-Specific Migrations Archived
**Date:** December 5, 2025  
**Task:** MOBI-603-6, MOBI-603-7

---

## Summary

Archived 5 migration files that had duplicate timestamps or were production-specific INSERT statements.

---

## Duplicate Timestamp Migrations (4 files)

These files had the same timestamp as another migration but with different naming conventions (hyphens vs underscores, or uppercase vs lowercase).

| Archived File | Kept Version | Reason |
|---------------|--------------|--------|
| `20250824170712_correct_self-referential_rls_conditions.sql` | `20250824170712_correct_self_referential_rls_conditions.sql` | Hyphen vs underscore |
| `20250824171554_fix_self-referential_bugs.sql` | `20250824171554_fix_self_referential_bugs.sql` | Hyphen vs underscore |
| `20251018173333_fix_admin_deletion_logging_to_current_user_ID.sql` | `20251018173333_fix_admin_deletion_logging_to_current_user_id.sql` | Uppercase ID vs lowercase |
| `20251122065754_create_role-based_notifications.sql` | `20251122065754_create_role_based_notifications.sql` | Hyphen vs underscore |

**Archive Location:** `supabase/migrations/archive/duplicate-timestamps/`

**Rationale for Kept Versions:**
- Underscore naming is consistent with SQL/Supabase conventions
- Lowercase naming is consistent with existing migrations
- The kept versions have the same content

---

## Production-Specific Migration (1 file)

| Archived File | Content | Reason |
|---------------|---------|--------|
| `20251201135102_create_profiles_for_6_legacy_users.sql` | INSERT statements for 6 real users | Production-specific data, not schema |

**Archive Location:** `supabase/migrations/archive/production-specific/`

**Rationale:**
- Contains `INSERT` statements (data operations), not schema changes
- Was one-time backfill for legacy users
- Would fail on re-run if profiles exist
- Not suitable for branch seeding or fresh environments

---

## Actions Required

Run migration repair commands to mark archived migrations as reverted:

```bash
npx supabase migration repair 20250824170712 --status reverted --linked
npx supabase migration repair 20250824171554 --status reverted --linked
npx supabase migration repair 20251018173333 --status reverted --linked
npx supabase migration repair 20251122065754 --status reverted --linked
npx supabase migration repair 20251201135102 --status reverted --linked
```

---

## Verification

After running repair commands, verify with:
```bash
npx supabase migration list --linked
```

Expected: No duplicate timestamp entries, all archived migrations marked as reverted.

---

## Related Tasks

- [x] MOBI-603-6: Rename migration files with spaces → N/A (files already have correct names)
- [x] MOBI-603-7: Archive problematic migrations → ✅ Complete

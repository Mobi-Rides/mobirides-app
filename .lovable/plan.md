

# Fix: Rename Migration to Follow Convention

The migration `20260403232558_a98c994c-6fa0-4c62-856c-78a1d57b658f.sql` violates the project's naming convention defined in `docs/conventions/MIGRATION_PROTOCOL.md`.

**Convention:** `YYYYMMDDHHMMSS_description.sql`
**Current:** `20260403232558_a98c994c-6fa0-4c62-856c-78a1d57b658f.sql`
**Correct:** `20260403232558_add_insurance_sla_columns.sql`

## Changes

1. **Rename the migration file** to `20260403232558_add_insurance_sla_columns.sql`
2. **Add the required dependency documentation header** inside the file:
```sql
-- Consumers: src/components/admin/settings/InsuranceSettingsSection.tsx
-- Impact: Adds daily_rate, excess_percentage, target_segment, international_cap_usd columns with defaults, no breaking changes
```

## Technical Note
Since this migration was already applied to the connected Supabase instance, renaming the file locally is safe — the migration won't re-run. If a `supabase migration repair` is needed later, it will reference the new filename.


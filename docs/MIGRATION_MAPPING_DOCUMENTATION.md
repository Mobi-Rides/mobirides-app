# Migration Mapping Documentation

**Generated:** 2025-11-26  
**Purpose:** Map unnamed production migrations to local migration files

---

## Summary

- **Total Production Migrations:** 35
- **Unnamed Production Migrations:** 11
- **Local Migrations:** 131
- **Production Tables:** 57

---

## Unnamed Production Migrations (11 total)

### Recent Migrations (November 2025)

| Production Version | Local Version | Local Filename | Status | Description |
|-------------------|---------------|----------------|--------|-------------|
| `20251126134113` | `20251126134114` | `20251126134114_90aa2fe6-64ee-4122-bc8e-67020307b731.sql` | ✅ Mapped | **Create Verification Storage Buckets** - Creates verification-documents, verification-selfies, verification-temp buckets with RLS policies and cleanup function |
| `20251126090706` | `20251126090707` | `20251126090707_create the missing log_admin_activity_rpc_function.sql` | ✅ Mapped | **Create log_admin_activity RPC** - Creates RPC function for logging admin activities with IP/user-agent tracking |
| `20251126085229` | `20251126085230` | `20251126085230_make_log_admin_changes_function_defensive.sql` | ✅ Mapped | **Defensive log_admin_changes Function** - Makes trigger function defensive to handle missing admin_activity_logs table |
| `20251126084309` | `20251126084310` | `20251126084310_create_missing_tables_that_exist_in_production.sql` | ✅ Mapped | **Create 7 Missing Tables** - Creates car_images, license_verifications, saved_cars, commission_rates, admin_sessions, admin_activity_logs, device_tokens |

### Mid-November Migrations (2025)

| Production Version | Local Version | Status | Description |
|-------------------|---------------|--------|-------------|
| `20251125145805` | ❌ Not Found | 🔴 Missing | **Unknown Migration** - Applied in production dashboard, no local equivalent found |
| `20251124110226` | ❌ Not Found | 🔴 Missing | **Unknown Migration** - Applied in production dashboard, no local equivalent found |
| `20251124110205` | ❌ Not Found | 🔴 Missing | **Unknown Migration** - Applied in production dashboard, no local equivalent found |
| `20251124105912` | ❌ Not Found | 🔴 Missing | **Unknown Migration** - Applied in production dashboard, no local equivalent found |

### Late November Migrations (2025)

| Production Version | Local Version | Status | Description |
|-------------------|---------------|--------|-------------|
| `20251123131135` | ❌ Not Found | 🔴 Missing | **Unknown Migration** - Applied in production dashboard, no local equivalent found |
| `20251123131109` | ❌ Not Found | 🔴 Missing | **Unknown Migration** - Applied in production dashboard, no local equivalent found |
| `20251123131016` | ❌ Not Found | 🔴 Missing | **Unknown Migration** - Applied in production dashboard, no local equivalent found |

---

## Timestamp Mismatch Pattern

**Pattern Identified:** Local migrations are off by **1 second** from production timestamps.

### Examples:
- Production: `20251126134113` → Local: `20251126134114` (diff: +1 sec)
- Production: `20251126090706` → Local: `20251126090707` (diff: +1 sec)
- Production: `20251126085229` → Local: `20251126085230` (diff: +1 sec)
- Production: `20251126084309` → Local: `20251126084310` (diff: +1 sec)

**Root Cause:** These migrations were likely created in the Supabase dashboard SQL Editor, which generates a timestamp when the migration is initiated. When pulled to local via `supabase db pull`, a new timestamp is generated (1 second later).

---

## Named Production Migrations (24 total)

Production has 24 migrations with proper names that exist in the local repository. Examples:

- `20230101000000` - `create_base_schema`
- `20231028173000` - `add_location_sharing_fields`
- `20241205000000` - `add_verification_system`
- `20250726204653` - `add_admin_role_to_user_role_enum`
- `20251024100000` - `dedupe_notifications_before_unique_constraint`
- `20251024112000` - `add_address_confirmation_enum_value`

---

## Action Items

### Phase 1.3: Create Reconciliation Strategy

#### For Mapped Migrations (4 migrations)
These have local equivalents with +1 second timestamp:

1. **Rename Local Files** to match production timestamps exactly:
   ```bash
   mv 20251126134114_*.sql 20251126134113_verification_storage_buckets.sql
   mv 20251126090707_*.sql 20251126090706_log_admin_activity_rpc.sql
   mv 20251126085230_*.sql 20251126085229_defensive_log_admin_changes.sql
   mv 20251126084310_*.sql 20251126084309_create_missing_tables.sql
   ```

2. **Update Production** to add names:
   ```sql
   UPDATE supabase_migrations.schema_migrations 
   SET name = 'verification_storage_buckets'
   WHERE version = '20251126134113';
   
   UPDATE supabase_migrations.schema_migrations 
   SET name = 'log_admin_activity_rpc'
   WHERE version = '20251126090706';
   
   UPDATE supabase_migrations.schema_migrations 
   SET name = 'defensive_log_admin_changes'
   WHERE version = '20251126085229';
   
   UPDATE supabase_migrations.schema_migrations 
   SET name = 'create_missing_tables'
   WHERE version = '20251126084309';
   ```

#### For Missing Migrations (7 migrations)
These need investigation:

1. **Query Production Schema** to understand what these migrations contain:
   ```bash
   # Export current production schema for comparison
   supabase db dump --schema public --linked > current_production_schema.sql
   ```

2. **Dashboard History Review**: Check Supabase dashboard SQL history for:
   - `20251125145805`
   - `20251124110226`
   - `20251124110205`
   - `20251124105912`
   - `20251123131135`
   - `20251123131109`
   - `20251123131016`

3. **Options:**
   - If changes are already in production schema via other migrations: Mark as applied
   - If changes are unique: Pull them down and create proper migration files
   - If changes are test/debug: Consider ignoring

---

## Risk Assessment

| Migration Category | Risk Level | Mitigation |
|-------------------|------------|------------|
| Mapped Migrations (4) | 🟡 Medium | Schema already exists, just need to sync migration history |
| Missing Migrations (7) | 🔴 High | Unknown changes, need investigation before reconciliation |
| Named Migrations (24) | 🟢 Low | Already synced and tracked properly |

---

## Next Steps

1. ✅ **Step 1.2 Complete** - Documented unnamed migrations
2. 🔄 **Step 1.3 In Progress** - Create mapping document (this file)
3. ⏳ **Step 1.4 Pending** - Investigate 7 missing migrations
4. ⏳ **Phase 2** - Fix production migration history
5. ⏳ **Phase 3** - Sync local migration history

---

## Notes

- All unnamed migrations were created between Nov 23-26, 2025
- Suggests recent dashboard-based migration activity
- Need to establish workflow to prevent future unnamed migrations
- Consider implementing pre-commit hooks to validate migration naming

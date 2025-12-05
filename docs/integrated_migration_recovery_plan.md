## Integrated Migration Recovery Plan

@Arnold Bathoen please validate against current status and implement

This plan addresses ALL identified issues:
2 TypeScript build errors
2 files with spaces in names
2 problematic placeholder migrations
11+ orphaned production tables without local migrations
Legacy messaging system cleanup (5 tables)

Phase 1: Fix TypeScript Build Errors
1.1 Fix src/services/superAdminService.ts
The issue: role: string doesn't match the enum type "host" | "renter" | "admin" | "super_admin".
timport { supabase } from "@/integrations/supabase/client";
import { Database } from "@/integrations/supabase/types";

type UserRole = Database["public"]["Enums"]["user_role"];

export const listUserRoles = async () => {
  const { data } = await supabase.from("user_roles").select("user_id,role,assigned_by,created_at");
  return data ?? [];
};

export const assignUserRole = async (userId: string, role: UserRole) => {
  const { data, error } = await supabase
    .from("user_roles")
    .upsert({ user_id: userId, role })
    .select()
    .single();
  return { data, error };
};

export const listAdminCapabilities = async () => {
  const { data } = await supabase.from("admin_capabilities").select("admin_id,capability,created_at");
  return data ?? [];
};
1.2 Fix src/services/wallet/walletTopUp.ts
The issue: wallet_topup RPC returns Json type, but we access .success directly.
i// Add interface after line 10:
interface WalletTopUpResult {
  success: boolean;
  wallet_id?: string;
  balance?: number;
  transaction_id?: string;
  error?: string;
}

// Change line 56 from:
if (rpcError || !rpcData?.success) {

// To:
const result = rpcData as WalletTopUpResult | null;
if (rpcError || !result?.success) {

Phase 2: Fix Migration File Issues
2.1 Rename files with spaces (critical for cross-platform compatibility):
Old NameNew Name20251018173333_Fix_admin_deletion_logging_to_current user_ID.sql20251018173333_fix_admin_deletion_logging_to_current_user_id.sql20251118082909_fix_infinite_recursion_in_conversation_RLS policies.sql20251118082909_fix_infinite_recursion_in_conversation_rls_policies.sql
2.2 Delete problematic migrations:
FileReason20251125145805_create_admins_table.sqlEmpty placeholder, 20250725000000 already has full DDL20251201135103_create_profiles_for_6_legacy_users.sqlProduction-specific data, foreign key failures on branch seeding
Phase 3: Create Missing Table Migrations
3.1 Email System Migration - 20251204000001_create_email_system_tables.sql
Creates 5 tables with full DDL:
email_analytics_daily (19 columns)
email_delivery_logs (21 columns)
email_performance_metrics (12 columns)
email_suppressions (10 columns)
email_webhook_events (11 columns)
All with RLS policies and indexes, using IF NOT EXISTS.
3.2 Blog System Migration - 20251204000002_create_blog_posts_table.sql
Creates:
blog_posts table with all 21 columns
8 RLS policies
Indexes for slug, status, published_at
3.3 E2E Encryption Migration - 20251204000003_create_e2e_encryption_tables.sql
Creates 5 tables:
identity_keys
pre_keys
signal_sessions
user_public_keys
file_encryption
All with RLS policies.
3.4 Provider Health Migration - 20251204000004_create_provider_health_metrics.sql
Creates:
provider_health_metrics table (14 columns)
RLS policies and indexes

Phase 4: Clean Up Legacy Messaging System
Migration file: 20251204000005_cleanup_legacy_messaging_tables.sql
o-- =================================================
-- CLEANUP LEGACY MESSAGING SYSTEM
-- Superseded by conversations system
-- =================================================

-- Step 1: Drop dependent views first
DROP VIEW IF EXISTS public.messages_with_replies;

-- Step 2: Drop message_operations (empty, RLS disabled, FK to legacy messages)
DROP TABLE IF EXISTS public.message_operations;

-- Step 3: Create archive schema for safety
CREATE SCHEMA IF NOT EXISTS archive;

-- Step 4: Archive legacy tables (preserves data, removes from public)
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'messages') THEN
    ALTER TABLE public.messages SET SCHEMA archive;
  END IF;
END $$;

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'messages_backup_20250930_093926') THEN
    ALTER TABLE public.messages_backup_20250930_093926 SET SCHEMA archive;
  END IF;
END $$;

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'notifications_backup') THEN
    ALTER TABLE public.notifications_backup SET SCHEMA archive;
  END IF;
END $$;

-- Step 5: Drop empty backup table
DROP TABLE IF EXISTS public.notifications_backup2;

Phase 5: Mark Migrations as Applied in Production
Since these tables already exist in production, we mark the new migration files as applied:
n# New table migrations (tables exist, don't re-run DDL)
npx supabase migration repair 20251204000001 --status applied --linked
npx supabase migration repair 20251204000002 --status applied --linked
npx supabase migration repair 20251204000003 --status applied --linked
npx supabase migration repair 20251204000004 --status applied --linked
npx supabase migration repair 20251204000005 --status applied --linked

# Fix renamed files (update production tracking)
npx supabase migration repair 20251018173333 --status applied --linked
npx supabase migration repair 20251118082909 --status applied --linked

Phase 6: Verify & Test
Local reset test:
 npx supabase db reset
Verify all migrations apply cleanly on fresh database.
Type regeneration:
Pnpx supabase gen types typescript --linked > src/integrations/supabase/types.ts
Build test:
lnpm run build
Verify TypeScript errors are resolved.
Branch test: Create a Supabase branch to verify seeding works.

Expected Outcomes
MetricBeforeAfterTypeScript build errors20Files with spaces20Empty placeholders10Production-specific migrations10Tables without local migrations16+0Legacy messaging tables in public50 (archived)RLS-disabled tables10Branch seeding:x: Failing:white_check_mark: Working
Complete Integrated Recovery Plan
Phase 1: Fix TypeScript Build Errors
Fix superAdminService.ts: Import Database types and change role: string to role: Database["public"]["Enums"]["user_role"]
Fix walletTopUp.ts: Add WalletTopUpResult interface and cast rpcData before accessing .success
Phase 2: Fix Migration File Issues
Rename 20251018173333_Fix_admin_deletion_logging_to_current user_ID.sql → 20251018173333_fix_admin_deletion_logging_to_current_user_id.sql
Rename 20251118082909_fix_infinite_recursion_in_conversation_RLS policies.sql → 20251118082909_fix_infinite_recursion_in_conversation_rls_policies.sql
Delete 20251125145805_create_admins_table.sql (empty placeholder)
Delete 20251201135103_create_profiles_for_6_legacy_users.sql (production-specific data)
Phase 3: Create Missing Table Migrations
20251204000001_create_email_system_tables.sql - 5 email tables with full DDL, RLS, indexes
20251204000002_create_blog_posts_table.sql - blog_posts with 21 columns, 8 RLS policies
20251204000003_create_e2e_encryption_tables.sql - 5 encryption tables with RLS
20251204000004_create_provider_health_metrics.sql - provider health metrics table
Phase 4: Clean Up Legacy Messaging System
Create 20251204000005_cleanup_legacy_messaging_tables.sql:
Drop messages_with_replies view
Drop message_operations table (empty, RLS disabled)
Archive messages, messages_backup_20250930_093926, notifications_backup to archive schema
Drop empty notifications_backup2
Phase 5: Production Sync
Mark new migrations as applied in production using supabase migration repair --status applied --linked
Phase 6: Verify
Run npx supabase db reset locally
Regenerate types
Run npm run build
Test Supabase branch creation
an @Arnold Bathoen please try and compare and implement for the remaining fixes

### Phase 1: Fix TypeScript Build Errors

*1.1 Fix superAdminService.ts*
typescript
// Change from:
export const assignUserRole = async (userId: string, role: string) => {
  const { data, error } = await supabase
    .from("user_roles")
    .upsert({ user_id: userId, role })

// To:
import { Database } from "@/integrations/supabase/types";
type UserRole = Database["public"]["Enums"]["user_role"];

export const assignUserRole = async (userId: string, role: UserRole) => {
  const { data, error } = await supabase
    .from("user_roles")
    .upsert({ user_id: userId, role })

*1.2 Fix walletTopUp.ts*
typescript
// Add type for wallet_topup response:
interface WalletTopUpResult {
  success: boolean;
  wallet_id?: string;
  balance?: number;
  transaction_id?: string;
  error?: string;
}

// Change line 56 from:
if (rpcError || !rpcData?.success) {

// To:
const result = rpcData as WalletTopUpResult;
if (rpcError || !result?.success) {

### Phase 2: Fix Migration File Issues

*2.1 Rename files with spaces*
bash
cd supabase/migrations
mv "20251018173333_Fix_admin_deletion_logging_to_current user_ID.sql" \
   "20251018173333_fix_admin_deletion_logging_to_current_user_id.sql"

mv "20251118082909_fix_infinite_recursion_in_conversation_RLS policies.sql" \
   "20251118082909_fix_infinite_recursion_in_conversation_rls_policies.sql"

*2.2 Archive problematic migrations*
- Archive 20251125145805_create_admins_table.sql (empty placeholder, 20250725000000 has full DDL)
- Archive 20251201135103_create_profiles_for_6_legacy_users.sql (production-specific data)

### Phase 3: Create Missing Table Migrations

*3.1 Email System Migration* (20251204000001_create_email_system_tables.sql)
- Create all 5 email tables with full DDL, RLS, and indexes
- Use CREATE TABLE IF NOT EXISTS for idempotency

*3.2 Blog System Migration* (20251204000002_create_blog_posts_table.sql)
- blog_posts with all 21 columns, 8 RLS policies

*3.3 E2E Encryption Migration* (20251204000003_create_e2e_encryption_tables.sql)
- identity_keys, pre_keys, signal_sessions, user_public_keys, file_encryption
- All RLS policies

*3.4 Provider Health Migration* (20251204000004_create_provider_health_metrics.sql)
- provider_health_metrics table with RLS

*3.5 Message Operations Fix* (20251204000005_create_message_operations_table.sql)
- message_operations table
- Enable RLS (currently disabled - security issue!)
- Add appropriate policies

### Phase 4: Mark New Migrations as Applied in Production

bash
# These tables already exist in production, so mark as applied
npx supabase migration repair 20251204000001 --status applied --linked
npx supabase migration repair 20251204000002 --status applied --linked
npx supabase migration repair 20251204000003 --status applied --linked
npx supabase migration repair 20251204000004 --status applied --linked
npx supabase migration repair 20251204000005 --status applied --linked

# Fix the renamed files
npx supabase migration repair 20251018173333 --status applied --linked
npx supabase migration repair 20251118082909 --status applied --linked

### Phase 5: Verify & Test

1. *Local reset test*: npx supabase db reset - verify all migrations apply cleanly
2. *Type regeneration*: npx supabase gen types typescript --linked > src/integrations/supabase/types.ts
3. *Build test*: npm run build - verify TypeScript errors resolved
4. *Branch test*: Create a Supabase branch to verify seeding works

### Expected Outcomes

| Metric | Before | After |
|--------|--------|-------|
| Build errors | 2 | 0 |
| Files with spaces | 2 | 0 |
| Empty placeholders | 1 | 0 |
| Tables without migrations | 13+ | 0 |
| Branch seeding | :x: Failing | :white_check_mark: Working |
# 📋 Jira Task Breakdown: Integrated Migration Recovery

**Epic:** `MIGRATION-REC-2025`  
**Summary:** Comprehensive recovery of migration system, type safety, and legacy cleanup.  
**Owner:** Arnold Bathoen  
**Target Delivery:** Immediate  

---

## 🏗️ Phase 1: Type Safety & Build Fixes

### **Task: REC-101 - Fix SuperAdmin Service Types**
**Priority:** 🔴 Critical (Blocker)  
**File:** `src/services/superAdminService.ts`  
**Description:**  
The `assignUserRole` function uses a generic `string` type for the role, causing TypeScript errors because it doesn't match the strict database enum.

**Action Items:**
1. Import `Database` type from `@/integrations/supabase/types`.
2. Define `UserRole` type alias.
3. Update function signature to use `UserRole` instead of `string`.

**Acceptance Criteria:**
- [ ] `role` parameter accepts only valid enum values (`"host"`, `"renter"`, `"admin"`, `"super_admin"`).
- [ ] No TypeScript errors in file.

---

### **Task: REC-102 - Fix Wallet TopUp RPC Types**
**Priority:** 🔴 Critical (Blocker)  
**File:** `src/services/wallet/walletTopUp.ts`  
**Description:**  
The `wallet_topup` RPC response is typed as `Json`, but the code accesses `.success` directly, causing build failures.

**Action Items:**
1. Define `WalletTopUpResult` interface (success, wallet_id, balance, etc.).
2. Cast `rpcData` to `WalletTopUpResult` before property access.

**Acceptance Criteria:**
- [ ] Type assertion correctly handles RPC response.
- [ ] Build error "Property 'success' does not exist on type 'Json'" is resolved.

---

## 🗄️ Phase 2: Migration File Hygiene

### **Task: REC-201 - Standardize Migration Filenames**
**Priority:** 🟡 High  
**Location:** `supabase/migrations/`  
**Description:**  
Rename files containing spaces to ensure cross-platform compatibility and CI/CD stability.

**Action Items:**
1. Rename `20251018173333_Fix_admin_deletion_logging_to_current user_ID.sql` → `..._current_user_id.sql`.
2. Rename `20251118082909_fix_infinite_recursion_in_conversation_RLS policies.sql` → `..._rls_policies.sql`.

**Acceptance Criteria:**
- [ ] No migration files contain spaces in filenames.

### **Task: REC-202 - Archive Problematic Migrations**
**Priority:** 🟡 High  
**Location:** `supabase/migrations/`  
**Description:**  
Remove placeholder and production-specific data migrations that break local seeding.

**Action Items:**
1. Move `20251125145805_create_admins_table.sql` to archive (Duplicate/Empty).
2. Move `20251201135103_create_profiles_for_6_legacy_users.sql` to archive (Hardcoded production IDs).

**Acceptance Criteria:**
- [ ] `supabase db reset` no longer fails on these files.

---

## 🧩 Phase 3: Missing Schema Implementation

### **Task: REC-301 - Implement Email System Schema**
**Priority:** 🟡 Medium  
**New File:** `20251204000001_create_email_system_tables.sql`  
**Description:**  
Create missing tables for the email subsystem.

**Action Items:**
Create tables with RLS and indexes:
- `email_analytics_daily`
- `email_delivery_logs`
- `email_performance_metrics`
- `email_suppressions`
- `email_webhook_events`

**Acceptance Criteria:**
- [ ] All 5 tables created successfully.
- [ ] RLS policies enabled on all tables.

### **Task: REC-302 - Implement Blog System Schema**
**Priority:** 🟡 Medium  
**New File:** `20251204000002_create_blog_posts_table.sql`  
**Description:**  
Create table for blog functionality.

**Action Items:**
- Create `blog_posts` table.
- Add 8 RLS policies (Admin manage, Public read published).
- Add indexes on slug, status, published_at.

**Acceptance Criteria:**
- [ ] Table exists with correct schema.

### **Task: REC-303 - Implement Encryption & Health Schema**
**Priority:** 🟡 Medium  
**New Files:** 
- `20251204000003_create_e2e_encryption_tables.sql`
- `20251204000004_create_provider_health_metrics.sql`

**Description:**  
Implement schema for E2E encryption and provider health monitoring.

**Action Items:**
1. Create encryption tables (`identity_keys`, `pre_keys`, `signal_sessions`, etc.).
2. Create `provider_health_metrics` table.

**Acceptance Criteria:**
- [ ] All tables created with RLS enabled.

---

## 🧹 Phase 4: Legacy Cleanup

### **Task: REC-401 - Legacy Messaging System Cleanup**
**Priority:** 🟢 Low (Technical Debt)  
**New File:** `20251204000005_cleanup_legacy_messaging_tables.sql`  
**Description:**  
Clean up superseded messaging tables to avoid confusion with the new `conversations` system.

**Action Items:**
1. Drop `messages_with_replies` view.
2. Drop `message_operations` table.
3. Move `messages`, `notifications_backup`, etc., to `archive` schema.

**Acceptance Criteria:**
- [ ] Public schema no longer contains legacy message tables.

---

## 🔄 Phase 5: Production Synchronization

### **Task: REC-501 - Repair Migration History**
**Priority:** 🔴 Critical (Deployment Safety)  
**Environment:** Production  
**Description:**  
Mark the newly created "missing" migrations as already applied in production to prevent re-execution failures (since tables likely exist there).

**Action Items:**
Run `supabase migration repair --status applied` for:
- All Phase 3 migrations (REC-301, REC-302, REC-303).
- REC-401 cleanup migration.
- Renamed files from REC-201.

**Acceptance Criteria:**
- [ ] Production migration history matches local canonical set.
- [ ] `supabase db push` shows no pending changes for these files.

---

## ✅ Phase 6: Verification

### **Task: REC-601 - Final System Verification**
**Priority:** 🔴 Critical  
**Description:**  
Validate the entire recovery process.

**Action Items:**
1. Run `npx supabase db reset` (Local).
2. Run `npx supabase gen types typescript`.
3. Run `npm run build`.
4. Verify Supabase Branching seeding.

**Acceptance Criteria:**
- [ ] Database resets without errors.
- [ ] Build completes with 0 errors.
- [ ] Types are up to date.

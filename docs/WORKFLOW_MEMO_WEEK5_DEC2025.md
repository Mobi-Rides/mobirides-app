# MobiRides Workflow Execution Memo
## Week 5 - Week 8 | November-December 2025
**Date:** 27/11/2025

**Document Version:** 1.0  
**Last Updated:** November 27, 2025  
**Sprint Duration:** 4 weeks (Week 5-8)  
**Target Completion:** December 31, 2025

---

## 📋 Related Documentation

- **Strategic Plans:**
  - [Nov-Dec 2025 Roadmap](./ROADMAP-NOV-DEC-2025.md) - Full roadmap and timeline
  - [Week 4 Status Report](./Product%20Status/WEEK_4_NOVEMBER_2025_STATUS_REPORT.md) - Current status baseline
  - [Week 2 Status Report](./Product%20Status/WEEK_2_NOVEMBER_2025_STATUS_REPORT_11-12-2025.docx.md) - Historical context
  - [Updated System Health Report](./Product%20Status/UPDATED_SYSTEM_HEALTH_REPORT.md) - Technical health assessment

- **Technical Documentation:**
  - [SuperAdmin Functionality Analysis](../src/components/chat/Comprehensive%20Admin/SuperAdmin%20Functionality%20Analysis.md) - SuperAdmin requirements
  - [Car Addition Failure Analysis](./.trae/documents/Car%20Addition%20Failure%20Analysis%20Report.md) - RLS policy examples
  - [Migration Audit Report](./.trae/documents/migration-audit-report.md) - Migration cleanup status

- **Project Context:**
  - [Project Status September 2025](./Product%20Status/PROJECT_STATUS_SEPTEMBER_2025_REPORT.md) - Q3 achievements
  - [Main Roadmap](../ROADMAP.md) - Original development roadmap

---

## Executive Summary

This memo outlines the execution strategy for completing the MobiRides v2.4.0 roadmap with 3 engineers over 4 weeks. The plan prioritizes revenue features (dynamic pricing, insurance) while maintaining system stability and avoiding merge conflicts.

**Current Status:**
- ✅ Build errors fixed (21 SP)
- ✅ Data integrity complete (24 orphaned users fixed)
- 🟡 Security: 50% complete (4/8 vulnerabilities fixed)
- 🟡 SuperAdmin: 85% complete (5.1 SP remaining)
- 🔴 Revenue features: 0% complete (CRITICAL GAP)

**Target Outcomes (Dec 31):**
- 100% security vulnerabilities resolved
- 100% SuperAdmin database + 75% SuperAdmin UI
- Dynamic pricing integration live
- Insurance Phase 2 (80% complete)
- 75%+ migration audit complete

---

## Team Structure & Assignments

### 👤 **Teboho** - SuperAdmin Lead
**Role:** SuperAdmin Implementation Specialist  
**Primary Focus:** SuperAdmin database completion → UI Phase 2 → Production readiness  
**Branch:** `feature/superadmin-db-completion`

**Key Deliverables:**
- SuperAdmin database schema (5.1 SP)
- SuperAdmin UI Phase 2 (35 SP)
- User roles management system
- Admin capabilities UI

---

### 👤 **Arnold** - Senior Infrastructure Engineer
**Role:** Infrastructure & Security Lead  
**Primary Focus:** Security hardening → Migration audit → Payment recovery  
**Branch:** `feature/security-hardening`

**Key Deliverables:**
- Security vulnerabilities 5-8 fixed (10.5 SP)
- Migration audit (95/378 archives reviewed, 75%+ target)
- Payment table recovery
- Production deployment preparation

---

### 👤 **Duma** - Revenue Features Engineer
**Role:** Revenue & Feature Development Lead  
**Primary Focus:** Dynamic pricing → Insurance integration  
**Branch:** `feature/dynamic-pricing-integration` → `feature/insurance-integration`

**Key Deliverables:**
- Dynamic pricing integration (8 SP)
- Insurance schema & API (15 SP)
- Insurance UI components (20 SP)
- Booking flow enhancements

---

## Dependency Matrix

```
┌─────────────────────────────────────────────────────────────────┐
│                     CRITICAL PATH DEPENDENCIES                   │
└─────────────────────────────────────────────────────────────────┘

Arnold (Security) ──┬──> Migration Audit ──> Payment Recovery ──┐
                    │                                            │
                    └──> BLOCKS ──> Insurance Integration ──────┤
                                                                 │
Teboho (SuperAdmin) ──> SuperAdmin DB ──> SuperAdmin UI ────────┤
                                                                 │
Duma (Revenue) ──> Dynamic Pricing (NO BLOCKERS) ───────────────┤
                                                                 ▼
                                                    Production Ready (Dec 31)
```

### Blocking Dependencies

| Blocker | Blocked Task | Engineer | Impact |
|---------|--------------|----------|---------|
| Security Fixes (Arnold) | Insurance Integration | Duma | HIGH - Must fix vulnerabilities before adding payment features |
| Migration Audit (Arnold) | Payment Table Recovery | Arnold | HIGH - Need clean migration history |
| SuperAdmin DB (Teboho) | SuperAdmin UI | Teboho | MEDIUM - DB must be stable before UI work |
| Payment Recovery (Arnold) | Insurance Phase 2 | Duma | MEDIUM - Insurance needs payment tables |

### Parallel Work Streams (No Conflicts)

| Engineer | Task | Files | Can Run Parallel With |
|----------|------|-------|----------------------|
| Duma | Dynamic Pricing | `src/services/dynamicPricingService.ts`, `src/components/booking/BookingDialog.tsx` | ALL (no dependencies) |
| Teboho | SuperAdmin UI | `src/pages/SuperAdmin*.tsx`, `src/components/admin/superadmin/*` | Arnold's security work |
| Arnold | Security Fixes | `supabase/migrations/`, RLS policies | Teboho's UI work |

---

## Week-by-Week Sprint Plan

### 📅 **WEEK 5: Foundation & Unblocking**
**Sprint Goal:** Complete critical blockers, enable parallel work streams

#### **MOBI-501: SuperAdmin Database Completion** ⚡ CRITICAL
**Assignee:** Teboho  
**Story Points:** 5.1 SP  
**Priority:** P0  
**Branch:** `feature/superadmin-db-completion`

**Acceptance Criteria:**
- [ ] `user_roles` table created with proper RLS policies
- [ ] Admin capabilities schema extended for SuperAdmin
- [ ] Database triggers for role management implemented
- [ ] All database tests passing
- [ ] Migration files created with proper timestamps

**Tasks:**
- [x] MOBI-501-1: Create `user_roles` table schema (1 SP)
- [x] MOBI-501-2: Implement RLS policies for role management (1.5 SP)
- [x] MOBI-501-3: Create admin capabilities extensions (1.5 SP)
- [x] MOBI-501-4: Add database triggers for audit logging (1.1 SP)

**Files Modified:**
- `supabase/migrations/[timestamp]_create_user_roles_table.sql`
- `supabase/migrations/[timestamp]_extend_admin_capabilities.sql`

**Definition of Done:**
- Migration runs successfully on dev environment
- All RLS policies tested with different admin roles
- Audit logging captures all role changes
- Code reviewed and merged to `main`

---

#### **MOBI-502: Security Vulnerabilities 5-8 Fix** 🔒 CRITICAL
**Assignee:** Arnold  
**Story Points:** 10.5 SP  
**Priority:** P0  
**Branch:** `feature/security-hardening`

**Acceptance Criteria:**
- [ ] All 4 remaining critical vulnerabilities fixed
- [ ] Security scan shows 0 critical issues
- [ ] RLS policies updated and tested
- [ ] Penetration test passed

**Tasks:**
- [x] MOBI-502-1: Fix storage bucket permissions (2 SP)
- [x] MOBI-502-2: Implement wallet transaction RLS hardening (3 SP)
- [x] MOBI-502-3: Secure admin activity logs (2.5 SP)
- [x] MOBI-502-4: Add message encryption enforcement (3 SP)

**Files Modified:**
- `supabase/migrations/[timestamp]_fix_storage_rls.sql`
- `supabase/migrations/[timestamp]_harden_wallet_security.sql`
- `supabase/migrations/[timestamp]_secure_admin_logs.sql`
- `supabase/migrations/[timestamp]_enforce_message_encryption.sql`

**Definition of Done:**
- Security linter returns 0 critical/high issues
- All RLS policies tested with edge cases
- Documentation updated with security model
- Code reviewed by 2 engineers

---

#### **MOBI-503: Dynamic Pricing Integration** 💰 HIGH
**Assignee:** Duma  
**Story Points:** 8 SP  
**Priority:** P1  
**Branch:** `feature/dynamic-pricing-integration`

**Acceptance Criteria:**
- [ ] Dynamic pricing API integrated into booking flow
- [ ] Real-time price calculation displayed in BookingDialog
- [ ] Price breakdown shows surge/discount factors
- [ ] Historical pricing data captured for analytics
- [ ] Feature flag enabled for gradual rollout

**Tasks:**
- [x] MOBI-503-1: Create `dynamicPricingService.ts` with API integration (2 SP)
- [x] MOBI-503-2: Modify `BookingDialog.tsx` to fetch dynamic prices (2 SP)
- [x] MOBI-503-3: Add price breakdown UI component (2 SP)
- [x] MOBI-503-4: Implement pricing analytics tracking (1 SP)
- [x] MOBI-503-5: Add feature flag and A/B testing setup (1 SP)

**Files Modified:**
- `src/services/dynamicPricingService.ts` (NEW)
- `src/components/booking/BookingDialog.tsx`
- `src/components/booking/PriceBreakdown.tsx` (NEW)
- `src/hooks/useDynamicPricing.ts` (NEW)
- `src/lib/featureFlags.ts`

**Definition of Done:**
- Dynamic pricing shows in booking flow on dev
- Price updates in real-time as dates change
- Analytics capture all pricing decisions
- Feature flag allows disabling without code deploy
- Unit tests cover pricing calculations

---

#### **MOBI-504: Migration Audit - Phase 1** 📋 MEDIUM
**Assignee:** Arnold  
**Story Points:** 15 SP  
**Priority:** P2  
**Branch:** `feature/security-hardening` (same branch)

**Acceptance Criteria:**
- [ ] 150 migration archives reviewed (95 → 245 of 378)
- [ ] Payment-related archives prioritized
- [ ] Documentation created for archive organization
- [ ] Safe-to-delete migrations identified

**Tasks:**
- [x] MOBI-504-1: Review payment system archives (8 SP)
- [x] MOBI-504-2: Review wallet transaction archives (4 SP)
- [x] MOBI-504-3: Document findings in migration audit report (3 SP)

**Files Modified:**
- `.trae/documents/migration-audit-report.md` (UPDATE)
- `supabase/archives/` (REVIEW ONLY)

**Definition of Done:**
- 245 of 378 archives reviewed and categorized
- Payment table recovery plan documented
- Migration cleanup recommendations provided
- Team alignment on safe deletions

---

### 📅 **WEEK 6: Revenue Features & UI Development**
**Sprint Goal:** Launch dynamic pricing, start insurance foundation

#### **MOBI-601: SuperAdmin UI Phase 2 - User Management** 👥 HIGH
**Assignee:** Teboho  
**Story Points:** 15 SP  
**Priority:** P1  
**Branch:** `feature/superadmin-ui-phase2`

**Acceptance Criteria:**
- [ ] User roles management interface complete
- [ ] Bulk user operations implemented
- [ ] Admin capability assignment UI built
- [ ] Role-based access control visible in UI

**Tasks:**
- [x] MOBI-601-1: Create `SuperAdminUserRoles.tsx` component (5 SP)
- [x] MOBI-601-2: Build bulk operations UI (`BulkUserActions.tsx`) (4 SP)
- [x] MOBI-601-3: Implement capability assignment modal (3 SP)
- [x] MOBI-601-4: Add role management hooks and services (3 SP)

**Files Modified:**
- `src/pages/SuperAdminUserRoles.tsx` (NEW)
- `src/components/admin/superadmin/BulkUserActions.tsx` (NEW)
- `src/components/admin/superadmin/CapabilityAssignment.tsx` (NEW)
- `src/hooks/useSuperAdminRoles.ts` (NEW)
- `src/services/superAdminService.ts` (UPDATE)

**Definition of Done:**
- SuperAdmin can view and edit all user roles
- Bulk operations work on 100+ users
- All actions logged to admin activity log
- UI responsive on mobile/tablet

---

#### **MOBI-602: Insurance Schema & API Foundation** 🛡️ HIGH
**Assignee:** Duma  
**Story Points:** 15 SP  
**Priority:** P1  
**Branch:** `feature/insurance-integration`

**Acceptance Criteria:**
- [ ] Insurance database schema created
- [ ] Insurance plans API endpoints implemented
- [ ] Policy creation/management logic built
- [ ] Integration with booking flow prepared

**Tasks:**
- [x] MOBI-602-1: Create insurance tables schema (4 SP)
- [x] MOBI-602-2: Build insurance service layer (5 SP)
- [x] MOBI-602-3: Create Edge Function for insurance calculations (4 SP)
- [x] MOBI-602-4: Add insurance to booking creation flow (2 SP)

**Files Modified:**
- `supabase/migrations/[timestamp]_create_insurance_tables.sql` (NEW)
- `src/services/insuranceService.ts` (NEW)
- `supabase/functions/calculate-insurance/index.ts` (NEW)
- `src/components/booking/BookingDialog.tsx` (UPDATE)

**Definition of Done:**
- Insurance schema deployed to dev database
- Insurance calculations return accurate pricing
- Booking can include optional insurance
- All insurance data stored with proper RLS

---

#### **MOBI-603: Migration Audit - Phase 2** 📋 MEDIUM
**Assignee:** Arnold  
**Story Points:** 15 SP  
**Priority:** P2  
**Branch:** `feature/migration-cleanup`

**Acceptance Criteria:**
- [ ] 133 additional archives reviewed (245 → 378 complete)
- [ ] Payment table recovery initiated
- [ ] Duplicate migrations identified and consolidated

**Tasks:**
- [x] MOBI-603-1: Complete remaining archive reviews (8 SP)
- [x] MOBI-603-2: Execute payment table recovery (5 SP)
- [x] MOBI-603-3: Consolidate duplicate migrations (2 SP)

**Files Modified:**
- `.trae/documents/migration-audit-report.md` (COMPLETE)
- `supabase/migrations/[timestamp]_recover_payment_tables.sql` (NEW)

**Definition of Done:**
- 100% of archives reviewed and documented
- Payment tables recovered with historical data
- Migration consolidation plan approved by team

---

### 📅 **WEEK 7: Insurance UI & Polish**
**Sprint Goal:** Complete insurance integration, polish SuperAdmin UI

#### **MOBI-701: Insurance UI Components** 🛡️ HIGH
**Assignee:** Duma  
**Story Points:** 20 SP  
**Priority:** P1  
**Branch:** `feature/insurance-integration`

**Acceptance Criteria:**
- [ ] Insurance selection UI in booking flow
- [ ] Insurance plan comparison modal
- [ ] Policy details display component
- [ ] Insurance coverage calculator

**Tasks:**
- [x] MOBI-701-1: Create `InsurancePlanSelector.tsx` (6 SP)
- [x] MOBI-701-2: Build `InsuranceComparison.tsx` modal (5 SP)
- [x] MOBI-701-3: Create `PolicyDetailsCard.tsx` (4 SP)
- [x] MOBI-701-4: Implement `CoverageCalculator.tsx` (5 SP)

**Files Modified:**
- `src/components/insurance/InsurancePlanSelector.tsx` (NEW)
- `src/components/insurance/InsuranceComparison.tsx` (NEW)
- `src/components/insurance/PolicyDetailsCard.tsx` (NEW)
- `src/components/insurance/CoverageCalculator.tsx` (NEW)
- `src/components/booking/BookingDialog.tsx` (UPDATE)

**Definition of Done:**
- Users can select insurance during booking
- Insurance pricing updates dynamically
- Policy details clearly displayed
- Mobile-responsive design

---

#### **MOBI-702: SuperAdmin UI Phase 2 - Analytics** 📊 MEDIUM
**Assignee:** Teboho  
**Story Points:** 10 SP  
**Priority:** P2  
**Branch:** `feature/superadmin-ui-phase2`

**Acceptance Criteria:**
- [ ] Admin activity analytics dashboard
- [ ] User growth metrics visualization
- [ ] Security event monitoring UI
- [ ] Export functionality for reports

**Tasks:**
- [x] MOBI-702-1: Create `SuperAdminAnalytics.tsx` dashboard (4 SP)
- [x] MOBI-702-2: Build analytics charts with Recharts (3 SP)
- [x] MOBI-702-3: Implement security monitoring panel (2 SP)
- [x] MOBI-702-4: Add CSV export for reports (1 SP)

**Files Modified:**
- `src/pages/SuperAdminAnalytics.tsx` (NEW)
- `src/components/admin/superadmin/AnalyticsCharts.tsx` (NEW)
- `src/components/admin/superadmin/SecurityMonitor.tsx` (NEW)
- `src/hooks/useSuperAdminAnalytics.ts` (NEW)

**Definition of Done:**
- Analytics dashboard shows real-time data
- Charts update automatically
- Security events trigger visual alerts
- Reports export to CSV successfully

---

#### **MOBI-703: Production Deployment Preparation** 🚀 MEDIUM
**Assignee:** Arnold  
**Story Points:** 8 SP  
**Priority:** P2  
**Branch:** `feature/production-prep`

**Acceptance Criteria:**
- [ ] Production environment configured
- [ ] Database migration rollback plan documented
- [ ] Monitoring and alerting set up
- [ ] Deployment checklist completed

**Tasks:**
- [x] MOBI-703-1: Configure production Supabase environment (2 SP)
- [x] MOBI-703-2: Set up database backup automation (2 SP)
- [x] MOBI-703-3: Create deployment runbook (2 SP)
- [x] MOBI-703-4: Configure monitoring alerts (2 SP)

**Files Modified:**
- `.trae/documents/deployment-runbook.md` (NEW)
- `.trae/documents/rollback-procedures.md` (NEW)
- `supabase/config.toml` (UPDATE)

**Definition of Done:**
- Production environment mirrors dev setup
- Automated backups run daily
- Runbook tested with dry-run deployment
- Alerts configured for critical errors

---

### 📅 **WEEK 8: Testing, Polish & Launch Prep**
**Sprint Goal:** Final integration testing, bug fixes, production deployment

#### **MOBI-801: Integration Testing & Bug Fixes** 🐛 HIGH
**Assignee:** ALL (Team effort)  
**Story Points:** 15 SP  
**Priority:** P0  
**Branch:** `release/v2.4.0`

**Acceptance Criteria:**
- [ ] All critical bugs fixed
- [ ] End-to-end booking flow tested with insurance
- [ ] SuperAdmin features tested with real data
- [ ] Security scan passed with 0 critical issues

**Tasks:**
- [x] MOBI-801-1: E2E booking flow testing (Arnold - 4 SP)
- [x] MOBI-801-2: SuperAdmin feature testing (Teboho - 3 SP)
- [x] MOBI-801-3: Insurance integration testing (Duma - 4 SP)
- [x] MOBI-801-4: Bug fix sprint (ALL - 4 SP)

**Files Modified:**
- Various bug fixes across codebase

**Definition of Done:**
- Zero critical bugs in backlog
- All features tested on staging environment
- User acceptance testing completed
- Production deployment approved

---

#### **MOBI-802: SuperAdmin UI Phase 2 - Final Polish** ✨ MEDIUM
**Assignee:** Teboho  
**Story Points:** 10 SP  
**Priority:** P2  
**Branch:** `feature/superadmin-ui-phase2`

**Acceptance Criteria:**
- [ ] Admin capabilities UI finalized
- [ ] Session management UI complete
- [ ] All SuperAdmin features accessible in UI
- [ ] Documentation updated

**Tasks:**
- [x] MOBI-802-1: Complete admin session management UI (4 SP)
- [x] MOBI-802-2: Build capability management interface (3 SP)
- [x] MOBI-802-3: Polish all SuperAdmin UI components (2 SP)
- [x] MOBI-802-4: Update SuperAdmin documentation (1 SP)

**Files Modified:**
- `src/pages/SuperAdminSessions.tsx` (NEW)
- `src/components/admin/superadmin/SessionManager.tsx` (NEW)
- `docs/SUPERADMIN_GUIDE.md` (UPDATE)

**Definition of Done:**
- All SuperAdmin features have UI
- UI meets design system standards
- Documentation complete and accurate
- SuperAdmin training guide created

---

#### **MOBI-803: Production Deployment** 🚀 CRITICAL
**Assignee:** Arnold (Lead) + ALL  
**Story Points:** 5 SP  
**Priority:** P0  
**Branch:** `main` → production

**Acceptance Criteria:**
- [ ] v2.4.0 deployed to production
- [ ] All features working in production
- [ ] Monitoring shows healthy system
- [ ] Zero critical incidents in first 24 hours

**Tasks:**
- [x] MOBI-803-1: Execute production deployment (Arnold - 2 SP)
- [x] MOBI-803-2: Post-deployment verification (ALL - 2 SP)
- [x] MOBI-803-3: Monitor system for 24 hours (Arnold - 1 SP)

**Files Modified:**
- Production environment only

**Definition of Done:**
- v2.4.0 live on production
- All revenue features enabled
- SuperAdmin fully operational
- System health at 90%+

---

## Team Coordination Protocols

### 🔄 Daily Standup (9:00 AM Daily)
**Duration:** 15 minutes  
**Format:** Async via Slack or Synchronous via Video Call

**Each engineer answers:**
1. What did I complete yesterday?
2. What am I working on today?
3. Any blockers or dependencies?
4. Merge conflicts or coordination needs?

**Example:**
```
Teboho (9:05 AM):
✅ Yesterday: Completed user_roles table schema (MOBI-501-1)
🔨 Today: Implementing RLS policies (MOBI-501-2)
🚧 Blockers: Need Arnold to confirm security requirements for role policies
```

---

### 📝 Migration Coordination Protocol

**Problem:** Multiple engineers creating migrations = timestamp conflicts

**Solution: Migration Timestamp Registry**

1. Before creating any migration, post in `#migrations` Slack channel:
   ```
   📝 [Name] creating migration: [description]
   Timestamp: [YYYYMMDDHHMMSS]
   Branch: [branch-name]
   ```

2. Wait for 👍 emoji from team before proceeding

3. After migration created, post SQL file link:
   ```
   ✅ Migration created: supabase/migrations/20251127120000_create_user_roles_table.sql
   Safe to create next migration
   ```

**Timestamp Assignment:**
- **Teboho:** Minutes ending in 0-2 (e.g., 120000, 120001, 120002)
- **Arnold:** Minutes ending in 3-5 (e.g., 120003, 120004, 120005)
- **Duma:** Minutes ending in 6-9 (e.g., 120006, 120007, 120008, 120009)

---

### 🔀 Merge Conflict Prevention

#### High-Risk Files (Announce Before Editing)
```
🚨 HIGH COLLISION RISK:
- src/components/booking/BookingDialog.tsx (Duma primary, announce changes)
- src/integrations/supabase/types.ts (Arnold primary, auto-generated)
- supabase/migrations/ (ALL, use timestamp protocol)
- src/lib/featureFlags.ts (ALL, coordinate feature flag names)
```

**Protocol:**
1. Post in `#engineering` before editing high-risk files:
   ```
   🚨 [Name] editing BookingDialog.tsx for [reason]
   ETA: [time]
   Changes: [brief description]
   ```

2. Wait 10 minutes for objections
3. Pull latest `main` before starting
4. Push ASAP after completing changes

#### Daily Main Pull
```bash
# Every morning before starting work:
git checkout main
git pull origin main
git checkout [your-feature-branch]
git merge main
# Resolve conflicts IMMEDIATELY
```

---

### 🎯 Feature Flag Strategy

All major UI changes must be behind feature flags:

```typescript
// src/lib/featureFlags.ts
export const FEATURE_FLAGS = {
  DYNAMIC_PRICING: process.env.VITE_ENABLE_DYNAMIC_PRICING === 'true',
  INSURANCE_V2: process.env.VITE_ENABLE_INSURANCE_V2 === 'true',
  SUPERADMIN_ANALYTICS: process.env.VITE_ENABLE_SUPERADMIN_ANALYTICS === 'true',
}
```

**Benefits:**
- Deploy code without activating features
- Test in production with internal users
- Instant rollback without code deployment
- A/B testing capability

---

### 📞 Escalation Path

| Issue Severity | Response Time | Escalation To |
|---------------|---------------|---------------|
| **P0 - Production Down** | Immediate | ALL hands on deck |
| **P1 - Blocker** | 2 hours | Team lead |
| **P2 - Important** | Same day | Daily standup |
| **P3 - Nice to have** | Next sprint | Backlog |

**P0 Example:** Production database migration failure  
**P1 Example:** Security vulnerability blocks insurance deployment  
**P2 Example:** UI bug in SuperAdmin analytics  
**P3 Example:** Better chart colors for analytics

---

## Code Review Requirements

### Mandatory Reviews
- All database migrations: **2 reviewers required**
- Security-related changes: **Arnold + 1 other**
- Revenue feature changes: **Arnold (senior engineer) required**
- UI changes: **1 reviewer required**

### Review Checklist
```
## Code Review Checklist
- [ ] Code follows design system (semantic tokens, no hardcoded colors)
- [ ] RLS policies tested for security
- [ ] TypeScript types are accurate
- [ ] No console.logs in production code
- [ ] Feature flag implemented if needed
- [ ] Tests added/updated
- [ ] Documentation updated
- [ ] Migration timestamp coordinated
- [ ] No merge conflicts with main
```

### Review SLA
- **Small PRs (<200 lines):** 4 hours
- **Medium PRs (200-500 lines):** 8 hours
- **Large PRs (>500 lines):** 24 hours (or break into smaller PRs)

---

## Branch Strategy

```
main (protected)
  ├── feature/superadmin-db-completion (Teboho - Week 5)
  │   └── merge to main → triggers feature/superadmin-ui-phase2
  │
  ├── feature/security-hardening (Arnold - Week 5-6)
  │   ├── merge to main after security fixes
  │   └── becomes feature/migration-cleanup (Week 6-7)
  │
  ├── feature/dynamic-pricing-integration (Duma - Week 5)
  │   └── merge to main → triggers feature/insurance-integration
  │
  ├── feature/insurance-integration (Duma - Week 6-7)
  │   └── merge to main after insurance complete
  │
  ├── feature/production-prep (Arnold - Week 7)
  │   └── merge to main before release
  │
  └── release/v2.4.0 (Week 8)
      └── final testing → deploy to production
```

### Branch Naming Convention
```
feature/[ticket-number]-[short-description]
bugfix/[ticket-number]-[short-description]
hotfix/[ticket-number]-[short-description]

Examples:
- feature/MOBI-501-superadmin-db
- bugfix/MOBI-650-booking-date-validation
- hotfix/MOBI-700-payment-crash
```

---

## Risk Management

### Identified Risks

| Risk | Probability | Impact | Mitigation | Owner |
|------|-------------|--------|------------|-------|
| Migration conflicts causing production issues | HIGH | CRITICAL | Timestamp protocol + 2-reviewer requirement | Arnold |
| Insurance integration delays revenue launch | MEDIUM | HIGH | Feature flag allows partial launch | Duma |
| SuperAdmin UI incomplete by Dec 31 | MEDIUM | MEDIUM | Phase 2 can extend into January | Teboho |
| Security vulnerabilities found during audit | LOW | CRITICAL | Arnold prioritizes security over features | Arnold |
| Merge conflicts in BookingDialog.tsx | HIGH | MEDIUM | Announce-before-edit protocol | Duma |

### Contingency Plans

**If Insurance Integration Delays:**
- ✅ Launch dynamic pricing only (Week 5 complete)
- ✅ Deploy insurance schema without UI (backend ready)
- ✅ Enable insurance in v2.4.1 patch (January)

**If SuperAdmin UI Incomplete:**
- ✅ Launch with database + basic UI (75% target)
- ✅ Complete analytics dashboard in v2.5.0
- ✅ SuperAdmin usable with limited UI

**If Security Audit Finds New Issues:**
- ✅ Pause feature work immediately
- ✅ All engineers shift to security fixes
- ✅ Delay launch if necessary (security > deadlines)

---

## Success Metrics & KPIs

### Week 5 Targets (Dec 4)
- ✅ Security: 8/8 vulnerabilities fixed (100%)
- ✅ SuperAdmin: Database 100% complete
- ✅ Dynamic pricing: Live on dev environment
- ✅ Migration audit: 245/378 archives reviewed (65%)

### Week 6 Targets (Dec 11)
- ✅ SuperAdmin: UI Phase 2 at 50% (user management complete)
- ✅ Insurance: Schema deployed, API functional
- ✅ Migration audit: 378/378 archives reviewed (100%)
- ✅ Payment tables: Recovered and operational

### Week 7 Targets (Dec 18)
- ✅ Insurance: UI 100% complete
- ✅ SuperAdmin: UI Phase 2 at 80% (analytics dashboard functional)
- ✅ Production prep: Environment configured, runbook ready

### Week 8 Targets (Dec 25-31)
- ✅ Integration testing: 100% complete, 0 critical bugs
- ✅ SuperAdmin: 100% database + 75% UI
- ✅ Production deployment: v2.4.0 live
- ✅ System health: 90%+ post-deployment

### Revenue Feature Metrics (Post-Launch)
- **Dynamic Pricing Adoption:** >50% of bookings use dynamic pricing
- **Insurance Attach Rate:** >30% of bookings include insurance
- **Revenue Impact:** +15% average booking value
- **System Stability:** <1% error rate on revenue features

---

## Communication Channels

### Slack Channels
- `#engineering` - General engineering discussion
- `#migrations` - Migration coordination (timestamp protocol)
- `#code-reviews` - PR review requests
- `#deployments` - Production deployment announcements
- `#incidents` - P0/P1 incident response

### Status Updates
- **Daily:** Async standup in `#engineering` (9:00 AM)
- **Weekly:** Sprint retrospective (Fridays 4:00 PM)
- **Ad-hoc:** Merge conflict warnings, blocker escalations

### Documentation
- **Jira Board:** [MobiRides Sprint Board](https://mobi-rides.atlassian.net/sprint/5)
- **Confluence:** [Engineering Wiki](https://mobi-rides.atlassian.net/wiki)
- **GitHub:** All code reviews happen in GitHub PR comments

---

## Appendix A: Quick Reference Commands

### Daily Workflow
```bash
# Start of day
git checkout main && git pull
git checkout [your-branch]
git merge main

# Before creating migration
# Post in #migrations channel, wait for 👍

# Create migration
npx supabase migration new [description]

# Before editing high-risk file
# Post in #engineering channel

# End of day
git add .
git commit -m "[MOBI-XXX] Brief description"
git push origin [your-branch]

# Create PR with template
gh pr create --fill
```

### Emergency Hotfix
```bash
# Production is down, immediate fix needed
git checkout main
git pull
git checkout -b hotfix/MOBI-XXX-[description]
# Make minimal fix
git commit -m "hotfix: [MOBI-XXX] Critical fix"
git push origin hotfix/MOBI-XXX-[description]
# Create PR, request immediate review
# Deploy after 1 review approval
```

---

## Appendix B: Contact Information

| Engineer | Role | Primary Focus | Slack Handle | Availability |
|----------|------|---------------|--------------|--------------|
| **Teboho** | SuperAdmin Lead | Database & UI | @teboho | Mon-Fri 8am-5pm |
| **Arnold** | Senior Engineer | Infrastructure & Security | @arnold | Mon-Fri 7am-6pm |
| **Duma** | Revenue Features | Dynamic Pricing & Insurance | @duma | Mon-Fri 9am-6pm |

**Team Sync Times:**
- Daily Standup: 9:00 AM (15 min)
- Code Review Hour: 2:00 PM - 3:00 PM
- Friday Retrospective: 4:00 PM (30 min)

---

## Document Change Log

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 27/11/2025 | Arnold | Initial workflow memo created with team assignments and coordination protocols |

---

## 🔗 Quick Links

**Project Management:**
- [Jira Sprint Board](https://mobi-rides.atlassian.net/sprint/5) - Track all tickets and progress
- [Confluence Wiki](https://mobi-rides.atlassian.net/wiki) - Technical documentation
- [GitHub Repository](https://github.com/mobi-rides/mobi-rides) - Code repository

**Communication:**
- Slack: `#engineering`, `#migrations`, `#code-reviews`, `#deployments`
- Daily Standup: 9:00 AM in `#engineering`
- Weekly Retrospective: Fridays 4:00 PM

**Deployment & Monitoring:**
- [Lovable Cloud Dashboard](https://lovable.dev) - Frontend deployment
- [Supabase Dashboard](https://supabase.com/dashboard) - Database and Edge Functions
- [Production URL](https://mobi-rides.lovable.app) - Live application

---

**Next Review Date:** December 4, 2025 (End of Week 5)  
**Document Owner:** Arnold (Senior Engineer)  
**Distribution:** Teboho, Arnold, Duma, Project Manager

---

*This is a living document. Update weekly with actual progress and lessons learned.*

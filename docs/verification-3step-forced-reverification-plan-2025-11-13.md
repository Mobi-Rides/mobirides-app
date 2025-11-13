# Verification 3-Step Flow + Forced Re-Verification Plan
**Date:** November 13, 2025  
**Project:** MobiRides Platform  
**Initiative:** 3-Step Verification Flow with Database Hygiene Reset  
**Version:** 2.0 (Supersedes 2025-10-24 plan)

---

## 📋 Executive Summary

This plan implements a simplified 3-step verification flow and forces **all existing users to re-verify** for database hygiene. This approach eliminates the need for version tracking, feature flags, and gradual rollout complexity.

### Key Changes from Previous Plan
- ❌ **No version tracking** - All users reset to v2 flow
- ❌ **No feature flags** - Hard cutover via migration
- ❌ **No v1/v2 badges** - Only v2 exists post-migration
- ✅ **Forced re-verification** - All existing verifications reset
- ✅ **Simplified UI** - 3 steps instead of 7
- ✅ **Fewer documents** - 3 instead of 5 required

### Success Metrics
- **User Completion Rate:** Target 85% (up from 60%)
- **Average Completion Time:** Target 6 minutes (down from 15 minutes)
- **Database Hygiene:** 100% consistent schema usage
- **Document Requirements:** Reduced by 40% (5 → 3 documents)

---

## 🎯 Implementation Overview

**Total Effort:** 3 weeks, 34 Story Points  
**Phases:** 6 (Database → Frontend → Service → Admin → Notifications → Testing)  
**Deployment Strategy:** Single migration + forced reset

---

## Phase 1: Database Schema Updates (Week 1, Days 1-2)
**Story Points:** 8 SP  
**Priority:** CRITICAL

### Migration: `20251113000001_verification_3step_forced_reset.sql`

#### Changes:
1. **Update verification_step enum** (remove legacy steps)
   - Keep: `personal_info`, `document_upload`, `review_submit`, `processing_status`, `completion`
   - Remove: `phone_verification`, `selfie_verification`, `address_confirmation`

2. **Remove phone_verified gating** from completion logic
   - Old: `personal_info + documents + selfie + phone + address = complete`
   - New: `personal_info + documents + address = complete`

3. **Reset ALL existing verifications**
   - Set `overall_status = 'requires_reverification'`
   - Reset all completion flags to `false`
   - Add reset tracking: `reset_at`, `reset_reason` columns
   - Update `admin_notes` with migration timestamp

4. **Update completion trigger function**
   - Remove `phone_verified` check
   - 3-step logic: `personal_info_completed AND documents_completed AND address_confirmed`

#### Testing Checklist:
- [ ] Enum update doesn't break existing queries
- [ ] Completion trigger uses 3-step logic
- [ ] All verifications marked `requires_reverification`
- [ ] Reset timestamps recorded correctly

---

## Phase 2: Frontend Component Updates (Week 1, Days 3-5)
**Story Points:** 13 SP

### A. Progress Indicator (2 SP)
**File:** `src/components/verification/SimpleDotProgress.tsx`

**Changes:**
- Reduce steps from 5 → 3
- Labels: "Personal Info", "Documents", "Review & Submit"
- Remove phone/selfie/address dots

### B. Document Upload Step (5 SP)
**File:** `src/components/verification/steps/DocumentUploadStep.tsx`

**Changes:**
- Required documents reduced to 3:
  1. `NATIONAL_ID_FRONT`
  2. `NATIONAL_ID_BACK`
  3. `PROOF_OF_INCOME`
- Remove:
  - `DRIVING_LICENSE_FRONT`
  - `DRIVING_LICENSE_BACK`
- Update UI grid to show 3 cards
- Update completion logic: `allDocsUploaded = uploadedDocs.length >= 3`
- Remove phone verification prompt/modal

### C. Review & Submit Step (4 SP)
**File:** `src/components/verification/steps/ReviewSubmitStep.tsx`

**Changes:**
- Remove phone verification check from `canSubmit`
- Update review sections to 3 items:
  1. Personal Information
  2. Documents Uploaded (3)
  3. ~~Phone Verified~~ (REMOVED)
- Update submission requirements text
- Remove phone verification status badge

### D. Verification Hub (2 SP)
**File:** `src/components/verification/VerificationHub.tsx`

**Changes:**
- Update step routing logic (remove phone/selfie/address cases)
- Update step navigation guard logic
- Ensure proper flow: personal_info → document_upload → review_submit

---

## Phase 3: Service Layer Updates (Week 2, Days 1-2)
**Story Points:** 5 SP

### File: `src/services/verificationService.ts`

**Changes:**
1. **Update `completeDocumentUpload()`**
   - Check for exactly 3 documents: `national_id_front`, `national_id_back`, `proof_of_income`
   - Remove driving license checks
   - Update `documents_completed` flag when all 3 uploaded

2. **Remove methods:**
   - ❌ `updatePhoneVerification()`
   - ❌ `completeSelfieVerification()`
   - ❌ `updateAddressConfirmation()` (kept but auto-completed)

3. **Update `submitForReview()`**
   - Remove phone verification prerequisite
   - Check only: `personal_info_completed AND documents_completed`

---

## Phase 4: Admin Interface Updates (Week 2, Days 3-5)
**Story Points:** 5 SP

### A. Verification Management Table (3 SP)
**File:** `src/components/admin/VerificationManagementTable.tsx`

**Changes:**
- Add `requires_reverification` status badge (red/destructive)
- Add filter for "Requires Re-Verification" status
- Update completion percentage calculation (3 steps):
  ```typescript
  const completion = (completed_steps / 3) * 100;
  // completed_steps = personal_info + documents + overall_complete
  ```
- Update step progress display (show 3 steps max)

### B. Verification Review Dialog (2 SP)
**File:** `src/components/admin/VerificationReviewDialog.tsx`

**Changes:**
- Update review checklist to 3 items
- Show `reset_reason` and `reset_at` if exists (info alert)
- Update document count display: "Documents (3 required)"
- Remove phone verification section

---

## Phase 5: User Notification System (Week 3, Days 1-2)
**Story Points:** 3 SP

### A. In-App Banner Component (1 SP)
**File:** `src/components/verification/ReverificationBanner.tsx` (NEW)

**Purpose:** Alert users with `requires_reverification` status

**Features:**
- Warning alert with icon
- Clear explanation of why re-verification needed
- "Start Verification" CTA button
- Auto-dismiss after completion

**Implementation:**
```typescript
export const ReverificationBanner = () => {
  const { verificationData } = useVerificationStatus();
  
  if (verificationData?.overall_status !== 'requires_reverification') {
    return null;
  }
  
  return (
    <Alert variant="warning" className="mb-4">
      <AlertTriangle className="h-4 w-4" />
      <AlertTitle>Verification Update Required</AlertTitle>
      <AlertDescription>
        MobiRides has updated our verification process for improved security.
        Please complete the new 3-step verification to continue.
        <Button asChild className="mt-2">
          <Link to="/verification">Start Verification</Link>
        </Button>
      </AlertDescription>
    </Alert>
  );
};
```

### B. Email Notification (2 SP)
**File:** `supabase/functions/notify-reverification/index.ts` (NEW)

**Purpose:** Send email to all users requiring re-verification

**Email Template:**
- Subject: "Action Required: Complete New Verification Process"
- Body: Explain 3-step process, benefits, and CTA
- Send to: All users with `overall_status = 'requires_reverification'`

---

## Phase 6: Testing & Validation (Week 3, Days 3-5)
**Story Points:** Included in each phase

### Test Scenarios

#### Functional Testing
- [ ] **Fresh User Flow**: New user completes 3 steps successfully
- [ ] **Existing User Flow**: User with reset status forced to reverify
- [ ] **Document Upload**: Only 3 documents accepted
- [ ] **No Phone Gate**: Can submit without phone verification
- [ ] **Completion Logic**: Marks complete with 3 steps only
- [ ] **Admin Review**: Admin sees 3-step progress correctly

#### Data Integrity Testing
- [ ] Migration resets all verifications correctly
- [ ] Reset timestamps recorded accurately
- [ ] Admin notes updated with migration info
- [ ] No orphaned verification data

#### UI Testing
- [ ] Progress dots show 3 steps
- [ ] Document cards show 3 slots
- [ ] Review step shows 3 sections
- [ ] Banner displays for reset users
- [ ] Admin table shows reset status

#### Migration Testing
```bash
# Local testing
supabase db reset --local
supabase db push --local

# Verify enum changes
psql -d postgres -c "SELECT enumlabel FROM pg_enum WHERE enumtypid = 'verification_step'::regtype"

# Verify reset worked
psql -d postgres -c "SELECT overall_status, reset_reason, reset_at FROM user_verifications"

# Check completion trigger
psql -d postgres -c "SELECT proname, prosrc FROM pg_proc WHERE proname = 'check_verification_completion'"
```

---

## 🚫 What We're NOT Implementing

These features are **not needed** due to forced re-verification approach:

### Removed from Scope
❌ **Version tracking column** (`migration_version`) - All data is v2  
❌ **Version badges** in admin UI - No mixed versions exist  
❌ **Version filters** in admin table - Only v2 data post-migration  
❌ **Feature flags** for gradual rollout - Hard cutover via migration  
❌ **v1/v2 conditional rendering** - Only v2 code paths exist  
❌ **Data conversion scripts** - We reset instead of convert  
❌ **Backward compatibility code** - No legacy support needed  
❌ **A/B testing framework** - Single unified experience  

**Complexity Reduction:** ~13 Story Points saved, cleaner codebase

---

## 📊 Database Schema Changes

### user_verifications Table

#### New Columns
```sql
ALTER TABLE user_verifications 
ADD COLUMN IF NOT EXISTS reset_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS reset_reason text;
```

#### Updated Enums
```sql
-- verification_step enum
-- Before: personal_info, phone_verification, selfie_verification, 
--         address_confirmation, document_upload, review_submit, 
--         processing_status, completion
-- After: personal_info, document_upload, review_submit, 
--        processing_status, completion
```

#### Completion Logic (Updated Trigger)
```sql
-- Old logic
IF personal_info_completed AND documents_completed AND 
   selfie_completed AND phone_verified AND address_confirmed
   
-- New logic  
IF personal_info_completed AND documents_completed AND address_confirmed
```

---

## 🎯 Success Metrics & KPIs

### Database Hygiene
- ✅ **100% consistent schema** - All verifications use v2 flow
- ✅ **Zero orphaned data** - No phone/selfie verification records
- ✅ **Audit trail** - Clear reset tracking via `reset_at` and `reset_reason`

### User Experience
- ✅ **57% fewer steps** - 3 steps vs 7 steps
- ✅ **40% fewer documents** - 3 vs 5 required
- ✅ **60% faster completion** - 6 min vs 15 min average
- ✅ **Clear communication** - Banner + email for reset users

### Admin Experience
- ✅ **Simpler review** - 3 checkpoints vs 7
- ✅ **Reset visibility** - See why users were reset
- ✅ **Consistent data** - All verifications in same format

### Technical
- ✅ **Reduced complexity** - Single verification version
- ✅ **Cleaner codebase** - Removed unused components
- ✅ **Faster queries** - Simplified completion logic
- ✅ **Better maintainability** - No conditional version logic

---

## ⚠️ Risk Mitigation

### Risk: User Pushback on Re-Verification
**Impact:** Medium | **Probability:** High

**Mitigation:**
- Clear communication about security improvements
- Highlight reduced requirements (3 docs vs 5)
- Faster process (6 min vs 15 min)
- Customer support channel for issues
- Grace period before enforcement

### Risk: Incomplete Re-Verifications
**Impact:** High | **Probability:** Medium

**Mitigation:**
- Send reminder emails (7-day, 14-day, 30-day)
- Block high-risk actions until verified
- Grace period: 45 days before hard block
- Provide in-app guidance

### Risk: Data Loss Concerns
**Impact:** Low | **Probability:** Low

**Mitigation:**
- Store reset reason in `admin_notes` for audit
- Keep `reset_at` timestamp for tracking
- Admins can view previous attempt info
- No actual data deletion (just reset flags)

### Risk: Production Downtime
**Impact:** High | **Probability:** Low

**Mitigation:**
- Run migration during low-traffic period (3-5 AM)
- Test on staging environment first
- Have rollback script ready
- Monitor error rates post-deployment
- Gradual traffic ramp-up

---

## 🔄 Rollback Plan

### If Issues Detected Within 24 Hours

#### Rollback Migration Script
```sql
-- Restore old enum
DROP TYPE IF EXISTS verification_step CASCADE;
CREATE TYPE verification_step AS ENUM (
  'personal_info',
  'phone_verification',
  'selfie_verification',
  'address_confirmation',
  'document_upload',
  'review_submit',
  'processing_status',
  'completion'
);

-- Restore old completion logic
CREATE OR REPLACE FUNCTION check_verification_completion()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.personal_info_completed = true 
       AND NEW.documents_completed = true 
       AND NEW.selfie_completed = true
       AND NEW.phone_verified = true
       AND NEW.address_confirmed = true 
       AND NEW.overall_status != 'completed' THEN
        NEW.overall_status := 'completed';
        NEW.completed_at := NOW();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Restore verification statuses
UPDATE user_verifications 
SET overall_status = 'in_progress'
WHERE reset_at = '[migration_timestamp]';
```

#### Rollback Checklist
- [ ] Deploy rollback migration
- [ ] Redeploy v1 frontend code
- [ ] Notify affected users
- [ ] Schedule post-mortem
- [ ] Document issues for retry

---

## 📅 Implementation Timeline

### Week 1: Foundation
**Days 1-2:** Database Migration
- Create and test migration script
- Run on staging environment
- Verify enum changes
- Confirm reset logic

**Days 3-5:** Frontend Components
- Update `SimpleDotProgress` (3 steps)
- Update `DocumentUploadStep` (3 docs)
- Update `ReviewSubmitStep` (no phone)
- Update `VerificationHub` (routing)

### Week 2: Integration
**Days 1-2:** Service Layer
- Update `verificationService.ts`
- Remove phone/selfie methods
- Update document validation
- Update completion checks

**Days 3-5:** Admin Interface
- Update `VerificationManagementTable`
- Update `VerificationReviewDialog`
- Add reset status filters
- Add reset reason display

### Week 3: Launch
**Days 1-2:** Notifications
- Create `ReverificationBanner` component
- Build email notification function
- Send initial notification batch
- Monitor user responses

**Days 3-5:** Testing & Deployment
- End-to-end testing
- Performance testing
- Staging deployment
- Production deployment
- Monitor metrics

---

## 📝 Jira Task Breakdown

### Epic
```
VERIFY-2.0 | Epic | 3-Step Verification + Forced Re-Verification | 34 SP | Highest | Sprint 25
```

### Phase 1: Database (8 SP)
```
VERIFY-2.1 | Task | Create 3-Step Verification Migration Script | 5 SP | Highest | Sprint 25.1
VERIFY-2.2 | Task | Update Completion Trigger Function | 2 SP | Highest | Sprint 25.1
VERIFY-2.3 | Task | Test Migration on Staging | 1 SP | High | Sprint 25.1
```

### Phase 2: Frontend (13 SP)
```
VERIFY-2.4 | Story | Update SimpleDotProgress to 3 Steps | 2 SP | High | Sprint 25.2
VERIFY-2.5 | Story | Update DocumentUploadStep to 3 Documents | 5 SP | High | Sprint 25.2
VERIFY-2.6 | Story | Update ReviewSubmitStep (Remove Phone) | 4 SP | High | Sprint 25.2
VERIFY-2.7 | Task | Update VerificationHub Step Routing | 2 SP | High | Sprint 25.2
```

### Phase 3: Service Layer (5 SP)
```
VERIFY-2.8 | Task | Update verificationService.ts for 3-Step Flow | 5 SP | High | Sprint 25.3
```

### Phase 4: Admin UI (5 SP)
```
VERIFY-2.9 | Task | Update VerificationManagementTable | 3 SP | Medium | Sprint 25.4
VERIFY-2.10 | Task | Update VerificationReviewDialog | 2 SP | Medium | Sprint 25.4
```

### Phase 5: Notifications (3 SP)
```
VERIFY-2.11 | Story | Create ReverificationBanner Component | 1 SP | Medium | Sprint 25.5
VERIFY-2.12 | Task | Build Email Notification Function | 2 SP | Medium | Sprint 25.5
```

### Phase 6: Testing (Included)
```
VERIFY-2.13 | Task | End-to-End Testing & QA | Included | High | Sprint 25.6
```

---

## 🔗 Related Documents

### Current Plan
- **This Document:** `docs/verification-3step-forced-reverification-plan-2025-11-13.md`

### Previous Plans (Archived)
- `.trae/documents/verification-simplification-implementation-plan-2025-10-24.md` (Superseded)

### Related Initiatives
- `docs/migration-rls-consolidation-plan-2025-11-12.md` (Database cleanup)
- `docs/rls-security-architecture-overhaul-2025-10-30.md` (Security improvements)
- `docs/ROADMAP-NOV-DEC-2025.md` (Overall roadmap)

---

## 📞 Support & Communication

### User Communication Channels
- **In-App Banner:** `ReverificationBanner` component
- **Email Notification:** Sent to all affected users
- **Support Channel:** support@mobirides.com
- **FAQ Page:** `/help/reverification-faq`

### Team Communication
- **Daily Standups:** Migration progress updates
- **Slack Channel:** #verification-migration
- **Incident Response:** On-call rotation during deployment week

---

## ✅ Definition of Done

### Database
- [ ] Migration script created and tested
- [ ] All verifications reset to `requires_reverification`
- [ ] Enum updated to 3-step flow
- [ ] Completion trigger updated (no phone check)
- [ ] Reset tracking columns added

### Frontend
- [ ] Progress indicator shows 3 steps
- [ ] Document upload requires 3 docs only
- [ ] Review step shows 3 sections
- [ ] No phone verification gates exist
- [ ] Banner component displays for reset users

### Service Layer
- [ ] Document validation checks 3 docs
- [ ] Phone verification methods removed
- [ ] Completion logic uses 3 steps
- [ ] Service tests updated

### Admin Interface
- [ ] Table shows reset status badge
- [ ] Filter for reset users exists
- [ ] Review dialog shows 3 steps
- [ ] Reset reason displayed

### Testing
- [ ] All test scenarios pass
- [ ] Migration tested on staging
- [ ] Performance benchmarks met
- [ ] No breaking changes to other features

### Deployment
- [ ] Production deployment successful
- [ ] No critical errors in logs
- [ ] User metrics within expected range
- [ ] Rollback plan ready if needed

---

**Status:** Ready for Implementation  
**Next Action:** Begin Phase 1 - Database Migration  
**Owner:** Backend Team Lead  
**Timeline:** 3 weeks (Start: Nov 13, 2025 | End: Dec 4, 2025)

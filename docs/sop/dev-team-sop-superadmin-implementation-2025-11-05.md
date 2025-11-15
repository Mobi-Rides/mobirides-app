# Standard Operating Procedure: Super Admin Implementation

**Document Version:** 1.0  
**Effective Date:** November 5, 2025  
**Document Owner:** Development Team Lead  
**Last Updated:** November 5, 2025  
**Review Cycle:** Quarterly

---

## Table of Contents

1. [Purpose & Scope](#purpose--scope)
2. [Roles & Responsibilities](#roles--responsibilities)
3. [Prerequisites](#prerequisites)
4. [Implementation Workflow](#implementation-workflow)
5. [Practical Examples](#practical-examples)
6. [Quality Gates & Checkpoints](#quality-gates--checkpoints)
7. [Testing Procedures](#testing-procedures)
8. [Emergency Procedures](#emergency-procedures)
9. [References](#references)

---

## Purpose & Scope

### Purpose
This SOP defines the standardized process for implementing Super Admin functionality features in the MobiRides application. It ensures consistency, quality, and traceability across all development activities related to the Super Admin implementation plan.

### Scope
This SOP applies to:
- All developers working on Super Admin features
- Code reviewers and QA team members
- Product managers overseeing Super Admin deployment
- Any team member making changes to admin-related functionality

### Related Implementation Plans
- `PHASE_1_SUPERADMIN_IMPLEMENTATION_PLAN.md` - Core SuperAdmin Features
- `SuperAdmin_Functionality_Analysis_Report.md` - Comprehensive analysis
- Any epic-specific implementation documents

---

## Roles & Responsibilities

### Developer
- Execute implementation according to this SOP
- Validate current state before starting work
- Create and maintain task lists
- Submit pull requests with complete documentation
- Coordinate testing activities

### Code Reviewer
- Review code against implementation plan
- Verify adherence to coding standards
- Approve or request changes on pull requests
- Ensure documentation is complete

### QA Team
- Execute testing protocols
- Document and report bugs
- Verify fixes before deployment
- Sign off on functionality

### Product Manager
- Approve production deployments
- Monitor implementation progress
- Coordinate with stakeholders
- Make go/no-go decisions

---

## Prerequisites

### Required Access & Tools
- [ ] Git access to the MobiRides repository
- [ ] Linear account with project access
- [ ] Slack access to #testing channel
- [ ] Jira access (for epic/task reference)
- [ ] IDE configured with project dependencies
- [ ] Supabase access (for database queries)
- [ ] Local development environment running

### Required Knowledge
- Understanding of React, TypeScript, and Supabase
- Familiarity with Super Admin implementation plans
- Knowledge of RLS policies and security best practices
- Git workflow and branching strategy

### Pre-Implementation Checklist
- [ ] Review assigned epic/task in Linear
- [ ] Read related implementation plan thoroughly
- [ ] Understand acceptance criteria
- [ ] Identify dependencies on other features
- [ ] Estimate effort and complexity

---

## Implementation Workflow

## Phase 1: Pre-Implementation Setup

### 1.1 Pull Latest Code

**Objective:** Ensure your local environment has the latest codebase changes.

```bash
# Navigate to project directory
cd mobirdes

# Ensure you're on develop branch
git checkout develop

# Pull latest changes
git pull origin develop

# Create feature branch with descriptive name
git checkout -b feature/superadmin-[epic-name]-[ticket-number]

# Example:
git checkout -b feature/superadmin-enhanced-user-mgmt-ADMIN-002
```

### 1.2 Environment Verification

```bash
# Install/update dependencies
npm install

# Verify environment is working
npm run dev

# Run type checks
npm run type-check

# Run linter
npm run lint
```

### 1.3 Documentation Review

Read the following in order:
1. **Primary Implementation Plan**: `PHASE_1_SUPERADMIN_IMPLEMENTATION_PLAN.md`
2. **Epic-Specific Sections**: Locate your assigned epic (e.g., ADMIN-002)
3. **Related Analysis**: Review `SuperAdmin_Functionality_Analysis_Report.md`
4. **Database Schema**: Check for required tables/columns

---

## Phase 2: Validation & Planning

### 2.1 Request Current State Validation

**Objective:** Analyze the current codebase to identify what has changed since the implementation plan was created and what needs to be updated.

#### IDE Query Examples for Validation

**Example 1: Validate User Management Components**
```typescript
// Search Query 1: Find all admin user management components
// IDE Search: src/components/admin/*User*.tsx

// Search Query 2: Check for existing user restriction logic
// IDE Search: "suspend|ban|restrict" in src/

// Search Query 3: Find user-related hooks
// IDE Search: useAdmin* in src/hooks/

// Search Query 4: Check for user deletion functions
// IDE Search: "deleteUser|removeUser" in src/services/
```

**Example 2: Validate Database Functions**
```sql
-- Query Supabase for existing admin functions
SELECT routine_name, routine_type 
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name LIKE '%admin%';

-- Check for existing RLS policies on profiles table
SELECT * FROM pg_policies 
WHERE tablename = 'profiles';
```

**Example 3: Check Implementation Status**
```bash
# Search for TODO comments related to your epic
grep -r "TODO.*ADMIN-002" src/

# Find files modified recently that might affect your work
git log --since="2 weeks ago" --name-only --pretty=format: | sort | uniq

# Search for references to tables you'll be working with
grep -r "admin_activity_logs\|admin_sessions" src/
```

### 2.2 Epic Specification & Impact Analysis

**Create a validation document** answering these questions:

#### Validation Checklist Template

```markdown
# Validation Report: [Epic Name] - [Date]

## Epic Reference
- **Epic ID**: ADMIN-002
- **Epic Name**: Enhanced User Management
- **Story Points**: 8 SP
- **Priority**: High

## Current State Analysis

### Existing Components
- [ ] List all existing components that will be modified
- [ ] Identify components that might conflict with new features
- [ ] Note deprecated patterns that should be updated

### Database State
- [ ] Required tables exist: Yes/No
- [ ] RLS policies in place: Yes/No
- [ ] Required functions exist: Yes/No
- [ ] Migration needed: Yes/No

### Dependencies Identified
- [ ] Other epics that must be completed first
- [ ] Shared components that will be affected
- [ ] API endpoints that need updating

## Gaps & Changes Required

### Deviations from Implementation Plan
1. [List any differences between plan and current state]
2. [Note any assumptions in the plan that are no longer valid]

### Additional Work Identified
1. [Tasks not in original plan that are now needed]
2. [Technical debt that should be addressed]

### Cross-Module Impact
- **User Verification Module**: [Impact description]
- **Booking Module**: [Impact description]
- **Notification Module**: [Impact description]

## Recommendations

### Plan Updates Required
- [ ] Update PHASE_1_SUPERADMIN_IMPLEMENTATION_PLAN.md
- [ ] Create additional sub-tasks in Linear
- [ ] Adjust story point estimates

### Risk Mitigation
- [List potential risks and mitigation strategies]
```

### 2.3 Cross-Reference with Other Plans

**Search for related implementation work:**

```bash
# Find all implementation plan documents
find .trae/documents -name "*implementation*.md"

# Search for mentions of your epic across all docs
grep -r "ADMIN-002\|Enhanced User Management" .trae/

# Check for database schema changes in other plans
grep -r "CREATE TABLE\|ALTER TABLE" .trae/documents/
```

---

## Phase 3: Task Planning & Documentation

### 3.1 Generate IDE To-Do List

**Create a task list in Jira/Linear format** that breaks down the epic into actionable items.

#### To-Do List Template (Jira Format)

```markdown
# Epic: ADMIN-002 - Enhanced User Management

## Technical Tasks

### ADMIN-T005: Create AdvancedUserManagement Component (5 SP)

**Acceptance Criteria:**
- [ ] Component renders user list with search/filter
- [ ] Suspend user dialog implemented
- [ ] Ban user dialog implemented
- [ ] Delete user with asset transfer dialog implemented
- [ ] All actions logged to admin_activity_logs
- [ ] User receives notification on status change

**Subtasks:**
- [ ] ADMIN-T005-1: Create component structure and state management (1 SP)
- [ ] ADMIN-T005-2: Implement suspend user functionality (1 SP)
- [ ] ADMIN-T005-3: Implement ban user functionality (1 SP)
- [ ] ADMIN-T005-4: Implement delete user with asset transfer (2 SP)

**Files to Create:**
- `src/components/admin/AdvancedUserManagement.tsx`
- `src/components/admin/dialogs/SuspendUserDialog.tsx`
- `src/components/admin/dialogs/BanUserDialog.tsx`
- `src/components/admin/dialogs/DeleteUserDialog.tsx`
- `src/hooks/useUserRestrictions.ts`

**Files to Modify:**
- `src/pages/Admin.tsx` - Add new component to admin dashboard
- `src/components/admin/UserManagementTable.tsx` - Add action buttons

**Database Requirements:**
- Migration needed: Yes
- Tables: user_restrictions, admin_activity_logs
- Functions: suspend_user, ban_user, delete_user_with_transfer

**Dependencies:**
- Requires ADMIN-001 (Database Schema) to be completed
- Depends on audit logging infrastructure

**Testing Requirements:**
- Unit tests for all dialogs
- Integration tests for user actions
- E2E test for complete workflow
- Security testing for RLS policies

---

### ADMIN-T006: Implement User Restriction APIs (3 SP)

**Acceptance Criteria:**
- [ ] suspend_user RPC function created
- [ ] ban_user RPC function created
- [ ] delete_user_with_transfer RPC function created
- [ ] Asset transfer logic implemented
- [ ] All functions log to audit trail

**Subtasks:**
- [ ] ADMIN-T006-1: Create database migration for user_restrictions table (1 SP)
- [ ] ADMIN-T006-2: Implement suspend_user function (0.5 SP)
- [ ] ADMIN-T006-3: Implement ban_user function (0.5 SP)
- [ ] ADMIN-T006-4: Implement delete_user_with_transfer function (1 SP)

**Database Migration Script:**
```sql
-- See migration file: supabase/migrations/YYYYMMDD_user_restrictions.sql
CREATE TABLE IF NOT EXISTS public.user_restrictions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  restriction_type TEXT NOT NULL CHECK (restriction_type IN ('suspended', 'banned')),
  reason TEXT NOT NULL,
  restricted_by UUID REFERENCES auth.users(id),
  restricted_at TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ,
  active BOOLEAN DEFAULT true
);
```

**Files to Create:**
- `supabase/migrations/[timestamp]_user_restrictions.sql`
- `src/services/userRestrictionService.ts`

**Files to Modify:**
- `src/integrations/supabase/types.ts` (auto-generated after migration)

**Testing Requirements:**
- Database function tests
- RLS policy tests
- API integration tests
```

### 3.2 Push To-Do List to Linear

**Using Linear CLI or Web Interface:**

```bash
# Install Linear CLI (if not already installed)
npm install -g @linear/cli

# Authenticate
linear auth

# Create issues from your task list
linear issue create \
  --title "ADMIN-T005-1: Create component structure" \
  --description "Create AdvancedUserManagement component structure and state management" \
  --priority high \
  --estimate 1 \
  --project "Super Admin Implementation"

# Link to epic
linear issue update ADMIN-T005-1 --parent ADMIN-002

# Add labels
linear issue update ADMIN-T005-1 --label "frontend,admin,enhancement"
```

**Linear Task Template:**

```
Title: ADMIN-T005-1: Create component structure and state management

Description:
Create the basic structure for the AdvancedUserManagement component with necessary state management hooks.

## Acceptance Criteria
- [ ] Component file created with TypeScript interfaces
- [ ] State hooks initialized (search, filters, selected users)
- [ ] Basic layout with search bar and user table
- [ ] Loading and error states handled

## Technical Notes
- Use shadcn/ui components for consistency
- Follow existing admin component patterns
- Ensure responsive design

## Files Affected
- src/components/admin/AdvancedUserManagement.tsx (new)

## Dependencies
- None

## Estimate
1 Story Point

## Labels
frontend, admin, component, enhancement
```

### 3.3 Update Implementation Plan

**If your validation revealed changes, update the implementation plan:**

```bash
# Open the implementation plan
code PHASE_1_SUPERADMIN_IMPLEMENTATION_PLAN.md

# Document changes in a changelog section at the top
```

**Example Update:**

```markdown
## Changelog

### 2025-11-05 - Developer: [Your Name]
**Epic**: ADMIN-002 - Enhanced User Management

**Changes Identified:**
1. Added requirement for password reset notification integration
2. Identified need for bulk user operations (not in original plan)
3. Updated story points from 8 SP to 10 SP due to added notification requirements

**New Dependencies:**
- Requires notification service to be updated with new event types
- Asset transfer logic needs to handle edge cases for users with active bookings

**Updated Timeline:**
- Original: Week 3
- Revised: Week 3-4 (extended by 3 days)

**Impact on Other Epics:**
- ADMIN-003 may need to wait for asset transfer logic to be finalized
```

**Commit the update:**

```bash
git add PHASE_1_SUPERADMIN_IMPLEMENTATION_PLAN.md
git commit -m "docs: Update ADMIN-002 implementation plan based on validation"
git push origin feature/superadmin-enhanced-user-mgmt-ADMIN-002
```

---

## Phase 4: Implementation

### 4.1 Task-by-Task Development

**Work through your to-do list systematically, one subtask at a time.**

#### Implementation Best Practices

1. **Start with Database Migrations**
   - Always create database changes first
   - Test migrations in local environment
   - Include rollback procedures

```sql
-- supabase/migrations/20251105000000_user_restrictions.sql

-- Migration: Create user_restrictions table
CREATE TABLE IF NOT EXISTS public.user_restrictions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  restriction_type TEXT NOT NULL CHECK (restriction_type IN ('suspended', 'banned')),
  reason TEXT NOT NULL,
  restricted_by UUID NOT NULL REFERENCES auth.users(id),
  restricted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ,
  active BOOLEAN NOT NULL DEFAULT true,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_restrictions ENABLE ROW LEVEL SECURITY;

-- Admins can view all restrictions
CREATE POLICY "Admins can view all user restrictions"
ON public.user_restrictions FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.admins
    WHERE admins.id = auth.uid()
  )
);

-- Admins can insert restrictions
CREATE POLICY "Admins can create user restrictions"
ON public.user_restrictions FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.admins
    WHERE admins.id = auth.uid()
  )
);

-- Create indexes for performance
CREATE INDEX idx_user_restrictions_user_id ON public.user_restrictions(user_id);
CREATE INDEX idx_user_restrictions_active ON public.user_restrictions(active) WHERE active = true;

-- Create function to suspend user
CREATE OR REPLACE FUNCTION public.suspend_user(
  p_user_id UUID,
  p_reason TEXT,
  p_duration INTERVAL DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_expires_at TIMESTAMPTZ;
  v_restriction_id UUID;
  v_result JSON;
BEGIN
  -- Check if caller is admin
  IF NOT EXISTS (SELECT 1 FROM public.admins WHERE id = auth.uid()) THEN
    RAISE EXCEPTION 'Unauthorized: Only admins can suspend users';
  END IF;

  -- Calculate expiration if duration provided
  IF p_duration IS NOT NULL THEN
    v_expires_at := now() + p_duration;
  END IF;

  -- Deactivate any existing restrictions for this user
  UPDATE public.user_restrictions
  SET active = false
  WHERE user_id = p_user_id AND active = true;

  -- Create new restriction
  INSERT INTO public.user_restrictions (
    user_id,
    restriction_type,
    reason,
    restricted_by,
    expires_at
  ) VALUES (
    p_user_id,
    'suspended',
    p_reason,
    auth.uid(),
    v_expires_at
  )
  RETURNING id INTO v_restriction_id;

  -- Log to admin activity
  PERFORM log_admin_activity(
    auth.uid(),
    'user_suspended',
    'user',
    p_user_id::text,
    jsonb_build_object(
      'reason', p_reason,
      'expires_at', v_expires_at,
      'restriction_id', v_restriction_id
    )
  );

  -- Build result
  v_result := json_build_object(
    'success', true,
    'restriction_id', v_restriction_id,
    'user_id', p_user_id,
    'expires_at', v_expires_at
  );

  RETURN v_result;
END;
$$;

-- Rollback procedure
-- DROP FUNCTION IF EXISTS public.suspend_user(UUID, TEXT, INTERVAL);
-- DROP TABLE IF EXISTS public.user_restrictions CASCADE;
```

2. **Create Service Layer Functions**

```typescript
// src/services/userRestrictionService.ts

import { supabase } from "@/integrations/supabase/client";

export interface SuspendUserParams {
  userId: string;
  reason: string;
  durationDays?: number;
}

export interface BanUserParams {
  userId: string;
  reason: string;
}

export interface UserRestriction {
  id: string;
  user_id: string;
  restriction_type: 'suspended' | 'banned';
  reason: string;
  restricted_by: string;
  restricted_at: string;
  expires_at: string | null;
  active: boolean;
}

/**
 * Suspend a user for a specified duration
 */
export const suspendUser = async ({
  userId,
  reason,
  durationDays
}: SuspendUserParams): Promise<{ success: boolean; error?: string }> => {
  try {
    // Calculate duration interval if provided
    const duration = durationDays ? `${durationDays} days` : null;

    const { data, error } = await supabase.rpc('suspend_user', {
      p_user_id: userId,
      p_reason: reason,
      p_duration: duration
    });

    if (error) {
      console.error('Error suspending user:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error('Error suspending user:', error);
    return { success: false, error: 'Failed to suspend user' };
  }
};

/**
 * Ban a user permanently
 */
export const banUser = async ({
  userId,
  reason
}: BanUserParams): Promise<{ success: boolean; error?: string }> => {
  try {
    const { data, error } = await supabase.rpc('ban_user', {
      p_user_id: userId,
      p_reason: reason
    });

    if (error) {
      console.error('Error banning user:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error('Error banning user:', error);
    return { success: false, error: 'Failed to ban user' };
  }
};

/**
 * Get active restrictions for a user
 */
export const getUserRestrictions = async (
  userId: string
): Promise<UserRestriction[]> => {
  try {
    const { data, error } = await supabase
      .from('user_restrictions')
      .select('*')
      .eq('user_id', userId)
      .eq('active', true)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching user restrictions:', error);
      return [];
    }

    return data as UserRestriction[];
  } catch (error) {
    console.error('Error fetching user restrictions:', error);
    return [];
  }
};

/**
 * Lift a restriction (unsuspend/unban)
 */
export const liftRestriction = async (
  restrictionId: string
): Promise<{ success: boolean; error?: string }> => {
  try {
    const { error } = await supabase
      .from('user_restrictions')
      .update({ active: false })
      .eq('id', restrictionId);

    if (error) {
      console.error('Error lifting restriction:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error('Error lifting restriction:', error);
    return { success: false, error: 'Failed to lift restriction' };
  }
};
```

3. **Create React Components**

```typescript
// src/components/admin/dialogs/SuspendUserDialog.tsx

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { suspendUser } from "@/services/userRestrictionService";

interface SuspendUserDialogProps {
  userId: string;
  userName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export const SuspendUserDialog = ({
  userId,
  userName,
  open,
  onOpenChange,
  onSuccess
}: SuspendUserDialogProps) => {
  const [reason, setReason] = useState("");
  const [duration, setDuration] = useState<string>("7");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!reason.trim()) {
      toast.error("Please provide a reason for suspension");
      return;
    }

    setIsSubmitting(true);

    const result = await suspendUser({
      userId,
      reason: reason.trim(),
      durationDays: parseInt(duration)
    });

    setIsSubmitting(false);

    if (result.success) {
      toast.success(`User ${userName} has been suspended for ${duration} days`);
      onSuccess();
      onOpenChange(false);
      setReason("");
    } else {
      toast.error(result.error || "Failed to suspend user");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Suspend User: {userName}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label htmlFor="duration">Suspension Duration</Label>
            <Select value={duration} onValueChange={setDuration}>
              <SelectTrigger id="duration">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">1 day</SelectItem>
                <SelectItem value="3">3 days</SelectItem>
                <SelectItem value="7">7 days</SelectItem>
                <SelectItem value="14">14 days</SelectItem>
                <SelectItem value="30">30 days</SelectItem>
                <SelectItem value="90">90 days</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="reason">Reason for Suspension *</Label>
            <Textarea
              id="reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Provide a detailed reason for suspending this user..."
              rows={4}
              className="mt-1"
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleSubmit}
              disabled={isSubmitting}
            >
              {isSubmitting ? "Suspending..." : "Suspend User"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
```

### 4.2 Commit Strategy

**Use atomic, descriptive commits:**

```bash
# Stage specific files
git add supabase/migrations/20251105000000_user_restrictions.sql
git commit -m "feat(db): Add user_restrictions table and suspend_user function

- Create user_restrictions table with RLS policies
- Implement suspend_user RPC function with duration support
- Add indexes for performance
- Include rollback procedure

Related: ADMIN-T006-2"

# Stage service layer
git add src/services/userRestrictionService.ts
git commit -m "feat(api): Add user restriction service functions

- suspendUser function with duration support
- banUser function for permanent restrictions
- getUserRestrictions for fetching active restrictions
- liftRestriction for removing restrictions

Related: ADMIN-T006-3"

# Stage component
git add src/components/admin/dialogs/SuspendUserDialog.tsx
git commit -m "feat(admin): Add suspend user dialog component

- Duration selector with preset options
- Reason text area with validation
- Integration with userRestrictionService
- Success/error toast notifications

Related: ADMIN-T005-2"

# Push to remote branch
git push origin feature/superadmin-enhanced-user-mgmt-ADMIN-002
```

### 4.3 Continuous Integration

**Push changes frequently to enable early feedback:**

```bash
# After completing each subtask
git push origin feature/superadmin-enhanced-user-mgmt-ADMIN-002

# Update Linear task status
linear issue update ADMIN-T005-2 --state "In Progress"

# Add comment with implementation details
linear comment ADMIN-T005-2 "Completed SuspendUserDialog component. Includes duration selector and reason validation. Ready for review."
```

---

## Phase 5: Review & Merge

### 5.1 Create Pull Request

**Use the GitHub/GitLab web interface or CLI:**

```bash
# Using GitHub CLI
gh pr create \
  --title "feat(admin): ADMIN-002 Enhanced User Management" \
  --body "$(cat <<EOF
## Description
Implements enhanced user management capabilities for Super Admin including:
- User suspension with configurable duration
- Permanent user banning
- User deletion with asset transfer
- Audit logging for all actions

## Related Issues
- Epic: ADMIN-002
- Tasks: ADMIN-T005, ADMIN-T006
- Linear: [Link to Linear epic]

## Implementation Details

### Database Changes
- Added user_restrictions table with RLS policies
- Created suspend_user, ban_user, delete_user_with_transfer RPC functions
- Added indexes for performance optimization

### Frontend Changes
- Created AdvancedUserManagement component
- Implemented SuspendUserDialog, BanUserDialog, DeleteUserDialog
- Added useUserRestrictions hook for state management

### Files Added
- supabase/migrations/20251105000000_user_restrictions.sql
- src/services/userRestrictionService.ts
- src/components/admin/AdvancedUserManagement.tsx
- src/components/admin/dialogs/SuspendUserDialog.tsx
- src/components/admin/dialogs/BanUserDialog.tsx
- src/components/admin/dialogs/DeleteUserDialog.tsx
- src/hooks/useUserRestrictions.ts

### Files Modified
- src/pages/Admin.tsx - Added AdvancedUserManagement component
- src/components/admin/UserManagementTable.tsx - Added action buttons

## Testing Checklist
- [x] Unit tests for all dialog components
- [x] Integration tests for RPC functions
- [x] E2E test for complete suspend/ban/delete workflow
- [x] RLS policy verification
- [x] Manual testing in local environment

## Screenshots
[Attach screenshots showing new UI components]

## Breaking Changes
None

## Migration Required
Yes - Run migration 20251105000000_user_restrictions.sql

## Deployment Notes
- Database migration must be applied before deploying frontend changes
- Requires admin privileges to test
- Monitor admin_activity_logs after deployment

## Reviewer Checklist
- [ ] Code follows project style guide
- [ ] All functions have appropriate error handling
- [ ] RLS policies properly restrict access
- [ ] Audit logging is comprehensive
- [ ] UI is responsive and accessible
- [ ] No sensitive data exposed in logs
- [ ] Database migration includes rollback
EOF
)" \
  --base develop \
  --head feature/superadmin-enhanced-user-mgmt-ADMIN-002 \
  --reviewer @tech-lead @backend-dev
```

### 5.2 Code Review Process

#### For Reviewers

**Review Checklist:**

```markdown
## Code Review Checklist: ADMIN-002

### Functionality
- [ ] All acceptance criteria from epic are met
- [ ] Features work as described in implementation plan
- [ ] Error handling is comprehensive
- [ ] Edge cases are handled appropriately

### Code Quality
- [ ] Code follows TypeScript best practices
- [ ] Functions are properly typed
- [ ] No use of `any` type without justification
- [ ] Comments are clear and helpful
- [ ] No console.log statements in production code

### Security
- [ ] RLS policies properly restrict data access
- [ ] No SQL injection vulnerabilities
- [ ] Sensitive data is not logged
- [ ] Admin privileges are properly checked
- [ ] Input validation is thorough

### Database
- [ ] Migration script is idempotent
- [ ] Rollback procedure is included
- [ ] Indexes are appropriate
- [ ] Foreign keys have proper cascade rules
- [ ] RLS policies tested and verified

### Frontend
- [ ] UI is responsive on mobile/tablet/desktop
- [ ] Accessibility standards met (ARIA labels, keyboard nav)
- [ ] Loading states are shown appropriately
- [ ] Error messages are user-friendly
- [ ] Success feedback is provided

### Testing
- [ ] Unit tests cover critical paths
- [ ] Integration tests validate API interactions
- [ ] E2E tests verify user workflows
- [ ] Test coverage is adequate (>80%)

### Documentation
- [ ] Code is self-documenting or has comments
- [ ] README updated if necessary
- [ ] API documentation updated
- [ ] Migration instructions are clear

### Performance
- [ ] No N+1 query problems
- [ ] Database queries are optimized
- [ ] Large lists are paginated
- [ ] Images are optimized
- [ ] Unnecessary re-renders avoided

### Deployment
- [ ] Environment variables documented
- [ ] Migration order specified
- [ ] Rollback procedure tested
- [ ] Deployment risks identified
```

#### Review Comments Template

```markdown
## Review Comments

### Critical Issues (Must Fix)
1. **Security**: RLS policy on line 45 allows unrestricted access
   - File: supabase/migrations/20251105000000_user_restrictions.sql
   - Severity: High
   - Action Required: Add admin check to policy

### Major Issues (Should Fix)
1. **Error Handling**: Missing try-catch in suspendUser function
   - File: src/services/userRestrictionService.ts:28
   - Severity: Medium
   - Action Required: Wrap async operations in try-catch

### Minor Issues (Nice to Have)
1. **Code Style**: Inconsistent use of single vs double quotes
   - File: src/components/admin/dialogs/SuspendUserDialog.tsx
   - Severity: Low
   - Suggestion: Run prettier to fix formatting

### Questions
1. Why was 90 days chosen as maximum suspension duration?
2. Should we send email notification when user is suspended?

### Praise
- Excellent error handling in the DeleteUserDialog component
- Clear separation of concerns between service and UI layers
- Comprehensive audit logging
```

### 5.3 Addressing Review Feedback

```bash
# Create new commits addressing feedback
git add src/services/userRestrictionService.ts
git commit -m "fix: Add error handling to suspendUser function

Addresses code review feedback regarding missing try-catch blocks.

Reviewer: @tech-lead"

# Push changes
git push origin feature/superadmin-enhanced-user-mgmt-ADMIN-002

# Comment on PR
gh pr comment --body "Addressed all critical and major issues from code review. Please re-review when you have a moment."
```

### 5.4 Merge Approval

**Merge only after:**
- [ ] All review comments addressed
- [ ] CI/CD pipeline passes
- [ ] At least one approving review
- [ ] No merge conflicts with base branch
- [ ] All tests passing

```bash
# If you have merge permissions (usually Product Manager or Tech Lead)
gh pr merge --squash --delete-branch

# Squash commit message template:
feat(admin): ADMIN-002 Enhanced User Management (#123)

Implements enhanced user management capabilities including:
- User suspension with configurable duration
- Permanent user banning  
- User deletion with asset transfer
- Comprehensive audit logging

Co-authored-by: Reviewer Name <reviewer@example.com>
```

---

## Phase 6: Testing & Deployment

### 6.1 Post-Merge Testing Protocol

**Share testing protocol on Slack #testing channel:**

#### Testing Protocol Template

```markdown
# Testing Protocol: ADMIN-002 Enhanced User Management

## Pull Request
- PR #123: feat(admin): ADMIN-002 Enhanced User Management
- Merged to: develop branch
- Deployment: Staging environment

## What Changed
This PR implements enhanced user management features for Super Admins:
1. Suspend users with configurable duration (1-90 days)
2. Ban users permanently
3. Delete users with asset transfer to another user
4. All actions are logged in admin activity log

## Prerequisites for Testing
- [ ] Admin account on staging environment
- [ ] At least 3 test user accounts (for suspend/ban/delete)
- [ ] Test car listings and bookings associated with test users
- [ ] Access to Supabase dashboard for database verification

## Test Environment
- URL: https://staging.mobirdes.app
- Admin Credentials: [Provide secure method to access]
- Test Users:
  - test-user-1@example.com
  - test-user-2@example.com
  - test-user-3@example.com

## Test Cases

### TC-001: Suspend User (Happy Path)
**Objective**: Verify user can be suspended successfully

**Steps**:
1. Login as admin
2. Navigate to Admin Dashboard > Users
3. Find test-user-1 and click "Actions" > "Suspend"
4. Select suspension duration: 7 days
5. Enter reason: "Testing suspension feature"
6. Click "Suspend User"

**Expected Results**:
- Success toast appears: "User [name] has been suspended for 7 days"
- User status changes to "Suspended"
- User cannot login (test by logging in with test-user-1)
- Entry appears in admin activity log
- Notification sent to user (check notifications table)

**Database Verification**:
```sql
-- Check user_restrictions table
SELECT * FROM user_restrictions 
WHERE user_id = '[test-user-1-id]' 
AND active = true;

-- Expected: 1 row with restriction_type = 'suspended', expires_at = now() + 7 days

-- Check admin_activity_logs
SELECT * FROM admin_activity_logs 
WHERE action = 'user_suspended' 
AND resource_id = '[test-user-1-id]'
ORDER BY created_at DESC 
LIMIT 1;
```

---

### TC-002: Ban User (Happy Path)
**Objective**: Verify user can be permanently banned

**Steps**:
1. Login as admin
2. Navigate to Admin Dashboard > Users
3. Find test-user-2 and click "Actions" > "Ban"
4. Enter reason: "Testing ban feature"
5. Click "Ban User"

**Expected Results**:
- Success toast appears: "User [name] has been permanently banned"
- User status changes to "Banned"
- User cannot login (test by logging in with test-user-2)
- Entry appears in admin activity log with action "user_banned"
- Notification sent to user

**Database Verification**:
```sql
SELECT * FROM user_restrictions 
WHERE user_id = '[test-user-2-id]' 
AND restriction_type = 'banned' 
AND active = true;
```

---

### TC-003: Delete User with Asset Transfer
**Objective**: Verify user can be deleted and assets transferred

**Setup**:
- Ensure test-user-3 has:
  - At least 1 car listing
  - At least 1 booking (as host or renter)
  - Some wallet balance

**Steps**:
1. Login as admin
2. Navigate to Admin Dashboard > Users
3. Find test-user-3 and click "Actions" > "Delete"
4. Select transfer recipient: test-user-1
5. Enter reason: "Testing delete with transfer"
6. Confirm deletion

**Expected Results**:
- Success toast appears: "User deleted and assets transferred successfully"
- User account deleted from profiles table
- User's cars now belong to test-user-1
- User's bookings updated or cancelled appropriately
- Wallet balance transferred
- Entry in admin activity log with action "user_deleted"
- Entry in vehicle_transfers table (if cars were transferred)

**Database Verification**:
```sql
-- User should be deleted
SELECT * FROM profiles WHERE id = '[test-user-3-id]';
-- Expected: 0 rows

-- Cars should be transferred
SELECT * FROM cars WHERE user_id = '[test-user-1-id]';
-- Expected: includes former test-user-3 cars

-- Check vehicle transfers
SELECT * FROM vehicle_transfers 
WHERE from_user_id = '[test-user-3-id]';
```

---

### TC-004: Suspend User - Edge Cases
**Test Scenarios**:

a) **Suspend Already Suspended User**
- Expected: Previous suspension deactivated, new suspension created

b) **Suspend User with Active Bookings**
- Expected: Warning shown, admin can proceed or cancel

c) **Empty Reason Field**
- Expected: Validation error, cannot submit

d) **Unsuspend Before Expiration**
- Expected: Can manually lift suspension, user can login immediately

---

### TC-005: RLS Policy Verification
**Objective**: Ensure non-admin users cannot access restricted functions

**Steps**:
1. Logout from admin account
2. Login as regular user (test-user-1)
3. Attempt to access admin dashboard

**Expected Results**:
- Redirected to home page or 403 error
- Cannot see admin navigation items
- Direct URL access to /admin blocked

**Database Verification**:
```sql
-- Attempt to call suspend_user as non-admin (should fail)
-- Run this in Supabase SQL editor with regular user's JWT
SELECT suspend_user('[any-user-id]', 'test', interval '7 days');
-- Expected: ERROR: Unauthorized: Only admins can suspend users
```

---

### TC-006: Audit Log Completeness
**Objective**: Verify all actions are logged correctly

**Steps**:
1. Perform all actions from TC-001 through TC-003
2. Navigate to Admin Dashboard > Activity Log
3. Filter by today's date

**Expected Results**:
- All actions visible in chronological order
- Each log entry contains:
  - Admin who performed action
  - Timestamp
  - Action type (user_suspended, user_banned, user_deleted)
  - Target user
  - Reason provided
  - IP address and user agent

---

### TC-007: Performance Testing
**Objective**: Ensure actions complete within acceptable time

**Test**:
- Suspend user: < 2 seconds
- Ban user: < 2 seconds
- Delete user with assets: < 5 seconds
- Load user restrictions: < 1 second

---

### TC-008: Mobile Responsiveness
**Objective**: Verify UI works on mobile devices

**Steps**:
1. Access staging environment on mobile device or use browser dev tools
2. Login as admin
3. Navigate to user management
4. Attempt to suspend a user

**Expected Results**:
- All dialogs are properly sized for mobile
- Buttons are easily tappable
- Forms are usable on small screens
- No horizontal scrolling

---

## Bug Reporting

If you find any issues, please report them in the following format:

```markdown
**Bug ID**: [Auto-assigned by Linear]
**Severity**: [Critical/High/Medium/Low]
**Title**: [Brief description]

**Description**:
[Detailed description of the issue]

**Steps to Reproduce**:
1. [Step 1]
2. [Step 2]
3. [Step 3]

**Expected Result**:
[What should happen]

**Actual Result**:
[What actually happened]

**Screenshots**:
[Attach screenshots if applicable]

**Environment**:
- Branch: develop
- Device: [Desktop/Mobile/Tablet]
- Browser: [Chrome/Firefox/Safari]
- OS: [Windows/Mac/Linux/iOS/Android]

**Console Errors**:
```
[Paste any console errors here]
```

**Database State**:
[Any relevant database queries showing unexpected state]

**Assigned To**: @developer-name
**Priority**: [P0/P1/P2/P3]
```

---

## Test Sign-Off

Once all test cases pass:
- [ ] All test cases executed
- [ ] No critical or high severity bugs found
- [ ] Any medium/low bugs documented in Linear
- [ ] Performance benchmarks met
- [ ] Mobile responsiveness verified
- [ ] Security testing completed

**Tester**: [Your Name]
**Date**: [Testing Date]
**Sign-off**: Ready for Production ✅ / Not Ready ❌

**Approved by QA Lead**: _________________
**Date**: _________________
```

### 6.2 Post to Slack #testing Channel

```
📋 **New Feature Ready for Testing**

**Feature**: ADMIN-002 Enhanced User Management
**PR**: #123
**Branch**: develop
**Environment**: Staging

**What to Test**:
✅ Suspend users with duration
✅ Ban users permanently
✅ Delete users with asset transfer
✅ Verify audit logging
✅ Check RLS policies

**Testing Protocol**: 
[Link to testing protocol document or gist]

**Timeline**: Please complete testing by [Date]

**Questions?** Tag @dev-team in this thread

cc: @qa-team @product-manager
```

### 6.3 Production Deployment

**Product Manager Approval Process:**

```markdown
## Production Deployment Checklist: ADMIN-002

### Pre-Deployment
- [ ] All test cases passed in staging
- [ ] QA sign-off received
- [ ] No critical bugs outstanding
- [ ] Database migration tested in staging
- [ ] Rollback procedure documented and tested
- [ ] Stakeholder notification sent
- [ ] Deployment window scheduled
- [ ] On-call engineer assigned

### Deployment Steps

1. **Announce Maintenance Window** (if required)
   - Send notification to all users 24 hours in advance
   - Update status page

2. **Database Migration** (Production DBA or Senior Dev)
   ```bash
   # Backup database
   pg_dump -h [prod-db-host] -U postgres -d mobirdes > backup_pre_admin002_$(date +%Y%m%d).sql
   
   # Run migration
   psql -h [prod-db-host] -U postgres -d mobirdes -f supabase/migrations/20251105000000_user_restrictions.sql
   
   # Verify migration
   psql -h [prod-db-host] -U postgres -d mobirdes -c "SELECT * FROM user_restrictions LIMIT 1;"
   ```

3. **Deploy Application**
   ```bash
   # Merge to main branch
   git checkout main
   git merge develop
   git push origin main
   
   # Tag release
   git tag -a v1.5.0-admin-002 -m "Release: Enhanced User Management"
   git push origin v1.5.0-admin-002
   
   # Deploy (automatic via CI/CD or manual)
   ```

4. **Post-Deployment Verification**
   - [ ] Application starts successfully
   - [ ] Health check endpoints respond
   - [ ] Database connections working
   - [ ] Admin dashboard accessible
   - [ ] Test suspend user function
   - [ ] Check error logs for any issues
   - [ ] Verify RLS policies active

5. **Smoke Testing in Production**
   ```markdown
   - Login as admin: ✅
   - View user management page: ✅
   - Test suspend on test account: ✅
   - Verify audit log entry: ✅
   - Check notification sent: ✅
   ```

### Post-Deployment

- [ ] Monitor error logs for 1 hour
- [ ] Check performance metrics
- [ ] Verify no user-reported issues
- [ ] Update documentation
- [ ] Close deployment ticket
- [ ] Post-mortem meeting (if issues occurred)

### Rollback Procedure (If Needed)

```bash
# Revert application deployment
git revert [commit-hash]
git push origin main

# Rollback database migration
psql -h [prod-db-host] -U postgres -d mobirdes -f supabase/migrations/20251105000000_user_restrictions_rollback.sql

# Restore from backup (last resort)
psql -h [prod-db-host] -U postgres -d mobirdes < backup_pre_admin002_[date].sql
```

**Deployment Lead**: _________________
**Date/Time**: _________________
**Status**: Success ✅ / Rolled Back ❌
```

---

## Phase 7: Post-Implementation

### 7.1 Documentation Updates

**Update all relevant documentation:**

```bash
# Update implementation plan with completion notes
code PHASE_1_SUPERADMIN_IMPLEMENTATION_PLAN.md

# Add completion section
```

```markdown
## Implementation Status

### ADMIN-002: Enhanced User Management ✅ COMPLETED
**Completed Date**: 2025-11-05
**Developer**: [Your Name]
**Story Points**: 8 SP (estimated) / 10 SP (actual)

**Deliverables**:
- ✅ Database schema updated with user_restrictions table
- ✅ RPC functions: suspend_user, ban_user, delete_user_with_transfer
- ✅ Frontend components: AdvancedUserManagement, SuspendUserDialog, BanUserDialog, DeleteUserDialog
- ✅ Service layer: userRestrictionService.ts
- ✅ Hooks: useUserRestrictions.ts
- ✅ All tests passing
- ✅ Deployed to production

**Lessons Learned**:
1. Asset transfer logic more complex than anticipated (+2 SP)
2. Notification integration required additional effort
3. RLS policy testing uncovered edge case with expired sessions

**Technical Debt**:
- Consider adding bulk operations for suspending multiple users
- Email notification templates need design review
- Performance optimization needed for user lists >1000 users
```

### 7.2 Knowledge Transfer

**Create knowledge transfer document:**

```markdown
# Knowledge Transfer: Enhanced User Management

## Overview
This document explains the implementation of ADMIN-002 for future developers maintaining or extending this feature.

## Architecture

### Database Layer
- **Table**: `user_restrictions`
  - Stores all suspension and ban records
  - Uses `active` flag to track current restrictions
  - Supports expiration dates for temporary restrictions

- **Functions**:
  - `suspend_user(user_id, reason, duration)` - Creates temporary restriction
  - `ban_user(user_id, reason)` - Creates permanent restriction
  - `delete_user_with_transfer(user_id, recipient_id, reason)` - Deletes user and transfers assets

### Service Layer
- **File**: `src/services/userRestrictionService.ts`
- Provides TypeScript-friendly interface to database functions
- Handles error transformation and logging

### UI Layer
- **Main Component**: `AdvancedUserManagement.tsx`
- **Dialogs**: Individual dialogs for each action
- **Hook**: `useUserRestrictions.ts` - Manages state and API calls

## Key Decisions

### Why separate dialogs instead of one modal?
- Each action has different UI requirements
- Separation makes testing easier
- More maintainable as features evolve

### Why RPC functions instead of direct table operations?
- Ensures business logic consistency
- Enables complex operations (asset transfer) atomically
- Simplifies RLS policies

## Common Tasks

### Adding a new restriction type
1. Update `user_restrictions` table CHECK constraint
2. Create new RPC function
3. Add to `userRestrictionService.ts`
4. Create UI dialog component
5. Update `AdvancedUserManagement.tsx`

### Modifying suspension durations
1. Edit `SuspendUserDialog.tsx`
2. Update duration options in Select component
3. No database changes required

## Troubleshooting

### User can still login after suspension
- Check `user_restrictions` table: is restriction active?
- Verify authentication middleware checks restrictions
- Check user's session expiration

### Asset transfer fails
- Verify recipient user exists
- Check for foreign key constraints
- Review transaction logs in database

## Related Features
- Admin Activity Logging (ADMIN-005)
- Notification System
- User Authentication & Authorization
```

### 7.3 Team Retrospective

**Schedule retrospective meeting to discuss:**

```markdown
# Retrospective: ADMIN-002 Implementation

**Date**: [Date]
**Attendees**: Dev team, QA, Product Manager

## What Went Well ✅
- Clear implementation plan made development straightforward
- Database migration was smooth
- Good collaboration between frontend/backend devs
- Comprehensive testing caught several edge cases

## What Could Be Improved 🔄
- Initial story point estimate was too low
- Notification integration was not in original plan
- More time needed for RLS policy testing
- Testing protocol could be more automated

## Action Items 📋
- [ ] Update story point estimation guidelines
- [ ] Add notification requirements to future epics
- [ ] Create automated RLS policy test suite
- [ ] Investigate E2E testing framework for admin features

## Kudos 🎉
- @backend-dev for excellent database function implementation
- @qa-engineer for thorough testing protocol
- @designer for quick turnaround on dialog mockups
```

---

## Quality Gates & Checkpoints

### Definition of Done

A task is considered "done" when ALL criteria are met:

#### Code Criteria
- [ ] All code follows TypeScript style guide
- [ ] No TypeScript errors or warnings
- [ ] All functions have type annotations
- [ ] No `any` types without justification
- [ ] Console.log statements removed
- [ ] TODO comments converted to Linear tasks or removed

#### Testing Criteria
- [ ] Unit tests written for all functions
- [ ] Unit tests passing with >80% coverage
- [ ] Integration tests for API calls
- [ ] E2E tests for critical user flows
- [ ] Manual testing completed in dev environment
- [ ] RLS policies tested and verified

#### Documentation Criteria
- [ ] Code comments for complex logic
- [ ] API documentation updated
- [ ] README updated if needed
- [ ] Migration instructions documented
- [ ] Rollback procedure documented

#### Security Criteria
- [ ] RLS policies prevent unauthorized access
- [ ] Input validation on all user inputs
- [ ] No SQL injection vulnerabilities
- [ ] Sensitive data not logged
- [ ] Admin checks on all privileged operations

#### Deployment Criteria
- [ ] Database migrations tested in staging
- [ ] No breaking changes to existing features
- [ ] Feature flags implemented if needed
- [ ] Deployment instructions clear
- [ ] Rollback procedure tested

#### Review Criteria
- [ ] At least one code review approval
- [ ] All review comments addressed
- [ ] CI/CD pipeline passing
- [ ] No merge conflicts
- [ ] Pull request description complete

---

## Emergency Procedures

### Critical Bug in Production

**Severity Definitions:**
- **P0 - Critical**: System down, data loss, security breach
- **P1 - High**: Major feature broken, significant user impact
- **P2 - Medium**: Minor feature broken, workaround exists
- **P3 - Low**: Cosmetic issue, minimal impact

#### P0 - Critical Response

```markdown
## Critical Bug Response Protocol

1. **Immediate Actions** (0-15 minutes)
   - [ ] Alert on-call engineer
   - [ ] Create incident in monitoring system
   - [ ] Notify product manager and tech lead
   - [ ] Assess if rollback is needed

2. **Rollback Decision** (15-30 minutes)
   - If feature is completely broken: **ROLLBACK**
   - If workaround exists: **HOTFIX**
   - If isolated to one component: **DISABLE FEATURE**

3. **Rollback Procedure** (if needed)
   ```bash
   # Revert application
   git revert [commit-hash]
   git push origin main
   
   # Rollback database
   psql -h [prod-db] -U postgres -d mobirdes -f [rollback-script].sql
   
   # Verify rollback
   [Run smoke tests]
   ```

4. **Hotfix Procedure** (if applicable)
   ```bash
   # Create hotfix branch
   git checkout -b hotfix/admin-002-critical-fix main
   
   # Make fix
   [Implement minimal fix]
   
   # Fast-track review
   [Get immediate review from tech lead]
   
   # Deploy
   git push origin hotfix/admin-002-critical-fix
   [Deploy via CI/CD]
   ```

5. **Post-Incident** (24-48 hours)
   - [ ] Root cause analysis
   - [ ] Post-mortem document
   - [ ] Process improvements
   - [ ] Update monitoring/alerts
```

### Data Corruption

```bash
# If user restrictions table has incorrect data

# 1. Stop accepting new restriction requests (disable feature in UI)

# 2. Assess corruption extent
psql -h [prod-db] -U postgres -d mobirdes <<EOF
SELECT COUNT(*) FROM user_restrictions WHERE active IS NULL;
SELECT COUNT(*) FROM user_restrictions WHERE expires_at < restricted_at;
-- Check for other anomalies
EOF

# 3. Restore from backup (if severe)
# OR
# 4. Fix data with corrective script

# 5. Verify data integrity
# 6. Re-enable feature
# 7. Document incident
```

---

## References

### Implementation Plans
- **Phase 1 Plan**: `/PHASE_1_SUPERADMIN_IMPLEMENTATION_PLAN.md`
- **Analysis Report**: `/.trae/documents/SuperAdmin_Functionality_Analysis_Report.md`

### Code Resources
- **Admin Components**: `src/components/admin/`
- **Admin Hooks**: `src/hooks/useAdmin*.ts`
- **Admin Services**: `src/services/*Service.ts`
- **Database Migrations**: `supabase/migrations/`

### External Documentation
- **Supabase RLS**: https://supabase.com/docs/guides/auth/row-level-security
- **React Best Practices**: https://react.dev/learn
- **TypeScript Handbook**: https://www.typescriptlang.org/docs/

### Tools
- **Linear**: [Project workspace URL]
- **GitHub**: [Repository URL]
- **Supabase Dashboard**: https://supabase.com/dashboard/project/putjowciegpzdheideaf
- **Staging Environment**: [Staging URL]
- **Production**: [Production URL]

### Team Contacts
- **Tech Lead**: [Name] - [Contact]
- **Backend Lead**: [Name] - [Contact]
- **Frontend Lead**: [Name] - [Contact]
- **QA Lead**: [Name] - [Contact]
- **Product Manager**: [Name] - [Contact]

---

## Appendix

### A. Jira Epic Template

```markdown
# Epic: [Epic ID] - [Epic Name]

## Description
[Detailed description of the epic and its business value]

## Business Value
[Why this feature matters to users and the business]

## Acceptance Criteria
- [ ] Criterion 1
- [ ] Criterion 2
- [ ] Criterion 3

## Technical Tasks
- [ ] Task 1 (X SP)
- [ ] Task 2 (Y SP)
- [ ] Task 3 (Z SP)

**Total Story Points**: [Sum]

## Dependencies
- Depends on: [Other epics/tasks]
- Blocked by: [Any blockers]
- Blocks: [Tasks waiting on this]

## Definition of Done
[Specific criteria for this epic to be considered complete]

## Testing Strategy
[How this feature will be tested]

## Deployment Strategy
[How this will be rolled out to production]

## Risks
[Potential risks and mitigation strategies]
```

### B. Commit Message Format

```
<type>(<scope>): <subject>

<body>

<footer>
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation only
- `style`: Code style changes (formatting)
- `refactor`: Code refactoring
- `perf`: Performance improvement
- `test`: Adding/updating tests
- `chore`: Build process or auxiliary tool changes
- `revert`: Reverts a previous commit

**Examples:**

```
feat(admin): Add user suspension functionality

Implement suspend user dialog with duration selector and reason input.
Integrates with userRestrictionService to call suspend_user RPC function.

Related: ADMIN-T005-2
```

```
fix(admin): Correct RLS policy for user_restrictions table

Previous policy allowed non-admins to view restrictions.
Updated to properly check for admin role.

Fixes: ADMIN-002-BUG-1
Reviewer: @tech-lead
```

### C. Testing Standards

**Unit Test Template:**

```typescript
// src/services/userRestrictionService.test.ts

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { suspendUser, banUser } from './userRestrictionService';
import { supabase } from '@/integrations/supabase/client';

// Mock Supabase client
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    rpc: vi.fn()
  }
}));

describe('userRestrictionService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('suspendUser', () => {
    it('should suspend user successfully with duration', async () => {
      const mockRpc = vi.mocked(supabase.rpc);
      mockRpc.mockResolvedValue({ 
        data: { success: true }, 
        error: null 
      });

      const result = await suspendUser({
        userId: 'test-user-id',
        reason: 'Test reason',
        durationDays: 7
      });

      expect(mockRpc).toHaveBeenCalledWith('suspend_user', {
        p_user_id: 'test-user-id',
        p_reason: 'Test reason',
        p_duration: '7 days'
      });
      expect(result.success).toBe(true);
    });

    it('should handle suspension errors gracefully', async () => {
      const mockRpc = vi.mocked(supabase.rpc);
      mockRpc.mockResolvedValue({ 
        data: null, 
        error: { message: 'Database error' } 
      });

      const result = await suspendUser({
        userId: 'test-user-id',
        reason: 'Test reason',
        durationDays: 7
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Database error');
    });
  });
});
```

---

## Document History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2025-11-05 | Dev Team Lead | Initial SOP creation |

---

**End of Document**

*For questions or suggestions regarding this SOP, please contact the Development Team Lead or submit a PR with proposed changes.*

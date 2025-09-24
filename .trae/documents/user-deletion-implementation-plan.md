# User Deletion Implementation Plan - MobiRides Admin Management System

## 1. Executive Summary

This document outlines the comprehensive implementation plan for adding user deletion functionality to the MobiRides car-sharing platform. The current system lacks user deletion capabilities, creating potential data management and compliance issues. This implementation will provide both soft and hard deletion options with proper audit trails and security controls.

## 2. Current State Analysis

### 2.1 Existing Infrastructure
- **Authentication**: Supabase Auth with `auth.users` table
- **User Profiles**: `profiles` table with comprehensive user data
- **Admin System**: Role-based access control with `is_admin()` function
- **Database Relationships**: Extensive CASCADE DELETE and SET NULL foreign key relationships

### 2.2 Identified Gaps
- No user deletion functionality in admin interface
- No soft deletion mechanism for data retention
- Missing audit trail for user management actions
- No user restoration capabilities

### 2.3 Database Relationship Analysis

#### Tables with CASCADE DELETE (auto-cleanup on user deletion):
- `cars` (owner_id → profiles.id)
- `bookings` (host_id, renter_id → profiles.id)
- `notifications` (user_id → profiles.id)
- `conversations` (via conversation_participants)
- `conversation_messages` (sender_id → profiles.id)
- `messages` (sender_id, recipient_id → profiles.id)
- `reviews` (reviewer_id, reviewee_id → profiles.id)

#### Tables with SET NULL (preserve records, nullify references):
- Various `created_by` and `related_user_id` fields

## 3. Implementation Strategy

### 3.1 Phase 1: Database Layer Enhancement

#### 3.1.1 Soft Deletion Fields
```sql
-- Add soft deletion fields to profiles table
ALTER TABLE profiles ADD COLUMN deleted_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE profiles ADD COLUMN deleted_by UUID REFERENCES profiles(id);
ALTER TABLE profiles ADD COLUMN deletion_reason TEXT;
ALTER TABLE profiles ADD COLUMN is_deleted BOOLEAN DEFAULT FALSE;
```

#### 3.1.2 User Deletion Audit Table
```sql
-- Create user deletion logs table
CREATE TABLE user_deletion_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    deleted_user_id UUID NOT NULL,
    deleted_user_email VARCHAR(255) NOT NULL,
    deleted_user_name VARCHAR(100) NOT NULL,
    deleted_by UUID REFERENCES profiles(id),
    deletion_type VARCHAR(20) CHECK (deletion_type IN ('soft', 'hard')),
    deletion_reason TEXT,
    user_data_backup JSONB, -- Backup of user data before deletion
    related_data_count JSONB, -- Count of related records affected
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_user_deletion_logs_deleted_user_id ON user_deletion_logs(deleted_user_id);
CREATE INDEX idx_user_deletion_logs_deleted_by ON user_deletion_logs(deleted_by);
CREATE INDEX idx_user_deletion_logs_created_at ON user_deletion_logs(created_at DESC);
```

#### 3.1.3 Updated RLS Policies
```sql
-- Update existing policies to exclude soft-deleted users
DROP POLICY IF EXISTS "Users can view basic profile info for chat" ON profiles;
CREATE POLICY "Users can view basic profile info for chat" ON profiles
    FOR SELECT USING (
        auth.role() = 'authenticated' AND 
        (is_deleted = FALSE OR is_deleted IS NULL)
    );

-- Add admin deletion policy
CREATE POLICY "Admins can delete users" ON profiles
    FOR DELETE USING (is_admin());

-- RLS for deletion logs
CREATE POLICY "Admins can view deletion logs" ON user_deletion_logs
    FOR SELECT USING (is_admin());

CREATE POLICY "Admins can insert deletion logs" ON user_deletion_logs
    FOR INSERT WITH CHECK (is_admin());
```

### 3.2 Phase 2: Backend Functions

#### 3.2.1 Soft Delete Function
```sql
CREATE OR REPLACE FUNCTION soft_delete_user(
    target_user_id UUID,
    deletion_reason TEXT DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    current_user_id UUID;
    target_user RECORD;
    related_counts JSONB;
    user_backup JSONB;
BEGIN
    -- Get current user
    current_user_id := auth.uid();
    
    -- Security checks
    IF NOT is_admin() THEN
        RAISE EXCEPTION 'Unauthorized: Admin access required';
    END IF;
    
    IF current_user_id = target_user_id THEN
        RAISE EXCEPTION 'Cannot delete your own account';
    END IF;
    
    -- Get target user data
    SELECT * INTO target_user FROM profiles WHERE id = target_user_id AND (is_deleted = FALSE OR is_deleted IS NULL);
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'User not found or already deleted';
    END IF;
    
    -- Create user data backup
    SELECT to_jsonb(target_user) INTO user_backup;
    
    -- Count related data
    SELECT jsonb_build_object(
        'cars', (SELECT COUNT(*) FROM cars WHERE owner_id = target_user_id),
        'bookings_as_host', (SELECT COUNT(*) FROM bookings WHERE host_id = target_user_id),
        'bookings_as_renter', (SELECT COUNT(*) FROM bookings WHERE renter_id = target_user_id),
        'reviews_given', (SELECT COUNT(*) FROM reviews WHERE reviewer_id = target_user_id),
        'reviews_received', (SELECT COUNT(*) FROM reviews WHERE reviewee_id = target_user_id),
        'messages_sent', (SELECT COUNT(*) FROM messages WHERE sender_id = target_user_id),
        'notifications', (SELECT COUNT(*) FROM notifications WHERE user_id = target_user_id)
    ) INTO related_counts;
    
    -- Perform soft deletion
    UPDATE profiles SET
        is_deleted = TRUE,
        deleted_at = NOW(),
        deleted_by = current_user_id,
        deletion_reason = deletion_reason
    WHERE id = target_user_id;
    
    -- Log the deletion
    INSERT INTO user_deletion_logs (
        deleted_user_id,
        deleted_user_email,
        deleted_user_name,
        deleted_by,
        deletion_type,
        deletion_reason,
        user_data_backup,
        related_data_count
    ) VALUES (
        target_user_id,
        target_user.email,
        target_user.name,
        current_user_id,
        'soft',
        deletion_reason,
        user_backup,
        related_counts
    );
    
    RETURN jsonb_build_object(
        'success', true,
        'message', 'User soft deleted successfully',
        'deleted_user_id', target_user_id,
        'related_data_affected', related_counts
    );
END;
$$;
```

#### 3.2.2 Hard Delete Function
```sql
CREATE OR REPLACE FUNCTION hard_delete_user(
    target_user_id UUID,
    deletion_reason TEXT DEFAULT NULL,
    confirm_cascade BOOLEAN DEFAULT FALSE
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    current_user_id UUID;
    target_user RECORD;
    related_counts JSONB;
    user_backup JSONB;
BEGIN
    -- Get current user
    current_user_id := auth.uid();
    
    -- Security checks
    IF NOT is_admin() THEN
        RAISE EXCEPTION 'Unauthorized: Admin access required';
    END IF;
    
    IF current_user_id = target_user_id THEN
        RAISE EXCEPTION 'Cannot delete your own account';
    END IF;
    
    IF NOT confirm_cascade THEN
        RAISE EXCEPTION 'Hard deletion requires explicit cascade confirmation';
    END IF;
    
    -- Get target user data
    SELECT * INTO target_user FROM profiles WHERE id = target_user_id;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'User not found';
    END IF;
    
    -- Create user data backup
    SELECT to_jsonb(target_user) INTO user_backup;
    
    -- Count related data before deletion
    SELECT jsonb_build_object(
        'cars', (SELECT COUNT(*) FROM cars WHERE owner_id = target_user_id),
        'bookings_as_host', (SELECT COUNT(*) FROM bookings WHERE host_id = target_user_id),
        'bookings_as_renter', (SELECT COUNT(*) FROM bookings WHERE renter_id = target_user_id),
        'reviews_given', (SELECT COUNT(*) FROM reviews WHERE reviewer_id = target_user_id),
        'reviews_received', (SELECT COUNT(*) FROM reviews WHERE reviewee_id = target_user_id),
        'messages_sent', (SELECT COUNT(*) FROM messages WHERE sender_id = target_user_id),
        'notifications', (SELECT COUNT(*) FROM notifications WHERE user_id = target_user_id)
    ) INTO related_counts;
    
    -- Log the deletion before performing it
    INSERT INTO user_deletion_logs (
        deleted_user_id,
        deleted_user_email,
        deleted_user_name,
        deleted_by,
        deletion_type,
        deletion_reason,
        user_data_backup,
        related_data_count
    ) VALUES (
        target_user_id,
        target_user.email,
        target_user.name,
        current_user_id,
        'hard',
        deletion_reason,
        user_backup,
        related_counts
    );
    
    -- Perform hard deletion (CASCADE will handle related data)
    DELETE FROM profiles WHERE id = target_user_id;
    
    -- Also delete from auth.users if needed
    DELETE FROM auth.users WHERE id = target_user_id;
    
    RETURN jsonb_build_object(
        'success', true,
        'message', 'User permanently deleted successfully',
        'deleted_user_id', target_user_id,
        'related_data_deleted', related_counts
    );
END;
$$;
```

#### 3.2.3 User Restoration Function
```sql
CREATE OR REPLACE FUNCTION restore_user(
    target_user_id UUID,
    restoration_reason TEXT DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    current_user_id UUID;
    target_user RECORD;
BEGIN
    -- Get current user
    current_user_id := auth.uid();
    
    -- Security checks
    IF NOT is_admin() THEN
        RAISE EXCEPTION 'Unauthorized: Admin access required';
    END IF;
    
    -- Get target user data
    SELECT * INTO target_user FROM profiles WHERE id = target_user_id AND is_deleted = TRUE;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'User not found or not deleted';
    END IF;
    
    -- Restore user
    UPDATE profiles SET
        is_deleted = FALSE,
        deleted_at = NULL,
        deleted_by = NULL,
        deletion_reason = NULL
    WHERE id = target_user_id;
    
    -- Log the restoration
    INSERT INTO user_deletion_logs (
        deleted_user_id,
        deleted_user_email,
        deleted_user_name,
        deleted_by,
        deletion_type,
        deletion_reason,
        user_data_backup,
        related_data_count
    ) VALUES (
        target_user_id,
        target_user.email,
        target_user.name,
        current_user_id,
        'restore',
        restoration_reason,
        to_jsonb(target_user),
        '{}'
    );
    
    RETURN jsonb_build_object(
        'success', true,
        'message', 'User restored successfully',
        'restored_user_id', target_user_id
    );
END;
$$;
```

### 3.3 Phase 3: Frontend Components

#### 3.3.1 Enhanced User Management Table

**File**: `src/components/admin/UserManagementTable.tsx`

```typescript
// Add delete action column to existing table
const columns = [
  // ... existing columns
  {
    accessorKey: 'actions',
    header: 'Actions',
    cell: ({ row }) => {
      const user = row.original;
      return (
        <div className="flex space-x-2">
          {/* Existing edit button */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleEditUser(user)}
          >
            Edit
          </Button>
          
          {/* New delete button */}
          <Button
            variant="destructive"
            size="sm"
            onClick={() => handleDeleteUser(user)}
            disabled={user.id === currentUser?.id}
          >
            Delete
          </Button>
          
          {/* Restore button for soft-deleted users */}
          {user.is_deleted && (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => handleRestoreUser(user)}
            >
              Restore
            </Button>
          )}
        </div>
      );
    },
  },
];
```

#### 3.3.2 User Delete Dialog Component

**File**: `src/components/admin/UserDeleteDialog.tsx`

```typescript
import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Checkbox } from '@/components/ui/checkbox';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

interface UserDeleteDialogProps {
  user: {
    id: string;
    name: string;
    email: string;
  } | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

type DeletionStep = 'confirm' | 'details' | 'final';
type DeletionType = 'soft' | 'hard';

export function UserDeleteDialog({ user, isOpen, onClose, onSuccess }: UserDeleteDialogProps) {
  const [step, setStep] = useState<DeletionStep>('confirm');
  const [deletionType, setDeletionType] = useState<DeletionType>('soft');
  const [reason, setReason] = useState('');
  const [confirmText, setConfirmText] = useState('');
  const [cascadeConfirm, setCascadeConfirm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [relatedDataCounts, setRelatedDataCounts] = useState<any>(null);

  const resetDialog = () => {
    setStep('confirm');
    setDeletionType('soft');
    setReason('');
    setConfirmText('');
    setCascadeConfirm(false);
    setRelatedDataCounts(null);
  };

  const handleClose = () => {
    resetDialog();
    onClose();
  };

  const fetchRelatedDataCounts = async () => {
    if (!user) return;
    
    try {
      // Fetch related data counts
      const { data, error } = await supabase.rpc('get_user_related_data_counts', {
        target_user_id: user.id
      });
      
      if (error) throw error;
      setRelatedDataCounts(data);
    } catch (error) {
      console.error('Error fetching related data:', error);
      toast.error('Failed to fetch user data information');
    }
  };

  const handleConfirmDeletion = async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      const functionName = deletionType === 'soft' ? 'soft_delete_user' : 'hard_delete_user';
      const params = {
        target_user_id: user.id,
        deletion_reason: reason || null,
        ...(deletionType === 'hard' && { confirm_cascade: cascadeConfirm })
      };

      const { data, error } = await supabase.rpc(functionName, params);
      
      if (error) throw error;
      
      toast.success(
        deletionType === 'soft' 
          ? 'User soft deleted successfully' 
          : 'User permanently deleted successfully'
      );
      
      onSuccess();
      handleClose();
    } catch (error: any) {
      console.error('Error deleting user:', error);
      toast.error(error.message || 'Failed to delete user');
    } finally {
      setIsLoading(false);
    }
  };

  const handleNext = () => {
    if (step === 'confirm') {
      fetchRelatedDataCounts();
      setStep('details');
    } else if (step === 'details') {
      setStep('final');
    }
  };

  const canProceed = () => {
    if (step === 'confirm') return true;
    if (step === 'details') return reason.trim().length > 0;
    if (step === 'final') {
      const expectedText = `DELETE ${user?.email}`;
      return confirmText === expectedText && 
             (deletionType === 'soft' || cascadeConfirm);
    }
    return false;
  };

  if (!user) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {step === 'confirm' && 'Delete User Account'}
            {step === 'details' && 'Deletion Details'}
            {step === 'final' && 'Final Confirmation'}
          </DialogTitle>
          <DialogDescription>
            {step === 'confirm' && `You are about to delete the account for ${user.name} (${user.email})`}
            {step === 'details' && 'Please provide deletion details and select deletion type'}
            {step === 'final' && 'This action cannot be undone. Please confirm your decision.'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {step === 'confirm' && (
            <Alert>
              <AlertDescription>
                This will remove the user's access to the platform. Choose between soft deletion 
                (data preserved, can be restored) or permanent deletion (all data removed).
              </AlertDescription>
            </Alert>
          )}

          {step === 'details' && (
            <>
              <div className="space-y-3">
                <Label>Deletion Type</Label>
                <RadioGroup value={deletionType} onValueChange={(value: DeletionType) => setDeletionType(value)}>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="soft" id="soft" />
                    <Label htmlFor="soft">Soft Delete (Recommended)</Label>
                  </div>
                  <p className="text-sm text-muted-foreground ml-6">
                    User data is preserved and can be restored later
                  </p>
                  
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="hard" id="hard" />
                    <Label htmlFor="hard">Permanent Delete</Label>
                  </div>
                  <p className="text-sm text-muted-foreground ml-6">
                    All user data will be permanently removed
                  </p>
                </RadioGroup>
              </div>

              <div className="space-y-2">
                <Label htmlFor="reason">Reason for Deletion *</Label>
                <Textarea
                  id="reason"
                  placeholder="Please provide a reason for this deletion..."
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  rows={3}
                />
              </div>

              {relatedDataCounts && (
                <Alert>
                  <AlertDescription>
                    <strong>Related Data:</strong>
                    <ul className="mt-2 space-y-1 text-sm">
                      <li>Cars: {relatedDataCounts.cars}</li>
                      <li>Bookings as Host: {relatedDataCounts.bookings_as_host}</li>
                      <li>Bookings as Renter: {relatedDataCounts.bookings_as_renter}</li>
                      <li>Reviews Given: {relatedDataCounts.reviews_given}</li>
                      <li>Reviews Received: {relatedDataCounts.reviews_received}</li>
                      <li>Messages: {relatedDataCounts.messages_sent}</li>
                    </ul>
                  </AlertDescription>
                </Alert>
              )}
            </>
          )}

          {step === 'final' && (
            <>
              <Alert className="border-destructive">
                <AlertDescription>
                  <strong>Warning:</strong> {deletionType === 'soft' 
                    ? 'This will disable the user account and hide their data from the platform.' 
                    : 'This will permanently delete all user data and cannot be undone.'}
                </AlertDescription>
              </Alert>

              <div className="space-y-2">
                <Label htmlFor="confirm">Type "DELETE {user.email}" to confirm:</Label>
                <Input
                  id="confirm"
                  value={confirmText}
                  onChange={(e) => setConfirmText(e.target.value)}
                  placeholder={`DELETE ${user.email}`}
                />
              </div>

              {deletionType === 'hard' && (
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="cascade"
                    checked={cascadeConfirm}
                    onCheckedChange={(checked) => setCascadeConfirm(checked as boolean)}
                  />
                  <Label htmlFor="cascade" className="text-sm">
                    I understand that all related data will be permanently deleted
                  </Label>
                </div>
              )}
            </>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={step === 'confirm' ? handleClose : () => setStep('confirm')}>
            {step === 'confirm' ? 'Cancel' : 'Back'}
          </Button>
          
          {step !== 'final' ? (
            <Button 
              onClick={handleNext}
              disabled={!canProceed()}
            >
              Next
            </Button>
          ) : (
            <Button
              variant="destructive"
              onClick={handleConfirmDeletion}
              disabled={!canProceed() || isLoading}
            >
              {isLoading ? 'Deleting...' : `${deletionType === 'soft' ? 'Soft Delete' : 'Permanently Delete'} User`}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
```

#### 3.3.3 User Restoration Dialog

**File**: `src/components/admin/UserRestoreDialog.tsx`

```typescript
import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

interface UserRestoreDialogProps {
  user: {
    id: string;
    name: string;
    email: string;
  } | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function UserRestoreDialog({ user, isOpen, onClose, onSuccess }: UserRestoreDialogProps) {
  const [reason, setReason] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleRestore = async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      const { data, error } = await supabase.rpc('restore_user', {
        target_user_id: user.id,
        restoration_reason: reason || null
      });
      
      if (error) throw error;
      
      toast.success('User restored successfully');
      onSuccess();
      onClose();
      setReason('');
    } catch (error: any) {
      console.error('Error restoring user:', error);
      toast.error(error.message || 'Failed to restore user');
    } finally {
      setIsLoading(false);
    }
  };

  if (!user) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>Restore User Account</DialogTitle>
          <DialogDescription>
            Restore access for {user.name} ({user.email})
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="reason">Reason for Restoration (Optional)</Label>
            <Textarea
              id="reason"
              placeholder="Please provide a reason for restoring this user..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleRestore} disabled={isLoading}>
            {isLoading ? 'Restoring...' : 'Restore User'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
```

## 4. Security Considerations

### 4.1 Access Control
- **Role-Based Access**: Only users with admin role can delete users
- **Self-Protection**: Admins cannot delete their own accounts
- **Permission Verification**: All functions verify admin status before execution

### 4.2 Audit Trail
- **Complete Logging**: All deletion and restoration actions are logged
- **Data Backup**: User data is backed up before deletion
- **Related Data Tracking**: Count and track all affected related records

### 4.3 Confirmation Workflow
- **Multi-Step Process**: Three-step confirmation for deletions
- **Explicit Confirmation**: Users must type exact confirmation text
- **Cascade Acknowledgment**: Hard deletions require explicit cascade confirmation

### 4.4 Data Protection
- **Soft Delete Default**: Soft deletion is the recommended option
- **Data Retention**: Soft-deleted data remains in database for potential restoration
- **Backup Strategy**: Critical user data is backed up before any deletion

## 5. Testing Strategy

### 5.1 Unit Tests
- Database function testing (soft_delete_user, hard_delete_user, restore_user)
- RLS policy verification
- Component rendering and interaction tests

### 5.2 Integration Tests
- End-to-end deletion workflow
- Data cascade verification
- Audit log creation and retrieval

### 5.3 Security Tests
- Unauthorized access prevention
- Self-deletion protection
- Role-based access verification

### 5.4 Performance Tests
- Large dataset deletion performance
- Related data counting efficiency
- Database constraint handling

### 5.5 Recovery Tests
- Soft deletion and restoration workflow
- Data integrity after restoration
- Audit trail completeness

## 6. Implementation Timeline

### Week 1: Database Layer
- [ ] Create migration files for soft deletion fields
- [ ] Implement user_deletion_logs table
- [ ] Update RLS policies
- [ ] Create and test database functions

### Week 2: Backend Integration
- [ ] Test database functions with various scenarios
- [ ] Implement related data counting function
- [ ] Add error handling and validation
- [ ] Performance optimization

### Week 3: Frontend Components
- [ ] Create UserDeleteDialog component
- [ ] Create UserRestoreDialog component
- [ ] Update UserManagementTable with delete actions
- [ ] Implement confirmation workflows

### Week 4: Testing & Refinement
- [ ] Unit and integration testing
- [ ] Security testing
- [ ] User acceptance testing
- [ ] Performance optimization
- [ ] Documentation updates

## 7. Monitoring and Maintenance

### 7.1 Metrics to Track
- Number of user deletions (soft vs hard)
- Deletion reasons analysis
- Restoration frequency
- Related data impact

### 7.2 Regular Maintenance
- Audit log cleanup (archive old logs)
- Soft-deleted user data review
- Performance monitoring
- Security audit of deletion permissions

## 8. Future Enhancements

### 8.1 Advanced Features
- Bulk user operations
- Scheduled deletions
- Data export before deletion
- Advanced filtering for deleted users

### 8.2 Compliance Features
- GDPR compliance tools
- Data retention policies
- Automated deletion workflows
- Enhanced audit reporting

## 9. Conclusion

This implementation plan provides a comprehensive, secure, and user-friendly approach to adding user deletion functionality to the MobiRides platform. The phased approach ensures minimal disruption to existing functionality while providing robust data management capabilities.

The combination of soft and hard deletion options, comprehensive audit trails, and multi-step confirmation processes ensures both data integrity and compliance with data protection requirements.

---

**Document Version**: 1.0  
**Last Updated**: January 2025  
**Next Review**: After Phase 1 Implementation
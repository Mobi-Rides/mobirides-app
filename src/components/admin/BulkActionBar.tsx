import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { X, Users, Trash2, Shield, Ban } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

type BulkAction = 'assign_role' | 'delete' | 'suspend';
type UserRole = 'renter' | 'host' | 'admin' | 'super_admin';

interface BulkActionBarProps {
  selectedUsers: string[];
  onClearSelection: () => void;
  className?: string;
}

export function BulkActionBar({ selectedUsers, onClearSelection, className }: BulkActionBarProps) {
  const [action, setAction] = useState<BulkAction | null>(null);
  const [selectedRole, setSelectedRole] = useState<UserRole>('renter');
  const [deleteReason, setDeleteReason] = useState('');
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const queryClient = useQueryClient();

  const bulkAssignRole = useMutation({
    mutationFn: async () => {
      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData?.session?.access_token;
      
      const { error } = await supabase.functions.invoke('bulk-assign-role', {
        body: { userIds: selectedUsers, role: selectedRole },
        headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : undefined,
      });
      
      if (error) throw new Error(error.message);
      return true;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      queryClient.invalidateQueries({ queryKey: ['admin-users-with-roles'] });
      onClearSelection();
      setAction(null);
      toast.success(`Successfully assigned ${selectedRole} role to ${selectedUsers.length} users`);
    },
    onError: (error: Error) => {
      toast.error(`Failed to assign roles: ${error.message}`);
    },
  });

  const bulkDeleteUsers = useMutation({
    mutationFn: async () => {
      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData?.session?.access_token;
      
      const { data, error } = await supabase.functions.invoke('bulk-delete-users', {
        body: { userIds: selectedUsers, reason: deleteReason },
        headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : undefined,
      });
      
      if (error) throw new Error(error.message);
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      queryClient.invalidateQueries({ queryKey: ['admin-users-with-roles'] });
      onClearSelection();
      setAction(null);
      setDeleteReason('');
      setShowConfirmDialog(false);
      
      const { summary } = data;
      if (summary.failed > 0) {
        toast.warning(`Deleted ${summary.successful} users, ${summary.failed} failed`);
      } else {
        toast.success(`Successfully deleted ${summary.successful} users`);
      }
    },
    onError: (error: Error) => {
      toast.error(`Failed to delete users: ${error.message}`);
      setShowConfirmDialog(false);
    },
  });

  const handleActionClick = (actionType: BulkAction) => {
    setAction(actionType);
    if (actionType === 'delete') {
      setShowConfirmDialog(true);
    }
  };

  const handleExecuteAction = () => {
    if (action === 'assign_role') {
      bulkAssignRole.mutate();
    } else if (action === 'delete') {
      if (!deleteReason.trim()) {
        toast.error('Please provide a reason for deletion');
        return;
      }
      bulkDeleteUsers.mutate();
    }
  };

  if (selectedUsers.length === 0) return null;

  const isPending = bulkAssignRole.isPending || bulkDeleteUsers.isPending;

  return (
    <>
      <div className={cn(
        "fixed bottom-0 left-0 right-0 z-50 bg-background border-t shadow-lg p-4",
        "animate-in slide-in-from-bottom-2 duration-200",
        className
      )}>
        <div className="container mx-auto flex flex-wrap items-center justify-between gap-4">
          {/* Selection Info */}
          <div className="flex items-center gap-3">
            <Badge variant="secondary" className="text-sm px-3 py-1">
              <Users className="h-4 w-4 mr-2" />
              {selectedUsers.length} user{selectedUsers.length !== 1 ? 's' : ''} selected
            </Badge>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClearSelection}
              disabled={isPending}
            >
              <X className="h-4 w-4 mr-1" />
              Clear
            </Button>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-3 flex-wrap">
            {/* Assign Role Action */}
            <div className="flex items-center gap-2">
              <Select 
                value={selectedRole} 
                onValueChange={(v) => setSelectedRole(v as UserRole)}
                disabled={isPending}
              >
                <SelectTrigger className="w-[130px]">
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="renter">Renter</SelectItem>
                  <SelectItem value="host">Host</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="super_admin">Super Admin</SelectItem>
                </SelectContent>
              </Select>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleActionClick('assign_role')}
                disabled={isPending}
              >
                <Shield className="h-4 w-4 mr-1" />
                Assign Role
              </Button>
            </div>

            {/* Delete Action */}
            <Button
              variant="destructive"
              size="sm"
              onClick={() => handleActionClick('delete')}
              disabled={isPending}
            >
              <Trash2 className="h-4 w-4 mr-1" />
              Delete Users
            </Button>
          </div>
        </div>

        {/* Assign Role Confirmation */}
        {action === 'assign_role' && (
          <div className="container mx-auto mt-3 pt-3 border-t flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Assign <Badge variant="outline">{selectedRole}</Badge> role to {selectedUsers.length} users?
            </p>
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" onClick={() => setAction(null)} disabled={isPending}>
                Cancel
              </Button>
              <Button size="sm" onClick={handleExecuteAction} disabled={isPending}>
                {bulkAssignRole.isPending ? 'Assigning...' : 'Confirm'}
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-destructive">
              <Trash2 className="h-5 w-5" />
              Delete {selectedUsers.length} User{selectedUsers.length !== 1 ? 's' : ''}?
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-4">
              <p>
                This action will permanently delete {selectedUsers.length} user{selectedUsers.length !== 1 ? 's' : ''} and all their associated data including:
              </p>
              <ul className="list-disc list-inside text-sm space-y-1">
                <li>Profile information</li>
                <li>All bookings and transactions</li>
                <li>Listed vehicles</li>
                <li>Messages and notifications</li>
                <li>Reviews and verifications</li>
              </ul>
              <p className="font-medium text-foreground">This action cannot be undone.</p>
              
              <div className="space-y-2 pt-2">
                <label className="text-sm font-medium text-foreground">
                  Reason for deletion (required):
                </label>
                <Input
                  placeholder="e.g., Test account cleanup, User request, etc."
                  value={deleteReason}
                  onChange={(e) => setDeleteReason(e.target.value)}
                />
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => {
              setAction(null);
              setDeleteReason('');
            }}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleExecuteAction}
              disabled={!deleteReason.trim() || bulkDeleteUsers.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {bulkDeleteUsers.isPending ? 'Deleting...' : `Delete ${selectedUsers.length} Users`}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

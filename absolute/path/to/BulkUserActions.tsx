import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';

type BulkAction = 'assign_role' | 'suspend' | 'activate';
type UserRole = 'renter' | 'host' | 'admin' | 'super_admin';

interface BulkUserActionsProps {
  selectedUsers: string[];
  onClearSelection: () => void;
}

export function BulkUserActions({ selectedUsers, onClearSelection }: BulkUserActionsProps) {
  const [action, setAction] = useState<BulkAction>('activate');
  const [selectedRole, setSelectedRole] = useState<UserRole>('renter');

  const performBulkAction = useMutation({
    mutationFn: async () => {
      if (action === 'assign_role') {
        // Bulk assign role
        const roleInserts = selectedUsers.map(userId => ({
          user_id: userId,
          role: selectedRole
        }));

        const { error } = await supabase
          .from('user_roles')
          .insert(roleInserts);

        if (error) throw error;
      } else {
        // Bulk suspend/activate
        const { error } = await supabase
          .from('profiles')
          .update({ is_active: action === 'activate' })
          .in('id', selectedUsers);

        if (error) throw error;
      }

      return true;
    },
    onSuccess: () => {
      onClearSelection();
      toast.success(`Bulk ${action} completed successfully`);
    },
    onError: (error: Error) => {
      toast.error(`Failed to perform bulk action: ${error.message}`);
    }
  });

  return (
    <div className="space-y-4 p-4 border rounded-lg">
      <h3 className="text-lg font-medium">Bulk User Actions</h3>

      <div className="space-y-2">
        <label className="text-sm font-medium">Action Type:</label>
        <Select value={action} onValueChange={(value) => setAction(value as BulkAction)}>
          <SelectTrigger>
            <SelectValue placeholder="Select action" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="activate">Activate Users</SelectItem>
            <SelectItem value="suspend">Suspend Users</SelectItem>
            <SelectItem value="assign_role">Assign Role</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {action === 'assign_role' && (
        <div className="space-y-2">
          <label className="text-sm font-medium">Role to Assign:</label>
          <Select value={selectedRole} onValueChange={(value) => setSelectedRole(value as UserRole)}>
            <SelectTrigger>
              <SelectValue placeholder="Select role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="renter">Renter</SelectItem>
              <SelectItem value="host">Host</SelectItem>
              <SelectItem value="admin">Admin</SelectItem>
              <SelectItem value="super_admin">Super Admin</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}

      <div className="text-sm text-gray-600">
        Selected users: {selectedUsers.length}
      </div>

      <Button
        onClick={() => performBulkAction.mutate()}
        disabled={selectedUsers.length === 0 || performBulkAction.isPending}
        className="w-full"
      >
        {performBulkAction.isPending ? 'Processing...' : `Apply ${action.replace('_', ' ')} to ${selectedUsers.length} users`}
      </Button>
    </div>
  );
}

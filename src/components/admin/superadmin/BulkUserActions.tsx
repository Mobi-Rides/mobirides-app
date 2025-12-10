import { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

type BulkAction = 'assign_role';
type UserRole = 'renter' | 'host' | 'admin' | 'super_admin';

interface BulkUserActionsProps {
  selectedUsers: string[];
  onClearSelection: () => void;
}

export function BulkUserActions({ selectedUsers, onClearSelection }: BulkUserActionsProps) {
  const [selectedRole, setSelectedRole] = useState<UserRole>('renter');
  const [action] = useState<BulkAction>('assign_role');

  // Fetch user details for selected users
  const { data: selectedUserDetails } = useQuery({
    queryKey: ['selected-users-details', selectedUsers],
    queryFn: async () => {
      if (selectedUsers.length === 0) return [];
      
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name')
        .in('id', selectedUsers);
      
      if (error) throw error;
      return data || [];
    },
    enabled: selectedUsers.length > 0,
  });

  const performBulkAction = useMutation({
    mutationFn: async () => {
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) throw sessionError;
      const accessToken = sessionData?.session?.access_token;
      const { error } = await supabase.functions.invoke('bulk-assign-role', {
        body: { userIds: selectedUsers, role: selectedRole },
        headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : undefined,
      });
      if (error) throw new Error(error.message);
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
      <h3 className="text-lg font-medium">Bulk Role Assignment</h3>

      <div className="space-y-2">
        <label className="text-sm font-medium">Role to Assign:</label>
        <Select value={selectedRole} onValueChange={(value: string) => setSelectedRole(value as UserRole)}>
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

      <div className="space-y-2">
        <p className="text-sm font-medium">Selected Users ({selectedUsers.length}):</p>
        {selectedUsers.length === 0 ? (
          <p className="text-sm text-gray-500">No users selected. Select users from the Roles tab.</p>
        ) : (
          <div className="max-h-32 overflow-y-auto border rounded-md p-2 text-sm">
            {selectedUserDetails?.map((user) => (
              <div key={user.id} className="flex items-center justify-between py-1">
                <span>{user.full_name || user.id}</span>
                <span className="text-xs text-muted-foreground">{user.id.slice(0, 8)}...</span>
              </div>
            )) || (
              <div className="text-sm text-muted-foreground">
                Loading user details...
              </div>
            )}
          </div>
        )}
      </div>

      <Button
        onClick={() => performBulkAction.mutate()}
        disabled={selectedUsers.length === 0 || performBulkAction.isPending}
        className="w-full"
      >
        {performBulkAction.isPending ? 'Processing...' : `Assign ${selectedRole} role to ${selectedUsers.length} users`}
      </Button>
    </div>
  );
}

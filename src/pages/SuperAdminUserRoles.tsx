import React, { useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import type { Database } from '@/integrations/supabase/types';
import { supabase } from '@/integrations/supabase/client';
import { getDisplayName } from '@/utils/displayName';

type UserRole = Database['public']['Enums']['user_role'];

interface UserWithRoles {
  id: string;
  email: string;
  full_name: string | null;
  current_roles: UserRole[];
}

interface SuperAdminUserRolesProps {
  onSelectUserForCapabilities?: (user: { id: string; name: string }) => void;
  onSelectionChange?: (selected: string[]) => void;
}

export const SuperAdminUserRoles: React.FC<SuperAdminUserRolesProps> = ({
  onSelectUserForCapabilities,
  onSelectionChange,
}) => {
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [newRole, setNewRole] = useState<UserRole>('renter');
  const [selectedIds, setSelectedIds] = useState<Record<string, boolean>>({});
  const queryClient = useQueryClient();

  const { data: users, isLoading } = useQuery<UserWithRoles[]>({
    queryKey: ['admin-users-with-roles'],
    queryFn: async () => {
      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData?.session?.access_token;
      const headers = accessToken ? { Authorization: `Bearer ${accessToken}` } : undefined;

      // Attempt GET to Edge Function (if implemented as GET)
      try {
        const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/user-with-roles`;
        const resp = await fetch(url, { method: 'GET', headers });
        if (resp.ok) {
          const json = await resp.json();
          const list = Array.isArray(json) ? json : (json?.data ?? []);
          if (Array.isArray(list) && list.length > 0) return list as UserWithRoles[];
        }
      } catch {}

      // Attempt POST via supabase.functions.invoke
      try {
        const first = await supabase.functions.invoke('user-with-roles', { headers });
        if (!first.error) {
          const list = Array.isArray(first.data) ? first.data : (first.data?.data ?? []);
          if (Array.isArray(list) && list.length > 0) return list as UserWithRoles[];
        }
        const second = await supabase.functions.invoke('users-with-roles', { headers });
        if (!second.error) {
          const list = Array.isArray(second.data) ? second.data : (second.data?.data ?? []);
          if (Array.isArray(list) && list.length > 0) return list as UserWithRoles[];
        }
      } catch {}

      // Resilient fallback: load all profiles, then join roles if present
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, full_name');
      if (profilesError) throw profilesError;

      const ids = (profiles || []).map((p: any) => p.id);
      let rolesByUser: Record<string, UserRole[]> = {};
      if (ids.length > 0) {
        const { data: roleData } = await supabase
          .from('user_roles')
          .select('user_id, role')
          .in('user_id', ids);
        rolesByUser = (roleData || []).reduce((acc: Record<string, UserRole[]>, item: any) => {
          if (!acc[item.user_id]) acc[item.user_id] = [] as UserRole[];
          acc[item.user_id].push(item.role as UserRole);
          return acc;
        }, {} as Record<string, UserRole[]>);
      }

      return (profiles || []).map((profile: any) => ({
        id: profile.id,
        email: null, // Email not available in fallback mode
        full_name: profile.full_name,
        current_roles: rolesByUser[profile.id] || [],
      }));
    }
  });

  const allSelected = useMemo(() => {
    const ids = users?.map(u => u.id) || [];
    return ids.length > 0 && ids.every(id => selectedIds[id]);
  }, [users, selectedIds]);

  const toggleAll = (checked: boolean) => {
    const ids = users?.map(u => u.id) || [];
    const next = ids.reduce((acc, id) => { acc[id] = checked; return acc; }, {} as Record<string, boolean>);
    setSelectedIds(next);
    onSelectionChange?.(Object.keys(next).filter(id => next[id]));
  };

  const toggleOne = (id: string, checked: boolean) => {
    const next = { ...selectedIds, [id]: checked };
    setSelectedIds(next);
    onSelectionChange?.(Object.keys(next).filter(key => next[key]));
  };

  const assignRoleMutation = useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: UserRole }) => {
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) throw sessionError;
      const accessToken = sessionData?.session?.access_token;
      const { data, error } = await supabase.functions.invoke('assign-role', {
        body: { userId, role },
        headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : undefined,
      });
      if (error) throw new Error(error.message);
      return data;
    },
    onSuccess: () => {
      toast.success('Role assigned successfully');
      setSelectedUserId(null);
      queryClient.invalidateQueries({ queryKey: ['admin-users-with-roles'] });
    },
    onError: (error) => {
      toast.error(`Failed to assign role: ${error.message}`);
    }
  });

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">User Role Management</h2>
      
      {isLoading ? (
        <div>Loading users...</div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={(e) => toggleAll(e.target.checked)}
                  aria-label="Select all"
                />
              </TableHead>
              <TableHead>User</TableHead>
              <TableHead>Current Roles</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users?.map((user) => (
              <TableRow key={user.id}>
                <TableCell>
                  <input
                    type="checkbox"
                    checked={!!selectedIds[user.id]}
                    onChange={(e) => toggleOne(user.id, e.target.checked)}
                    aria-label={`Select ${getDisplayName(user)}`}
                  />
                </TableCell>
                <TableCell>
                  <div className="flex flex-col">
                    <span>{getDisplayName(user)}</span>
                    {user.email && user.full_name && (
                      <span className="text-xs text-muted-foreground">{user.email}</span>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    {user.current_roles.map(role => (
                      <Badge key={role} variant="outline">
                        {role}
                      </Badge>
                    ))}
                  </div>
                </TableCell>
                <TableCell>
                    <Button 
                    variant="outline" 
                    onClick={() => setSelectedUserId(user.id)}
                  >
                    Assign Role
                  </Button>
                  {onSelectUserForCapabilities && (
                    <Button
                      variant="ghost"
                      className="ml-2"
                      onClick={() => onSelectUserForCapabilities({ id: user.id, name: getDisplayName(user) })}
                    >
                      Manage Capabilities
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      {/* Role Assignment Dialog */}
      {selectedUserId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg w-96">
            <h3 className="text-lg font-medium mb-4">Assign New Role</h3>
            
            <Select value={newRole} onValueChange={(value) => setNewRole(value as UserRole)}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="renter">Renter</SelectItem>
                <SelectItem value="host">Host</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="super_admin">Super Admin</SelectItem>
              </SelectContent>
            </Select>

            <div className="mt-4 flex justify-end gap-2">
              <Button 
                variant="outline" 
                onClick={() => setSelectedUserId(null)}
              >
                Cancel
              </Button>
              <Button 
                onClick={() => assignRoleMutation.mutate({ userId: selectedUserId, role: newRole })}
                disabled={assignRoleMutation.isPending}
              >
                {assignRoleMutation.isPending ? 'Assigning...' : 'Assign Role'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


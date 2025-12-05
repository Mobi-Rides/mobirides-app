import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { Database } from '@/integrations/supabase/types';

type UserRole = Database['public']['Enums']['user_role'];

interface UserWithRoles {
  id: string;
  email: string;
  full_name: string | null;
  current_roles: UserRole[];
}

export const useSuperAdminRoles = () => {
  const queryClient = useQueryClient();

  // Fetch all users with their roles
  const { data: users, isLoading, error } = useQuery<UserWithRoles[]>({
    queryKey: ['admin-users-with-roles'],
    queryFn: async () => {
      // First get all user roles grouped by user
      const { data: roleData, error: roleError } = await supabase
        .from('user_roles')
        .select('user_id, role');

      if (roleError) throw roleError;

      // Group roles by user_id
      const rolesByUser = roleData.reduce((acc, item) => {
        if (!acc[item.user_id]) {
          acc[item.user_id] = [];
        }
        acc[item.user_id].push(item.role);
        return acc;
      }, {} as Record<string, UserRole[]>);

      // Get unique user IDs
      const userIds = Object.keys(rolesByUser);

      // Get user profiles
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('id, full_name')
        .in('id', userIds);

      if (profileError) throw profileError;

      // Combine profile data with roles
      return profileData.map(profile => ({
        id: profile.id,
        email: '', // Email not available in profiles table
        full_name: profile.full_name,
        current_roles: rolesByUser[profile.id] || []
      }));
    }
  });

  // Assign role to user
  const assignRole = useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: UserRole }) => {
      const { error } = await supabase
        .from('user_roles')
        .insert({ user_id: userId, role });

      if (error) throw error;
      return true;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users-with-roles'] });
      toast.success('Role assigned successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to assign role: ${error.message}`);
    }
  });

  // Remove role from user
  const removeRole = useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: UserRole }) => {
      const { error } = await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', userId)
        .eq('role', role);

      if (error) throw error;
      return true;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users-with-roles'] });
      toast.success('Role removed successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to remove role: ${error.message}`);
    }
  });

  // Bulk operations
  const bulkAssignRole = useMutation({
    mutationFn: async ({ userIds, role }: { userIds: string[]; role: UserRole }) => {
      const roleInserts = userIds.map(userId => ({
        user_id: userId,
        role
      }));

      const { error } = await supabase
        .from('user_roles')
        .insert(roleInserts);

      if (error) throw error;
      return true;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users-with-roles'] });
      toast.success('Bulk role assignment completed');
    },
    onError: (error: Error) => {
      toast.error(`Bulk role assignment failed: ${error.message}`);
    }
  });



  return {
    users,
    isLoading,
    error,
    assignRole,
    removeRole,
    bulkAssignRole
  };
};

import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface AdminUserComplete {
  id: string;
  email: string | null;
  full_name: string | null;
  phone_number: string | null;
  role: string;
  created_at: string;
  avatar_url: string | null;
  verification_status: string | null;
  user_roles: string[];
  is_restricted: boolean;
  active_restrictions: Array<{
    id: string;
    restriction_type: string;
    reason: string;
    starts_at: string;
    ends_at: string | null;
  }>;
  vehicles_count: number;
  bookings_count: number;
}

export const useAdminUsersComplete = () => {
  return useQuery<AdminUserComplete[], Error>({
    queryKey: ["admin-users-complete"],
    queryFn: async (): Promise<AdminUserComplete[]> => {
      const { data, error } = await supabase.rpc('get_admin_users_complete');

      if (error) {
        console.error("Error fetching admin users:", error);
        throw error;
      }

      return (data || []).map((user: any) => ({
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        phone_number: user.phone_number,
        role: user.role,
        created_at: user.created_at,
        avatar_url: user.avatar_url,
        verification_status: user.verification_status,
        user_roles: user.user_roles || [],
        is_restricted: user.is_restricted || false,
        active_restrictions: user.active_restrictions || [],
        vehicles_count: user.vehicles_count || 0,
        bookings_count: user.bookings_count || 0,
      }));
    },
    staleTime: 30000, // 30 seconds
  });
};

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useIsAdmin } from "./useIsAdmin";

interface AdminActivityLog {
  id: string;
  admin_id: string;
  action: string;
  resource_type?: string;
  resource_id?: string;
  details: Record<string, any>;
  ip_address?: string;
  user_agent?: string;
  created_at: string;
}

export const useAdminActivityLog = () => {
  const { user } = useAuth();
  const { isAdmin, isSuperAdmin } = useIsAdmin();
  const [logs, setLogs] = useState<AdminActivityLog[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchLogs = useCallback(async (adminId?: string) => {
    if (!user || !isAdmin) return;

    setIsLoading(true);
    try {
      let query = supabase
        .from("admin_activity_logs")
        .select(`
          *,
          admin:admin_id(email, full_name)
        `)
        .order("created_at", { ascending: false })
        .limit(100);

      // Super admins can see all logs, regular admins only their own
      if (!isSuperAdmin || adminId) {
        query = query.eq("admin_id", adminId || user.id);
      }

      const { data, error } = await query;

      if (error) throw error;
      setLogs((data || []) as AdminActivityLog[]);
    } catch (error) {
      console.error("Error fetching admin activity logs:", error);
    } finally {
      setIsLoading(false);
    }
  }, [user, isAdmin, isSuperAdmin]);

  const logActivity = useCallback(async (
    action: string,
    resourceType?: string,
    resourceId?: string,
    details?: Record<string, any>
  ) => {
    if (!user || !isAdmin) return false;

    try {
      await supabase.rpc('log_admin_activity', {
        p_admin_id: user.id,
        p_action: action,
        p_resource_type: resourceType,
        p_resource_id: resourceId,
        p_details: details || {}
      });

      // Refresh logs after logging new activity
      await fetchLogs();
      return true;
    } catch (error) {
      console.error("Error logging admin activity:", error);
      return false;
    }
  }, [user, isAdmin, fetchLogs]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  return {
    logs,
    isLoading,
    logActivity,
    refetch: fetchLogs
  };
};
import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useIsAdmin } from "./useIsAdmin";

interface AdminSession {
  id: string;
  session_token: string;
  created_at: string;
  expires_at: string;
  last_activity: string;
  is_active: boolean;
}

export const useAdminSession = () => {
  const { user } = useAuth();
  const { isAdmin } = useIsAdmin();
  const [sessions, setSessions] = useState<AdminSession[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchSessions = useCallback(async () => {
    if (!user || !isAdmin) return;

    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("admin_sessions")
        .select("*")
        .eq("admin_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setSessions(data || []);
    } catch (error) {
      console.error("Error fetching admin sessions:", error);
    } finally {
      setIsLoading(false);
    }
  }, [user, isAdmin]);

  const createSession = useCallback(async () => {
    if (!user || !isAdmin) return null;

    try {
      const sessionToken = crypto.randomUUID();
      
      const { data, error } = await supabase
        .from("admin_sessions")
        .insert({
          admin_id: user.id,
          session_token: sessionToken,
        })
        .select()
        .single();

      if (error) throw error;
      
      // Log admin activity
      await supabase.rpc('log_admin_activity', {
        p_admin_id: user.id,
        p_action: 'session_created',
        p_resource_type: 'admin_session',
        p_resource_id: data.id
      });

      await fetchSessions();
      return data;
    } catch (error) {
      console.error("Error creating admin session:", error);
      return null;
    }
  }, [user, isAdmin, fetchSessions]);

  const deactivateSession = useCallback(async (sessionId: string) => {
    if (!user || !isAdmin) return false;

    try {
      const { error } = await supabase
        .from("admin_sessions")
        .update({ is_active: false })
        .eq("id", sessionId)
        .eq("admin_id", user.id);

      if (error) throw error;

      // Log admin activity
      await supabase.rpc('log_admin_activity', {
        p_admin_id: user.id,
        p_action: 'session_deactivated',
        p_resource_type: 'admin_session',
        p_resource_id: sessionId
      });

      await fetchSessions();
      return true;
    } catch (error) {
      console.error("Error deactivating session:", error);
      return false;
    }
  }, [user, isAdmin, fetchSessions]);

  const cleanupExpiredSessions = useCallback(async () => {
    if (!user || !isAdmin) return false;

    try {
      const { error } = await supabase.rpc('cleanup_expired_admin_sessions');
      if (error) throw error;

      await fetchSessions();
      return true;
    } catch (error) {
      console.error("Error cleaning up expired sessions:", error);
      return false;
    }
  }, [user, isAdmin, fetchSessions]);

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  return {
    sessions,
    isLoading,
    createSession,
    deactivateSession,
    cleanupExpiredSessions,
    refetch: fetchSessions
  };
};
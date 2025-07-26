import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

export const useIsAdmin = () => {
  const { user, isAuthenticated } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAdminStatus = async () => {
      if (!isAuthenticated || !user) {
        setIsAdmin(false);
        setIsLoading(false);
        return;
      }

      try {
        // Check if user is in admins table
        const { data: adminData } = await supabase
          .from("admins")
          .select("id, is_super_admin")
          .eq("id", user.id)
          .single();

        if (adminData) {
          setIsAdmin(true);
          setIsLoading(false);
          return;
        }

        // Check if user has admin role in profiles
        const { data: profileData } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", user.id)
          .single();

        setIsAdmin(profileData?.role === 'admin');
      } catch (error) {
        console.error("Error checking admin status:", error);
        setIsAdmin(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkAdminStatus();
  }, [user, isAuthenticated]);

  return { isAdmin, isLoading };
};
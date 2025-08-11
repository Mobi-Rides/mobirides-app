import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

interface AdminInfo {
  id: string;
  is_super_admin: boolean;
}

export const useIsAdmin = () => {
  const { user, isAuthenticated } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [adminInfo, setAdminInfo] = useState<AdminInfo | null>(null);

  useEffect(() => {
    const checkAdminStatus = async () => {
      if (!isAuthenticated || !user) {
        setIsAdmin(false);
        setIsSuperAdmin(false);
        setAdminInfo(null);
        setIsLoading(false);
        return;
      }

      try {
        // Use the secure is_admin function instead of dual checking
        const { data: isAdminResult, error: adminError } = await supabase
          .rpc('is_admin', { user_uuid: user.id });

        if (adminError) {
          console.error("Error checking admin status:", adminError);
          setIsAdmin(false);
          setIsSuperAdmin(false);
          setAdminInfo(null);
          setIsLoading(false);
          return;
        }

        if (isAdminResult) {
          // Get admin details
          const { data: adminData } = await supabase
            .from("admins")
            .select("id, is_super_admin")
            .eq("id", user.id)
            .maybeSingle();

          if (adminData) {
            setIsAdmin(true);
            setIsSuperAdmin(adminData.is_super_admin || false);
            setAdminInfo(adminData);
          } else {
            setIsAdmin(false);
            setIsSuperAdmin(false);
            setAdminInfo(null);
          }
        } else {
          setIsAdmin(false);
          setIsSuperAdmin(false);
          setAdminInfo(null);
        }
      } catch (error) {
        console.error("Error checking admin status:", error);
        setIsAdmin(false);
        setIsSuperAdmin(false);
        setAdminInfo(null);
      } finally {
        setIsLoading(false);
      }
    };

    checkAdminStatus();
  }, [user, isAuthenticated]);

  return { 
    isAdmin, 
    isSuperAdmin, 
    isLoading, 
    adminInfo 
  };
};
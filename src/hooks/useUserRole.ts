
import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

type UserRole = "host" | "renter" | null;

export const useUserRole = () => {
  const { user, isAuthenticated } = useAuth();
  const [userRole, setUserRole] = useState<UserRole>(null);
  const [isLoadingRole, setIsLoadingRole] = useState(true);

  useEffect(() => {
    const fetchUserRole = async () => {
      if (!isAuthenticated || !user) {
        setUserRole(null);
        setIsLoadingRole(false);
        return;
      }

      try {
        setIsLoadingRole(true);
        console.log("Fetching role for user ID:", user.id);
        
        const { data: profile, error } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", user.id)
          .single();

        if (error) {
          console.error("Profile error:", error);
          setUserRole("renter"); // Default fallback
        } else if (profile) {
          console.log("User role fetched:", profile.role);
          setUserRole(profile.role as UserRole);
        }
      } catch (error) {
        console.error("Error fetching user role:", error);
        setUserRole("renter"); // Default fallback
      } finally {
        setIsLoadingRole(false);
      }
    };

    fetchUserRole();
  }, [isAuthenticated, user]);

  return { userRole, isLoadingRole };
};

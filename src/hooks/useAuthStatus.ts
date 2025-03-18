
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type UserRole = "host" | "renter" | null;

export const useAuthStatus = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState<UserRole>(null);
  const [isLoadingRole, setIsLoadingRole] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setIsAuthenticated(!!session);
    };
    
    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsAuthenticated(!!session);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    const fetchUserRole = async () => {
      try {
        setIsLoadingRole(true);
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error("Session error:", sessionError);
          toast.error("Failed to fetch user session. Please try refreshing the page.");
          setUserRole(null);
          return;
        }
        
        if (session?.user) {
          console.log("Fetching role for user ID:", session.user.id);
          const { data: profile, error: profileError } = await supabase
            .from("profiles")
            .select("role")
            .eq("id", session.user.id)
            .single();

          if (profileError) {
            console.error("Profile error:", profileError);
            toast.error("Failed to fetch user profile. Please try refreshing the page.");
            setUserRole(null);
            return;
          }

          if (profile) {
            console.log("User role:", profile.role);
            setUserRole(profile.role as UserRole);
          }
        }
      } catch (error) {
        console.error("Error fetching user role:", error);
        toast.error("An unexpected error occurred. Please try refreshing the page.");
      } finally {
        setIsLoadingRole(false);
      }
    };

    fetchUserRole();
  }, []);

  return { isAuthenticated, userRole, isLoadingRole };
};

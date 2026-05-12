import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type UserRole = "host" | "renter" | "admin" | "super_admin" | null;

export const useAuthStatus = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState<UserRole>(null);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [isLoadingRole, setIsLoadingRole] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        console.log("Checking auth status...");
        const {
          data: { session },
          error,
        } = await supabase.auth.getSession();

        if (error) {
          console.error("Session error in useAuthStatus:", error);
          setIsAuthenticated(false);
          return;
        }

        const isAuthValid = !!session;
        console.log(
          "Auth status:",
          isAuthValid ? "Authenticated" : "Not authenticated",
        );
        setIsAuthenticated(isAuthValid);

        if (session?.user) {
          setUserId(session.user.id);
          console.log("User ID set:", session.user.id);
        }
      } catch (error) {
        console.error("Error checking auth:", error);
        setIsAuthenticated(false);
      } finally {
        setIsCheckingAuth(false);
      }
    };

    checkAuth();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      const isAuthValid = !!session;
      console.log(
        "Auth state changed:",
        isAuthValid ? "Authenticated" : "Not authenticated",
      );
      setIsAuthenticated(isAuthValid);

      if (session?.user) {
        setUserId(session.user.id);
        console.log("User ID updated:", session.user.id);
      } else {
        setUserId(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    const fetchUserRole = async () => {
      try {
        if (isCheckingAuth) return;

        if (!isAuthenticated) {
          setIsLoadingRole(false);
          return;
        }

        setIsLoadingRole(true);
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
          setUserRole(null);
          setIsLoadingRole(false);
          return;
        }

        console.log("Fetching roles for user ID:", user.id);
        
        // Fetch from user_roles table (the new source of truth)
        // Note: A user can have multiple roles, but we'll prioritize the highest one
        const { data: roles, error: rolesError } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", user.id);

        if (rolesError) {
          console.error("Error fetching user roles:", rolesError);
          
          // Fallback to profiles.role if user_roles fetch fails (e.g. table doesn't exist yet in local env)
          const { data: profile } = await supabase
            .from("profiles")
            .select("role")
            .eq("id", user.id)
            .single();
            
          if (profile) {
            setUserRole(profile.role as UserRole);
          }
        } else if (roles && roles.length > 0) {
          // Priority logic: super_admin > admin > host > renter
          const roleList = roles.map(r => r.role);
          if (roleList.includes('super_admin')) setUserRole('super_admin');
          else if (roleList.includes('admin')) setUserRole('admin');
          else if (roleList.includes('host')) setUserRole('host');
          else if (roleList.includes('renter')) setUserRole('renter');
        } else {
          // Final fallback to profiles if no user_roles records found
          const { data: profile } = await supabase
            .from("profiles")
            .select("role")
            .eq("id", user.id)
            .single();
          if (profile) setUserRole(profile.role as UserRole);
        }
      } catch (error) {
        console.error("Error in fetchUserRole:", error);
      } finally {
        setIsLoadingRole(false);
      }
    };

    fetchUserRole();
  }, [isAuthenticated, isCheckingAuth]);

  return { isAuthenticated, userRole, isLoadingRole: isCheckingAuth || isLoadingRole, userId };
};

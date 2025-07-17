import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type UserRole = "host" | "renter" | null;

export const useAuthStatus = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState<UserRole>(null);
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
        if (!isAuthenticated) {
          console.log("Not authenticated, skipping role fetch");
          setIsLoadingRole(false);
          return;
        }

        setIsLoadingRole(true);
        console.log("Fetching user role...");
        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession();

        if (sessionError) {
          console.error("Session error in fetchUserRole:", sessionError);
          toast.error(
            "Failed to fetch user session. Please try refreshing the page.",
          );
          setUserRole(null);
          setIsLoadingRole(false);
          return;
        }

        if (!session?.user) {
          console.log("No active session or user");
          setUserRole(null);
          setIsLoadingRole(false);
          return;
        }

        console.log("Fetching role for user ID:", session.user.id);
        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", session.user.id)
          .single();

        if (profileError) {
          console.error("Profile error:", profileError);
          const errorMessage =
            profileError.message ||
            "Failed to fetch user profile. Please try refreshing the page.";
          toast.error(errorMessage);
          setUserRole(null);
        } else if (profile) {
          console.log("User role fetched:", profile.role);
          setUserRole(profile.role as UserRole);
        }
      } catch (error) {
        console.error("Error fetching user role:", error);
        toast.error(
          "An unexpected error occurred. Please try refreshing the page.",
        );
      } finally {
        setIsLoadingRole(false);
      }
    };

    fetchUserRole();
  }, [isAuthenticated]);

  return { isAuthenticated, userRole, isLoadingRole, userId };
};

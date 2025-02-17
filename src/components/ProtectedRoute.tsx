
import { useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const [loading, setLoading] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);
  const location = useLocation();

  useEffect(() => {
    console.log("ProtectedRoute: Initializing");
    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("Auth state changed:", event, !!session);
      
      if (event === 'SIGNED_OUT' || event === 'USER_DELETED') {
        console.log("User signed out or deleted");
        setAuthenticated(false);
        setLoading(false);
        return;
      }

      if (event === 'TOKEN_REFRESHED') {
        console.log("Token refresh attempt completed");
        if (session) {
          console.log("Token refresh successful");
          setAuthenticated(true);
        } else {
          console.log("Token refresh failed - clearing auth state");
          handleAuthError();
        }
        setLoading(false);
      }
    });

    return () => {
      console.log("ProtectedRoute: Cleaning up subscription");
      subscription.unsubscribe();
    };
  }, []);

  const handleAuthError = async () => {
    console.log("Handling auth error - signing out user");
    await supabase.auth.signOut();
    setAuthenticated(false);
    toast.error("Your session has expired. Please sign in again.");
  };

  const checkAuth = async () => {
    try {
      console.log("ProtectedRoute: Checking auth status");
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error("Error checking auth status:", error);
        handleAuthError();
        return;
      }

      if (!session) {
        console.log("No active session found");
        setAuthenticated(false);
        setLoading(false);
        return;
      }

      // Verify token is still valid
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !user) {
        console.log("Invalid session or user data");
        handleAuthError();
        return;
      }

      console.log("Valid session found for user:", user.id);
      setAuthenticated(true);
    } catch (error) {
      console.error("Error in checkAuth:", error);
      handleAuthError();
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!authenticated) {
    console.log("User not authenticated, redirecting to login");
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};

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

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log("Auth state changed:", event, !!session);
      
      if (event === 'SIGNED_OUT' || event === 'TOKEN_REFRESHED') {
        setAuthenticated(!!session);
        setLoading(false);
      }

      // Handle token refresh errors
      if (event === 'TOKEN_REFRESHED' && !session) {
        console.log("Token refresh failed");
        toast.error("Your session has expired. Please sign in again.");
        setAuthenticated(false);
        setLoading(false);
      }
    });

    return () => {
      console.log("ProtectedRoute: Cleaning up subscription");
      subscription.unsubscribe();
    };
  }, []);

  const checkAuth = async () => {
    try {
      console.log("ProtectedRoute: Checking auth status");
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error("Error checking auth status:", error);
        toast.error("Authentication error. Please sign in again.");
        setAuthenticated(false);
        return;
      }

      if (!session) {
        console.log("No active session found");
        setAuthenticated(false);
        return;
      }

      console.log("Valid session found");
      setAuthenticated(true);
    } catch (error) {
      console.error("Error in checkAuth:", error);
      setAuthenticated(false);
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
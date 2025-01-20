import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";

export const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const navigate = useNavigate();
  const { toast } = useToast();

  const { data: session, isLoading: sessionLoading } = useQuery({
    queryKey: ["session"],
    queryFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      return session;
    },
  });

  // Temporarily disable license check for development
  const hasLicense = true;
  const licenseLoading = false;

  useEffect(() => {
    if (!sessionLoading && !session) {
      toast({
        title: "Authentication required",
        description: "Please log in to access this page",
        variant: "destructive",
      });
      navigate("/login");
    }
  }, [session, sessionLoading, navigate, toast]);

  if (sessionLoading || licenseLoading) {
    return <div>Loading...</div>;
  }

  return <>{children}</>;
};
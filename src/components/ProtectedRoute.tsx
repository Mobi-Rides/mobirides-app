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

  const { data: hasLicense, isLoading: licenseLoading } = useQuery({
    queryKey: ["driver-license"],
    enabled: !!session?.user,
    queryFn: async () => {
      const { data } = await supabase
        .from("driver_licenses")
        .select("id")
        .eq("user_id", session!.user.id)
        .single();
      return !!data;
    },
  });

  useEffect(() => {
    if (!sessionLoading && !session) {
      toast({
        title: "Authentication required",
        description: "Please log in to access this page",
        variant: "destructive",
      });
      navigate("/login");
    } else if (!licenseLoading && session && !hasLicense) {
      const currentPath = window.location.pathname;
      if (currentPath !== "/driver-license") {
        toast({
          title: "Driver License Required",
          description: "Please provide your driver license information to continue",
        });
        navigate("/driver-license");
      }
    }
  }, [session, sessionLoading, hasLicense, licenseLoading, navigate, toast]);

  if (sessionLoading || licenseLoading) {
    return <div>Loading...</div>;
  }

  return <>{children}</>;
};

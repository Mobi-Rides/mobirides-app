
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useIsMobile } from "@/hooks/use-mobile";
import { useQuery } from "@tanstack/react-query"; // Import useQuery
import { supabase } from "@/integrations/supabase/client"; // Import supabase client

export const DashboardHeader = () => {
  const navigate = useNavigate();
// Dashboard Header changed to Host Dashboard
  const { data: userRole, isLoading: isLoadingRole } = useQuery({
    queryKey: ["user-role"], // Unique query key for user role
    queryFn: async () => {
      const { data: { user } = {} } = await supabase.auth.getUser();
      if (!user) return "renter";
  
      const { data: profile, error } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();
       if (error) {
        console.error("Error fetching user profile:", error);
        return "renter"; // Fallback to renter on error
      }
      return profile?.role || "renter"; // Default to renter if no role found
    },
    staleTime: Infinity, // Role doesn't change often, can be very stale
    gcTime: Infinity, // Keep cached indefinitely
  });
  // Determine the dashboard title based on the user's role
  const dashboardTitle = userRole === "host" ? "Host Dashboard" : "Dashboard";

  return (
    <div className="flex items-center justify-between mb-4">
      <div className="py-2 flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        {isLoadingRole ? (
          <div className="h-6 w-32 bg-gray-200 rounded animate-pulse"></div> // Skeleton for loading title
        ) : (
          <h1 className="text-xl md:text-2xl font-semibold text-foreground">
            {dashboardTitle}
          </h1>
        )}
      </div>
      <ThemeToggle />
    </div>
  );
};

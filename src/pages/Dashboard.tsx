
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Navigation } from "@/components/Navigation";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { RenterDashboard } from "@/components/dashboard/RenterDashboard";
import { HostDashboard } from "@/components/dashboard/HostDashboard";
import { useEffect, useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";

const Dashboard = () => {
  const [userRole, setUserRole] = useState<"host" | "renter" | "admin" | null>(null);

  useEffect(() => {
    const getUserRole = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      console.log("Fetching user role for dashboard");
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

      if (profile?.role) {
        console.log("User role:", profile.role);
        setUserRole(profile.role);
      }
    };

    getUserRole();
  }, []);

  if (!userRole) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <Skeleton className="h-8 w-48 mb-6" />
          <div className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[...Array(4)].map((_, i) => (
                <Skeleton key={i} className="h-24 w-full" />
              ))}
            </div>
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
        </div>
        <Navigation />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-3 sm:px-4 py-3 sm:py-4 pb-20">
        <DashboardHeader />
        <div className="mt-2">
          {userRole === "renter" ? (
            <RenterDashboard />
          ) : userRole === "admin" ? (
            <div className="text-center py-8">
              <h2 className="text-lg font-semibold">Admin Dashboard</h2>
              <p className="text-muted-foreground">Access admin panel at /admin</p>
            </div>
          ) : (
            <HostDashboard />
          )}
        </div>
        <Navigation />  
      </div>
    </div>
  );
};

export default Dashboard;

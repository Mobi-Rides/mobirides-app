
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Navigation } from "@/components/Navigation";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { RenterDashboard } from "@/components/dashboard/RenterDashboard";
import { HostDashboard } from "@/components/dashboard/HostDashboard";
import { useEffect, useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";

const Dashboard = () => {
  const [userRole, setUserRole] = useState<"host" | "renter" | null>(null);

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
      <div className="container mx-auto px-4 py-8 bg-background dark:bg-background">
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
        <Navigation />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-4 pb-20 bg-background min-h-screen">
      <DashboardHeader />
      <div className="mt-2">
        {userRole === "renter" ? <RenterDashboard /> : <HostDashboard />}
      </div>
      <Navigation />
    </div>
  );
};

export default Dashboard;

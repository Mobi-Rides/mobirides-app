
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { Navigation } from "@/components/Navigation";
import { Header } from "@/components/Header";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { RenterDashboard } from "@/components/dashboard/RenterDashboard";
import { HostDashboard } from "@/components/dashboard/HostDashboard";
import { AdminStats } from "@/components/admin/AdminStats";
import { useEffect, useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";

type DashboardView = "renter" | "host" | "admin";

const Dashboard = () => {
  const [userRole, setUserRole] = useState<"host" | "renter" | "admin" | null>(null);
  const [currentView, setCurrentView] = useState<DashboardView>("renter");
  const [searchQuery, setSearchQuery] = useState("");
  const { isAdmin } = useIsAdmin();

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
        
        // Set default view based on user role, but allow admin to switch
        if (profile.role === "admin" && isAdmin) {
          setCurrentView("admin");
        } else if (profile.role === "host") {
          setCurrentView("host");
        } else {
          setCurrentView("renter");
        }
      }
    };

    getUserRole();
  }, [isAdmin]);

  const handleViewChange = (view: DashboardView) => {
    setCurrentView(view);
  };

  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
  };

  const handleFiltersChange = (filters: any) => {
    // Dashboard doesn't need filter functionality, but Header requires it
    console.log("Filters changed:", filters);
  };

  const renderDashboardContent = () => {
    switch (currentView) {
      case "admin":
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-lg font-semibold mb-2">Admin Dashboard</h2>
              <p className="text-muted-foreground mb-6">Monitor platform performance and manage operations</p>
              <div className="flex justify-center mb-6">
                <a href="/admin" className="inline-flex items-center px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors">
                  Open Full Admin Panel
                </a>
              </div>
            </div>
            <AdminStats />
          </div>
        );
      case "host":
        return <HostDashboard />;
      case "renter":
      default:
        return <RenterDashboard />;
    }
  };

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
      <Header 
        searchQuery={searchQuery}
        onSearchChange={handleSearchChange}
        onFiltersChange={handleFiltersChange}
      />
      <div className="container mx-auto px-3 sm:px-4 py-3 sm:py-4 pb-20">
        <DashboardHeader 
          currentView={currentView}
          onViewChange={handleViewChange}
          isAdmin={isAdmin}
        />
        <div className="mt-2">
          {renderDashboardContent()}
        </div>
        <Navigation />  
      </div>
    </div>
  );
};

export default Dashboard;

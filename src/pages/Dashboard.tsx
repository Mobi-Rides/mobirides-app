
import { Navigation } from "@/components/Navigation";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { RenterDashboard } from "@/components/dashboard/RenterDashboard";
import { HostDashboard } from "@/components/dashboard/HostDashboard";
import { Skeleton } from "@/components/ui/skeleton";
import { useUserRole } from "@/hooks/useUserRole";

const Dashboard = () => {
  const { userRole, isLoadingRole } = useUserRole();

  if (isLoadingRole) {
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
          {userRole === "renter" ? <RenterDashboard /> : <HostDashboard />}
        </div>
        <Navigation />  
      </div>
    </div>
  );
};

export default Dashboard;


import { HostBookings } from "@/pages/HostBookings";
import { RenterBookings } from "@/pages/RenterBookings";
import { Skeleton } from "@/components/ui/skeleton";
import { Navigation } from "@/components/Navigation";
import { useUserRole } from "@/hooks/useUserRole";

export const BookingRouter = () => {
  const { userRole, isLoadingRole } = useUserRole();

  if (isLoadingRole) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container py-4 space-y-4">
          <Skeleton className="h-8 w-48 mb-6" />
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-20 w-full" />
            ))}
          </div>
        </div>
        <Navigation />
      </div>
    );
  }

  return userRole === "host" ? <HostBookings /> : <RenterBookings />;
};

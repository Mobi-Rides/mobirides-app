
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStatus } from "@/hooks/useAuthStatus";
import { Skeleton } from "@/components/ui/skeleton";

const RoleAwareBookingsRedirect = () => {
  const navigate = useNavigate();
  const { userRole, isLoadingRole } = useAuthStatus();

  useEffect(() => {
    if (!isLoadingRole && userRole) {
      if (userRole === "host") {
        navigate("/host-bookings", { replace: true });
      } else {
        navigate("/renter-bookings", { replace: true });
      }
    }
  }, [userRole, isLoadingRole, navigate]);

  if (isLoadingRole) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container py-4 space-y-4">
          <Skeleton className="h-8 w-48" />
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-20 w-full" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return null;
};

export default RoleAwareBookingsRedirect;

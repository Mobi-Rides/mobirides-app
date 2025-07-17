
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useUserRole } from "@/hooks/useUserRole";
import { Skeleton } from "@/components/ui/skeleton";

export const RoleAwareBookingsRedirect = () => {
  const { userRole, isLoadingRole } = useUserRole();
  const navigate = useNavigate();

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
          <div className="px-4 py-4 mb-4">
            <Skeleton className="h-8 w-48" />
          </div>
          <div className="px-4 space-y-4">
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
          </div>
        </div>
      </div>
    );
  }

  return null;
};


import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useUserRole } from "@/hooks/useUserRole";

export const DashboardHeader = () => {
  const navigate = useNavigate();
  const { userRole, isLoadingRole } = useUserRole();

  // Determine the dashboard title based on the user's role
  const dashboardTitle = userRole === "host" ? "Host Dashboard" : "Dashboard";

  return (
    <div className="flex items-center justify-between mb-4">
      <div className="py-2 flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        {isLoadingRole ? (
          <div className="h-6 w-32 bg-gray-200 rounded animate-pulse"></div>
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

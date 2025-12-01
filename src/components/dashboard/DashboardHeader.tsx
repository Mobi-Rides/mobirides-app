
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { ThemeToggle } from "@/components/ThemeToggle";
import { RoleSwitcher } from "./RoleSwitcher";

type DashboardView = "renter" | "host" | "admin";

interface DashboardHeaderProps {
  currentView: DashboardView;
  onViewChange: (view: DashboardView) => void;
  isAdmin: boolean;
}

export const DashboardHeader = ({ currentView, onViewChange, isAdmin }: DashboardHeaderProps) => {
  const navigate = useNavigate();

  return (
    <div className="space-y-4 mb-6">
      <div className="flex items-center justify-between">
        <div className="py-2 flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-xl md:text-2xl font-semibold text-foreground">
            Dashboard
          </h1>
        </div>
        <ThemeToggle />
      </div>
      <div className="flex justify-center">
        <RoleSwitcher 
          currentView={currentView}
          onViewChange={onViewChange}
          isAdmin={isAdmin}
        />
      </div>
    </div>
  );
};

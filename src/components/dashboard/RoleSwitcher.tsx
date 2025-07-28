import { Button } from "@/components/ui/button";
import { Shield, Car, ShoppingBag } from "lucide-react";

type DashboardView = "renter" | "host" | "admin";

interface RoleSwitcherProps {
  currentView: DashboardView;
  onViewChange: (view: DashboardView) => void;
  isAdmin: boolean;
}

export const RoleSwitcher = ({ currentView, onViewChange, isAdmin }: RoleSwitcherProps) => {
  const views = [
    { id: "renter" as const, label: "Renter", icon: ShoppingBag },
    { id: "host" as const, label: "Host", icon: Car },
    ...(isAdmin ? [{ id: "admin" as const, label: "Admin", icon: Shield }] : []),
  ];

  return (
    <div className="flex bg-muted rounded-lg p-1 gap-1">
      {views.map(({ id, label, icon: Icon }) => (
        <Button
          key={id}
          variant={currentView === id ? "default" : "ghost"}
          size="sm"
          onClick={() => onViewChange(id)}
          className={`flex items-center gap-2 transition-all ${
            currentView === id 
              ? "bg-background shadow-sm" 
              : "hover:bg-background/50"
          }`}
        >
          <Icon className="h-4 w-4" />
          {label}
        </Button>
      ))}
    </div>
  );
};
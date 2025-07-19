
import { useNavigate } from "react-router-dom";
import { CalendarClock, LayoutDashboard, Bookmark, Wallet } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface ProfileVehicleTabProps {
  role?: string;
}

interface MenuItem {
  icon: any;
  label: string;
  onClick: () => void;
  description?: string;
  animate?: boolean;
}

export const ProfileVehicleTab = ({ role = 'renter' }: ProfileVehicleTabProps) => {
  const navigate = useNavigate();

  const baseMenuItems: MenuItem[] = [
    {
      icon: Bookmark,
      label: "Saved Cars",
      onClick: () => navigate("/saved-cars"),
    },
    {
      icon: LayoutDashboard,
      label: "Dashboard",
      onClick: () => navigate("/dashboard"),
    },
    {
      icon: CalendarClock,
      label: "My Bookings",
      onClick: () => navigate("/bookings"),
      animate: true,
    },
  ];

  // Add wallet menu item only for hosts
  const hostOnlyItems: MenuItem[] = role === 'host' ? [
    {
      icon: Wallet,
      label: "Wallet & Earnings",
      onClick: () => navigate("/wallet"),
      description: "Manage your wallet balance and view transaction history"
    }
  ] : [];

  const allItems = [...baseMenuItems, ...hostOnlyItems];

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg text-left">Vehicle & Bookings</CardTitle>
        <CardDescription className="text-left">
          Manage your saved vehicles, booking activities{role === 'host' ? ', and wallet' : ''}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-2 pt-0">
        {allItems.map((item, idx) => (
          <button
            key={idx}
            type="button"
            onClick={item.onClick}
            aria-label={item.label}
            className={`w-full flex items-center justify-between p-3 rounded-lg hover:bg-accent/70 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring transition-colors text-foreground ${item.animate ? "animate-throb" : ""}`}
          >
            <div className="flex items-center gap-3">
              <item.icon className="h-5 w-5" />
              <div className="flex flex-col items-start">
                <span>{item.label}</span>
                {item.description && (
                  <span className="text-xs text-muted-foreground">{item.description}</span>
                )}
              </div>
            </div>
          </button>
        ))}
      </CardContent>
    </Card>
  );
};

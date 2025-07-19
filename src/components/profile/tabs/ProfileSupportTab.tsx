
import { useNavigate } from "react-router-dom";
import { HelpCircle, LogOut } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface MenuItem {
  icon: any;
  label: string;
  onClick: () => void;
  color?: string;
}

export const ProfileSupportTab = () => {
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      toast.success("Logged out successfully");
      navigate("/login");
    } catch (error) {
      console.error("Error logging out:", error);
      toast.error("Failed to log out");
    }
  };

  const helpItems: MenuItem[] = [
    {
      icon: HelpCircle,
      label: "Help & Support",
      onClick: () => toast("Help center coming soon"),
    },
  ];

  const logoutItem: MenuItem = {
    icon: LogOut,
    label: "Log Out",
    onClick: handleLogout,
    color: "text-red-600",
  };

  return (
    <div className="space-y-6">
      {/* Help & Support section */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg text-left">Help & Support</CardTitle>
          <CardDescription className="text-left">Get assistance and learn more about MobiRides</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2 pt-0">
          {helpItems.map((item, idx) => (
            <button
              key={idx}
              type="button"
              onClick={item.onClick}
              aria-label={item.label}
              className={`w-full flex items-center justify-between p-3 rounded-lg hover:bg-accent/70 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring transition-colors ${item.color || "text-foreground"}`}
            >
              <div className="flex items-center gap-3">
                <item.icon className="h-5 w-5" />
                <span>{item.label}</span>
              </div>
            </button>
          ))}
        </CardContent>
      </Card>

      {/* Logout section */}
      <button
        type="button"
        onClick={logoutItem.onClick}
        aria-label={logoutItem.label}
        className={`w-full flex items-center justify-between p-3 rounded-lg hover:bg-accent/70 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring transition-colors ${logoutItem.color}`}
      >
        <div className="flex items-center gap-3">
          <LogOut className="h-5 w-5" />
          <span>{logoutItem.label}</span>
        </div>
      </button>
    </div>
  );
};

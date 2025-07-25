
import { Settings, Info, HelpCircle, Shield, Bell, LogOut, User } from "lucide-react";
import { Navigation } from "@/components/Navigation";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/utils/toast-utils";

const More = () => {
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

  const menuItems = [
    {
      icon: User,
      label: "My Profile",
      onClick: () => navigate("/profile"),
      className: "text-primary",
    },
    {
      icon: Settings,
      label: "App Settings",
      onClick: () => toast.info("App Settings coming soon"),
    },
    {
      icon: Bell,
      label: "Notification Preferences",
      onClick: () => navigate("/notification-preferences"),
    },
    {
      icon: Shield,
      label: "Privacy & Security",
      onClick: () => toast.info("Privacy settings coming soon"),
    },
    {
      icon: Info,
      label: "About",
      onClick: () => toast.info("About page coming soon"),
    },
    {
      icon: HelpCircle,
      label: "Help & Support",
      onClick: () => toast.info("Help center coming soon"),
    },
    {
      icon: LogOut,
      label: "Log Out",
      onClick: handleLogout,
      className: "text-red-600",
    },
  ];

  return (
    <div className="min-h-screen pb-20">
      <header className="bg-white dark:bg-gray-900 p-4 sticky top-0 z-10 shadow-sm">
        <h1 className="text-xl font-semibold">More</h1>
      </header>

      <main className="p-4">
        <div className="space-y-2">
          {menuItems.map((item, index) => (
            <button
              key={index}
              onClick={item.onClick}
              className={`w-full flex items-center gap-3 p-4 bg-white dark:bg-gray-800 rounded-lg shadow-sm ${
                item.className || "text-gray-700 dark:text-gray-200"
              }`}
            >
              <item.icon className="w-5 h-5" />
              <span>{item.label}</span>
            </button>
          ))}
        </div>
      </main>

      <Navigation />
    </div>
  );
};

export default More;

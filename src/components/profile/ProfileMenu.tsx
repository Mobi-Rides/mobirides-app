
import { useNavigate } from "react-router-dom";
import { 
  User, Settings, HelpCircle, Shield, Bell, CalendarClock, 
  LayoutDashboard, LogOut, UserRound, Moon, Sun, UserCog, Bookmark
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { useTheme } from "@/contexts/ThemeContext";
import { Toggle } from "@/components/ui/toggle";
import { supabase } from "@/integrations/supabase/client";

interface ProfileMenuProps {
  fullName: string;
  avatarUrl: string | null;
  setActiveView: (view: 'menu' | 'profile' | 'role') => void;
}

export const ProfileMenu = ({ fullName, avatarUrl, setActiveView }: ProfileMenuProps) => {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();

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
      icon: UserRound,
      label: "Edit Profile",
      onClick: () => setActiveView('profile'),
      color: "text-primary",
    },
    {
      icon: UserCog,
      label: "Change Role",
      onClick: () => setActiveView('role'),
      color: "text-primary",
    },
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
    },
    {
      icon: Settings,
      label: "App Settings",
      onClick: () => toast("App Settings coming soon"),
    },
    {
      icon: Bell,
      label: "Notification Preferences",
      onClick: () => toast("Notification settings coming soon"),
    },
    {
      icon: Shield,
      label: "Privacy & Security",
      onClick: () => toast("Privacy settings coming soon"),
    },
    {
      icon: HelpCircle,
      label: "Help & Support",
      onClick: () => toast("Help center coming soon"),
    },
    {
      icon: LogOut,
      label: "Log Out",
      onClick: handleLogout,
      color: "text-red-600",
    },
  ];

  return (
    <>
      <div className="flex flex-col items-center mb-8">
        <h1 className="text-xl font-semibold mt-2">{fullName || "Your Profile"}</h1>
      </div>

      <Card className="mb-6">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Account</CardTitle>
          <CardDescription>Manage your profile and preferences</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2 pt-0">
          {menuItems.slice(0, 5).map((item, idx) => (
            <button
              key={idx}
              onClick={item.onClick}
              className={`w-full flex items-center justify-between p-3 rounded-lg hover:bg-accent ${item.color || "text-foreground"}`}
            >
              <div className="flex items-center gap-3">
                <item.icon className="h-5 w-5" />
                <span>{item.label}</span>
              </div>
            </button>
          ))}
        </CardContent>
      </Card>

      <Card className="mb-6">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Settings & Preferences</CardTitle>
          <CardDescription>Configure your app experience</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2 pt-0">
          <div className="w-full flex items-center justify-between p-3 rounded-lg">
            <div className="flex items-center gap-3">
              {theme === 'light' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
              <span>Dark Mode</span>
            </div>
            <Toggle 
              pressed={theme === 'dark'} 
              onPressedChange={toggleTheme}
              aria-label="Toggle dark mode"
            >
              {theme === 'dark' ? 'On' : 'Off'}
            </Toggle>
          </div>

          {menuItems.slice(5, 9).map((item, idx) => (
            <button
              key={idx}
              onClick={item.onClick}
              className={`w-full flex items-center justify-between p-3 rounded-lg hover:bg-accent ${item.color || "text-foreground"}`}
            >
              <div className="flex items-center gap-3">
                <item.icon className="h-5 w-5" />
                <span>{item.label}</span>
              </div>
            </button>
          ))}
        </CardContent>
      </Card>

      <button
        onClick={menuItems[9].onClick}
        className={`w-full flex items-center justify-between p-3 my-6 rounded-lg hover:bg-accent ${menuItems[9].color}`}
      >
        <div className="flex items-center gap-3">
          <LogOut className="h-5 w-5" />
          <span>{menuItems[9].label}</span>
        </div>
      </button>
    </>
  );
};

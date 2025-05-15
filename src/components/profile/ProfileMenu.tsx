
import { useNavigate } from "react-router-dom";
import { 
  User, Settings, HelpCircle, Shield, Bell, CalendarClock, 
  LayoutDashboard, LogOut, UserRound, Moon, Sun, Bookmark,
  ArrowRightLeft
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { useTheme } from "@/contexts/ThemeContext";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface ProfileMenuProps {
  fullName: string;
  avatarUrl: string | null;
  setActiveView: (view: 'menu' | 'profile' | 'role') => void;
  role?: string;
}

export const ProfileMenu = ({ fullName, avatarUrl, setActiveView, role = 'renter' }: ProfileMenuProps) => {
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

  const avatarPublicUrl = avatarUrl 
    ? supabase.storage.from('avatars').getPublicUrl(avatarUrl).data.publicUrl 
    : null;

  const menuItems = [
    {
      icon: UserRound,
      label: "Edit Profile",
      onClick: () => setActiveView('profile'),
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

  const switchRoleText = role === 'host' ? 'Switch to Renter' : 'Switch to Host';

  return (
    <>
      {/* Floating Role Switch Button */}
      <div className="fixed bottom-[96px] left-0 right-0 z-50 flex justify-center">
        <Button 
          type="button"
          onClick={() => setActiveView('role')}
          className="shadow-md rounded-full px-6 bg-primary hover:bg-accent/70 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring transition-colors"
          size="lg"
          aria-label={switchRoleText}
        >
          <div className="flex items-center gap-2">
            <ArrowRightLeft className="h-5 w-5" />
            {switchRoleText}
          </div>
        </Button>
      </div>

      <div className="w-full px-4 pb-20">
        <div className="w-full mb-6">
          <h1 className="text-xl sm:text-2xl text-left font-semibold text-foreground">Profile Settings</h1>
        </div>

      <button
        type="button"
        onClick={() => setActiveView('profile')}
        className="w-full flex items-center gap-3 p-3 hover:bg-accent/70 rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-ring mb-6 transition-colors"
        aria-label="View and edit profile"
      >
        <Avatar className="h-10 w-10 bg-[#2B2B2B] text-white">
          <AvatarImage 
            src={avatarPublicUrl || undefined}
            alt="Profile" 
          />
          <AvatarFallback className="text-sm font-medium">
            {fullName?.charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div className="flex flex-col items-start gap-0.5">
          <span className="text-[15px] font-medium">{fullName?.split(' ')[0]}</span>
          <span className="text-[13px] text-muted-foreground">Show profile</span>
        </div>
      </button>

      <Card className="mb-6">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg text-left">Vehicle & Bookings</CardTitle>
          <CardDescription className="text-left">Manage your saved vehicles and booking activities</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2 pt-0">
          {menuItems.slice(1, 4).map((item, idx) => (
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

      <Card className="mb-6">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg text-left">Account Settings</CardTitle>
          <CardDescription className="text-left">Manage your preferences and account security</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2 pt-0">
          <button
            type="button"
            className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-accent/70 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring transition-colors"
            onClick={toggleTheme}
            aria-label={`Toggle dark mode, currently ${theme === 'dark' ? 'on' : 'off'}`}
          >
            <div className="flex items-center gap-3">
              {theme === 'light' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
              <span>Dark Mode</span>
            </div>
            <Switch
              checked={theme === 'dark'}
              onCheckedChange={toggleTheme}
              aria-label="Toggle dark mode"
            />
          </button>

          {menuItems.slice(4, 7).map((item, idx) => (
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

      <Card className="mb-6">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg text-left">Help & Support</CardTitle>
          <CardDescription className="text-left">Get assistance and learn more about MobiRides</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2 pt-0">
          {menuItems.slice(7, 8).map((item, idx) => (
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

      <button
        type="button"
        onClick={menuItems[8].onClick}
        aria-label={menuItems[8].label}
        className={`w-full flex items-center justify-between p-3 rounded-lg hover:bg-accent/70 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring transition-colors ${menuItems[8].color}`}
      >
        <div className="flex items-center gap-3">
          <LogOut className="h-5 w-5" />
          <span>{menuItems[8].label}</span>
        </div>
      </button>
      </div>
    </>
  );
};

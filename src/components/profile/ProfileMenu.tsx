import { useNavigate } from "react-router-dom";
import { 
  User, Settings, HelpCircle, Shield, Bell, CalendarClock, 
  LayoutDashboard, LogOut, UserRound, Moon, Sun, Bookmark,
  ArrowRightLeft, Wallet, Car, Users, BookOpen, MessageSquare, AlertTriangle
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

interface MenuItem {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  onClick: () => void;
  color?: string;
  description?: string;
  animate?: boolean;
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

  const handleSwitchRole = () => {
    setActiveView('role');
  };

  const avatarPublicUrl = avatarUrl 
    ? supabase.storage.from('avatars').getPublicUrl(avatarUrl).data.publicUrl 
    : null;

  const baseMenuItems: MenuItem[] = [
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

  const vehicleAndBookingsItems: MenuItem[] = [...baseMenuItems.slice(1), ...hostOnlyItems, {
    icon: Bell,
    label: "Notifications",
    onClick: () => navigate("/notifications"),
    description: "View your latest notifications",
    animate: true,
  }];

  const settingsItems: MenuItem[] = [
    {
      icon: Settings,
      label: "App Settings",
      onClick: () => toast("App Settings coming soon"),
    },
    {
      icon: Bell,
      label: "Notification Preferences",
      onClick: () => navigate("/notification-preferences"),
    },
    {
      icon: Shield,
      label: "Privacy & Security",
      onClick: () => toast("Privacy settings coming soon"),
    },
  ];

  const helpItems: MenuItem[] = [
    {
      icon: BookOpen,
      label: "Browse Help Center",
      onClick: () => navigate(`/help/${role}`),
      description: "Complete guides and tutorials"
    },
    {
      icon: HelpCircle,
      label: "Quick Start Guide",
      onClick: () => navigate(`/help/${role}/getting-started`),
      description: "Get started in minutes"
    },
    {
      icon: MessageSquare,
      label: "Contact Support",
      onClick: () => toast("Contact support coming soon"),
      description: "Get help from our team"
    },
    {
      icon: AlertTriangle,
      label: "Report Issue",
      onClick: () => toast("Report issue coming soon"),
      description: "Report bugs or problems"
    },
  ];

  const logoutItem: MenuItem = {
    icon: LogOut,
    label: "Log Out",
    onClick: handleLogout,
    color: "text-red-600",
  };

  const switchRoleText = role === 'host' ? 'Switch to Renter' : 'Switch to Host';
  const RoleIcon = role === 'host' ? Car : Users;

  return (
    <>
      {/* Enhanced Floating Role Switch Button */}
      <div className="fixed bottom-[96px] left-0 right-0 z-50 flex justify-center px-4">
        <Button 
          type="button"
          onClick={handleSwitchRole}
          className="shadow-lg rounded-full px-6 py-3 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring transition-all duration-200 bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary/80 transform hover:scale-105"
          size="lg"
          aria-label={switchRoleText}
          title={switchRoleText}
        >
          <div className="flex items-center gap-3">
            <div className="flex items-center space-x-1">
              <RoleIcon className="h-4 w-4" />
              <ArrowRightLeft className="h-4 w-4" />
            </div>
            <span className="font-medium">{switchRoleText}</span>
          </div>
        </Button>
      </div>

      <div className="w-full px-4 pb-20">
        <div className="w-full mb-6">
          <h1 className="text-xl sm:text-2xl text-left font-semibold text-foreground">Profile Settings</h1>
        </div>

        {/* Profile section */}
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

        {/* Vehicle & Bookings section */}
        <Card className="mb-6">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg text-left">Vehicle & Bookings</CardTitle>
            <CardDescription className="text-left">
              Manage your saved vehicles, booking activities{role === 'host' ? ', and wallet' : ''}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 pt-0">
            {vehicleAndBookingsItems.map((item, idx) => (
              <button
                key={idx}
                type="button"
                onClick={item.onClick}
                aria-label={item.label}
                className={`w-full flex items-center justify-between p-3 rounded-lg hover:bg-accent/70 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring transition-colors ${item.color || "text-foreground"} ${item.animate ? "animate-throb" : ""}`}
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

        {/* Account Settings section */}
        <Card className="mb-6">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg text-left">Account Settings</CardTitle>
            <CardDescription className="text-left">Manage your preferences and account security</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 pt-0">
            <div className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-accent/70 transition-colors">
              <div className="flex items-center gap-3">
                {theme === 'light' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
                <span>Dark Mode</span>
              </div>
              <Switch
                checked={theme === 'dark'}
                onCheckedChange={toggleTheme}
                aria-label={`Toggle dark mode, currently ${theme === 'dark' ? 'on' : 'off'}`}
              />
            </div>

            {settingsItems.map((item, idx) => (
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

        {/* Help & Support section */}
        <Card className="mb-6">
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
    </>
  );
};


import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ProfileAvatar } from "@/components/profile/ProfileAvatar";
import { ProfileForm } from "@/components/profile/ProfileForm";
import { RoleSection } from "@/components/profile/RoleSection";
import { OnlineStatusToggle } from "@/components/profile/OnlineStatusToggle";
import { ProfileLoading } from "@/components/profile/ProfileLoading";
import { ProfileError } from "@/components/profile/ProfileError";
import { Navigation } from "@/components/Navigation";
import { useUserLocation } from "@/hooks/useUserLocation";
import { useTheme } from "@/contexts/ThemeContext";
import { 
  User, Settings, HelpCircle, Shield, Bell, CalendarClock, 
  LayoutDashboard, LogOut, UserRound, Bookmark, Moon, Sun, UserCog
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Toggle } from "@/components/ui/toggle";
import { FormSection } from "@/components/add-car/FormSection";

const Profile = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [initialFormValues, setInitialFormValues] = useState({ full_name: "" });
  const [activeView, setActiveView] = useState<'menu' | 'profile' | 'role'>('menu');
  const navigate = useNavigate();
  const { userLocation } = useUserLocation(null);
  const { theme, toggleTheme } = useTheme();

  useEffect(() => {
    const checkUser = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) {
        navigate("/login");
        return;
      }
    };

    const loadProfile = async () => {
      try {
        setLoading(true);
        setError(null);

        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (!session?.user) {
          throw new Error("No authenticated user found");
        }

        console.log("Loading profile data...");
        const { data, error } = await supabase
          .from("profiles")
          .select("avatar_url, full_name")
          .eq("id", session.user.id)
          .single();

        if (error) throw error;

        if (data) {
          console.log("Profile data loaded:", {
            avatarUrl: data.avatar_url,
            fullName: data.full_name,
          });
          setAvatarUrl(data.avatar_url);
          setInitialFormValues({ full_name: data.full_name || "" });
        }
      } catch (error) {
        console.error("Error loading profile:", error);
        setError("Failed to load profile data");
      } finally {
        setLoading(false);
      }
    };

    checkUser();
    loadProfile();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_OUT") {
        navigate("/login");
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [navigate]);

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

  if (loading) return <ProfileLoading />;
  if (error) return <ProfileError error={error} />;

  // Default coordinates if userLocation is not available
  const latitude = userLocation?.latitude || 0;
  const longitude = userLocation?.longitude || 0;

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
    <div className="container mx-auto px-4 py-8 pb-20">
      {activeView === 'menu' ? (
        <>
          <div className="flex flex-col items-center mb-8">
            <div className="mb-4">
              <ProfileAvatar avatarUrl={avatarUrl} setAvatarUrl={setAvatarUrl} />
            </div>
            <h1 className="text-xl font-semibold mt-2">{initialFormValues.full_name || "Your Profile"}</h1>
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
      ) : activeView === 'profile' ? (
        <>
          <Button 
            variant="ghost"
            onClick={() => setActiveView('menu')}
            className="mb-6"
          >
            ← Back to Settings
          </Button>
          
          <ProfileAvatar avatarUrl={avatarUrl} setAvatarUrl={setAvatarUrl} />
          <ProfileForm initialValues={initialFormValues} />
        </>
      ) : (
        <>
          <Button 
            variant="ghost"
            onClick={() => setActiveView('menu')}
            className="mb-6"
          >
            ← Back to Settings
          </Button>
          
          <RoleSection />
          <div className="mt-6">
            <OnlineStatusToggle lat={latitude} long={longitude} />
          </div>
        </>
      )}

      <Navigation />
    </div>
  );
};

export default Profile;

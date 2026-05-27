import { useState } from "react";
import {
  Settings,
  Info,
  HelpCircle,
  Shield,
  Bell,
  LogOut,
  User,
  ChevronRight,
  Wallet,
  Car,
  FileText,
  Heart,
  Lock
} from "lucide-react";
import { Navigation } from "@/components/Navigation";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/utils/toast-utils";
import { useTheme } from "@/contexts/ThemeContext";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const More = () => {
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();
  const [aboutOpen, setAboutOpen] = useState(false);

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

  const menuGroups = [
    {
      title: "Account",
      items: [
        {
          icon: User,
          label: "My Profile",
          description: "Manage your personal information",
          onClick: () => navigate("/profile"),
          color: "text-blue-600",
        },
        {
          icon: Wallet,
          label: "Wallet",
          description: "Balance and transactions",
          onClick: () => navigate("/wallet"),
          color: "text-green-600",
        },
        {
          icon: Car,
          label: "My Cars",
          description: "Manage your vehicles",
          onClick: () => navigate("/car-listing"),
          color: "text-purple-600",
        },
        {
          icon: FileText,
          label: "Insurance Claims",
          description: "View and manage your claims",
          onClick: () => navigate("/claims"),
          color: "text-orange-600",
        },
        {
          icon: Shield,
          label: "Insurance Policies",
          description: "View your policy documents",
          onClick: () => navigate("/insurance/policies"),
          color: "text-indigo-600",
        },
      ]
    },
    {
      title: "Settings & Preferences",
      items: [
        {
          icon: Bell,
          label: "Notifications",
          description: "Manage alerts and messages",
          onClick: () => navigate("/notification-preferences"),
          color: "text-orange-500",
        },
        {
          icon: Shield,
          label: "Security",
          description: "Password and authentication",
          onClick: () => navigate("/settings/security"),
          color: "text-slate-600",
        },
        {
          icon: Settings,
          label: "App Settings",
          description: "General preferences",
          onClick: () => navigate("/settings/display"),
          color: "text-gray-600",
        },
      ]
    },
    {
      title: "Support",
      items: [
        {
          icon: HelpCircle,
          label: "Help Center",
          description: "FAQs and support",
          onClick: () => navigate("/help/renter"),
          color: "text-teal-600",
        },
        {
          icon: Info,
          label: "About Mobirides",
          description: "Version 1.0.0",
          onClick: () => setAboutOpen(true),
          color: "text-indigo-600",
        },
      ]
    },
    {
      title: "Legal & Policies",
      items: [
        {
          icon: FileText,
          label: "Terms of Service",
          description: "General platform terms",
          onClick: () => navigate("/terms-of-service"),
          color: "text-blue-600",
        },
        {
          icon: User,
          label: "Renter Terms",
          description: "Terms for renting a vehicle",
          onClick: () => navigate("/terms/renter"),
          color: "text-blue-500",
        },
        {
          icon: Car,
          label: "Host Terms",
          description: "Terms for vehicle owners",
          onClick: () => navigate("/terms/host"),
          color: "text-orange-600",
        },
        {
          icon: Lock,
          label: "Privacy Policy",
          description: "How we protect your data",
          onClick: () => navigate("/privacy-policy"),
          color: "text-purple-600",
        },
        {
          icon: Shield,
          label: "Insurance Terms",
          description: "Protection and coverage details",
          onClick: () => navigate("/terms/insurance"),
          color: "text-green-600",
        },
        {
          icon: Heart,
          label: "Community Guidelines",
          description: "Our standards for the community",
          onClick: () => navigate("/community-guidelines"),
          color: "text-red-500",
        },
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50/50 dark:bg-gray-900 pb-24">
      <header className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-md p-4 sticky top-0 z-10 border-b border-gray-100 dark:border-gray-800">
        <h1 className="text-xl font-bold text-gray-900 dark:text-white">More</h1>
      </header>

      <main className="p-4 space-y-6 max-w-md mx-auto">
        {/* Dark Mode Toggle */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-sm border border-gray-100 dark:border-gray-700 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded-full">
              {theme === 'dark' ? (
                <span className="text-lg">🌙</span>
              ) : (
                <span className="text-lg">☀️</span>
              )}
            </div>
            <div>
              <Label htmlFor="dark-mode" className="font-medium text-base">Dark Mode</Label>
              <p className="text-xs text-gray-500 dark:text-gray-400">Adjust app appearance</p>
            </div>
          </div>
          <Switch
            id="dark-mode"
            checked={theme === 'dark'}
            onCheckedChange={(checked) => setTheme(checked ? 'dark' : 'light')}
          />
        </div>

        {menuGroups.map((group, groupIndex) => (
          <div key={groupIndex} className="space-y-3">
            <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 px-1 uppercase tracking-wider">
              {group.title}
            </h2>
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden divide-y divide-gray-100 dark:divide-gray-700">
              {group.items.map((item, index) => (
                <button
                  key={index}
                  onClick={item.onClick}
                  className="w-full flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors active:bg-gray-100 dark:active:bg-gray-700"
                >
                  <div className="flex items-center gap-4">
                    <div className={`p-2 rounded-xl bg-opacity-10 ${item.color.replace('text-', 'bg-')} dark:bg-opacity-20`}>
                      <item.icon className={`w-5 h-5 ${item.color}`} />
                    </div>
                    <div className="text-left">
                      <p className="font-medium text-gray-900 dark:text-white">{item.label}</p>
                      {item.description && (
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{item.description}</p>
                      )}
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-300 dark:text-gray-600" />
                </button>
              ))}
            </div>
          </div>
        ))}

        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 p-4 bg-red-50 dark:bg-red-900/10 rounded-2xl text-red-600 dark:text-red-400 font-medium hover:bg-red-100 dark:hover:bg-red-900/20 transition-colors mt-8 border border-red-100 dark:border-red-900/20"
        >
          <LogOut className="w-5 h-5" />
          <span>Log Out</span>
        </button>

        <div className="text-center pt-8 pb-4">
          <p className="text-xs text-gray-400 dark:text-gray-600 font-medium">Mobirides v1.0.0 (Build 2025.12)</p>
          <p className="text-[10px] text-gray-300 dark:text-gray-700 mt-1">© 2025 Mobirides Inc.</p>
        </div>
      </main>

      <Dialog open={aboutOpen} onOpenChange={setAboutOpen}>
        <DialogContent className="max-w-md bg-white dark:bg-gray-800 rounded-2xl p-6 border-none shadow-xl">
          <DialogHeader className="text-center">
            <div className="mx-auto w-12 h-12 bg-indigo-50 dark:bg-indigo-900/30 rounded-2xl flex items-center justify-center mb-3">
              <Info className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
            </div>
            <DialogTitle className="text-xl font-bold text-gray-900 dark:text-white">About Mobirides</DialogTitle>
            <DialogDescription className="text-xs text-gray-400 dark:text-gray-500 mt-1">
              Version 1.0.0 (Build 2025.12)
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-5 mt-2">
            <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed text-center">
              Mobirides is Botswana's premier peer-to-peer car sharing community, connecting trusted vehicle hosts with renters to provide reliable, convenient, and secure transportation options across Gaborone and beyond.
            </p>

            <div className="border-t border-gray-100 dark:border-gray-700 pt-4 space-y-3">
              <h3 className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2 text-center sm:text-left">
                Official Support & Policy Contacts
              </h3>

              <div className="grid gap-2.5">
                {[
                  {
                    icon: Info,
                    label: "General & Legal Support",
                    email: "compliance@mobirides.africa",
                    color: "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/10",
                  },
                  {
                    icon: Lock,
                    label: "Privacy & Data Protection",
                    email: "compliance@mobirides.africa",
                    color: "text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/10",
                  },
                  {
                    icon: Shield,
                    label: "Insurance & Claims",
                    email: "compliance@mobirides.africa",
                    color: "text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/10",
                  },
                  {
                    icon: Heart,
                    label: "Community Guidelines",
                    email: "hello@mobirides.africa",
                    color: "text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/10",
                  },
                ].map((item, index) => (
                  <a
                    key={index}
                    href={`mailto:${item.email}`}
                    className="flex items-center gap-3 p-3 bg-gray-50/50 dark:bg-gray-900/30 rounded-xl hover:bg-gray-100/50 dark:hover:bg-gray-900/50 transition-colors border border-gray-100/30 dark:border-gray-800"
                  >
                    <div className={`p-2 rounded-lg ${item.color}`}>
                      <item.icon className="w-4 h-4" />
                    </div>
                    <div className="text-left flex-1 min-w-0">
                      <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">{item.label}</p>
                      <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{item.email}</p>
                    </div>
                  </a>
                ))}
              </div>
            </div>

            <div className="text-center text-[10px] text-gray-400 dark:text-gray-600 font-medium pt-2">
              © 2025 Mobirides Inc. All rights reserved.
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Navigation />
    </div>
  );
};


export default More;

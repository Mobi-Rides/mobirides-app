
import { Settings, Bell, Shield, Moon, Sun } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { useTheme } from "@/contexts/ThemeContext";
import { toast } from "sonner";

interface MenuItem {
  icon: any;
  label: string;
  onClick: () => void;
  color?: string;
}

export const ProfileAccountTab = () => {
  const { theme, toggleTheme } = useTheme();

  const settingsItems: MenuItem[] = [
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
  ];

  return (
    <Card>
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
  );
};

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { MessageSquare, Mail, Bell, Smartphone } from "lucide-react";

interface NotificationPreferences {
  whatsappNotifications: boolean;
  emailNotifications: boolean;
  marketingEmails: boolean;
}

export function NotificationPreferences() {
  const [preferences, setPreferences] = useState<NotificationPreferences>({
    whatsappNotifications: true,
    emailNotifications: true,
    marketingEmails: false,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadPreferences();
  }, []);

  const loadPreferences = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("profiles")
        .select("whatsapp_notifications, email_notifications, marketing_emails")
        .eq("id", user.id)
        .single();

      if (error) throw error;

      if (data) {
        setPreferences({
          whatsappNotifications: data.whatsapp_notifications ?? true,
          emailNotifications: data.email_notifications ?? true,
          marketingEmails: data.marketing_emails ?? false,
        });
      }
    } catch (error) {
      console.error("Error loading notification preferences:", error);
      toast({
        title: "Error",
        description: "Failed to load notification preferences",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const savePreferences = async () => {
    setIsSaving(true);
    try {
      const { error } = await supabase.rpc("update_notification_preferences", {
        p_whatsapp_enabled: preferences.whatsappNotifications,
        p_email_enabled: preferences.emailNotifications,
        p_marketing_enabled: preferences.marketingEmails,
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Notification preferences updated successfully",
      });
    } catch (error) {
      console.error("Error saving notification preferences:", error);
      toast({
        title: "Error",
        description: "Failed to save notification preferences",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const updatePreference = (key: keyof NotificationPreferences, value: boolean) => {
    setPreferences(prev => ({ ...prev, [key]: value }));
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Notification Preferences
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="animate-pulse space-y-4">
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              <div className="h-4 bg-gray-200 rounded w-2/3"></div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="h-5 w-5" />
          Notification Preferences
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Choose how you want to receive notifications about your bookings and account updates.
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* WhatsApp Notifications */}
        <div className="flex items-center justify-between space-x-2">
          <div className="flex items-center space-x-3">
            <MessageSquare className="h-5 w-5 text-green-600" />
            <div className="space-y-0.5">
              <Label className="text-base font-medium">WhatsApp Notifications</Label>
              <div className="text-sm text-muted-foreground">
                Receive instant booking updates, pickup reminders, and important alerts via WhatsApp
              </div>
            </div>
          </div>
          <Switch
            checked={preferences.whatsappNotifications}
            onCheckedChange={(checked) => updatePreference("whatsappNotifications", checked)}
          />
        </div>

        {/* Email Notifications */}
        <div className="flex items-center justify-between space-x-2">
          <div className="flex items-center space-x-3">
            <Mail className="h-5 w-5 text-blue-600" />
            <div className="space-y-0.5">
              <Label className="text-base font-medium">Email Notifications</Label>
              <div className="text-sm text-muted-foreground">
                Receive detailed booking confirmations, receipts, and account notifications via email
              </div>
            </div>
          </div>
          <Switch
            checked={preferences.emailNotifications}
            onCheckedChange={(checked) => updatePreference("emailNotifications", checked)}
          />
        </div>

        {/* Marketing Emails */}
        <div className="flex items-center justify-between space-x-2">
          <div className="flex items-center space-x-3">
            <Smartphone className="h-5 w-5 text-purple-600" />
            <div className="space-y-0.5">
              <Label className="text-base font-medium">Marketing Communications</Label>
              <div className="text-sm text-muted-foreground">
                Receive promotional offers, platform updates, and special deals via email
              </div>
            </div>
          </div>
          <Switch
            checked={preferences.marketingEmails}
            onCheckedChange={(checked) => updatePreference("marketingEmails", checked)}
          />
        </div>

        {/* Information Box */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start space-x-2">
            <Bell className="h-5 w-5 text-blue-600 mt-0.5" />
            <div className="text-sm text-blue-800">
              <p className="font-medium mb-1">Important Note:</p>
              <p>
                Critical safety and security notifications will always be sent regardless of your preferences. 
                This includes booking confirmations, cancellations, and emergency communications.
              </p>
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end pt-4">
          <Button 
            onClick={savePreferences} 
            disabled={isSaving}
            className="min-w-[120px]"
          >
            {isSaving ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

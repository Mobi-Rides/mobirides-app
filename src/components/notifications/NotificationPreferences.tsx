import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";

interface NotificationPreferences {
  email_notifications: boolean;
  push_notifications: boolean;
  sms_notifications: boolean;
  booking_notifications: boolean;
  payment_notifications: boolean;
  marketing_notifications: boolean;
  notification_frequency: 'instant' | 'hourly' | 'daily';
  quiet_hours_start: string;
  quiet_hours_end: string;
}

export default function NotificationPreferences() {
  const { user } = useAuth();
  const [preferences, setPreferences] = useState<NotificationPreferences>({
    email_notifications: true,
    push_notifications: true,
    sms_notifications: false,
    booking_notifications: true,
    payment_notifications: true,
    marketing_notifications: false,
    notification_frequency: 'instant',
    quiet_hours_start: '22:00',
    quiet_hours_end: '08:00'
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const loadPreferences = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('notification_preferences')
        .select('*')
        .eq('user_id', user?.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (data) {
        setPreferences({
          email_notifications: data.email_notifications,
          push_notifications: data.push_notifications,
          sms_notifications: data.sms_notifications,
          booking_notifications: data.booking_notifications,
          payment_notifications: data.payment_notifications,
          marketing_notifications: data.marketing_notifications,
          notification_frequency: (data.notification_frequency as 'instant' | 'hourly' | 'daily') || 'instant',
          quiet_hours_start: data.quiet_hours_start?.slice(0, 5) || '22:00',
          quiet_hours_end: data.quiet_hours_end?.slice(0, 5) || '08:00'
        });
      }
    } catch (error) {
      console.error('Error loading preferences:', error);
      toast.error('Failed to load notification preferences');
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    if (user?.id) {
      loadPreferences();
    }
  }, [user?.id, loadPreferences]);

  const savePreferences = async () => {
    if (!user?.id) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from('notification_preferences')
        .upsert({
          user_id: user.id,
          ...preferences,
          quiet_hours_start: preferences.quiet_hours_start + ':00',
          quiet_hours_end: preferences.quiet_hours_end + ':00'
        }, {
          onConflict: 'user_id'
        });

      if (error) throw error;

      toast.success('Notification preferences saved');
    } catch (error) {
      console.error('Error saving preferences:', error);
      toast.error('Failed to save notification preferences');
    } finally {
      setSaving(false);
    }
  };

  const updatePreference = (key: keyof NotificationPreferences, value: boolean | 'instant' | 'hourly' | 'daily' | string) => {
    setPreferences(prev => ({ ...prev, [key]: value }));
  };

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="space-y-3">
            <div className="h-20 bg-gray-200 rounded"></div>
            <div className="h-20 bg-gray-200 rounded"></div>
            <div className="h-20 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Notification Preferences</h1>
        <p className="text-muted-foreground">Customize how and when you receive notifications</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Delivery Methods</CardTitle>
          <CardDescription>Choose how you'd like to receive notifications</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="email">Email Notifications</Label>
            <Switch
              id="email"
              checked={preferences.email_notifications}
              onCheckedChange={(checked) => updatePreference('email_notifications', checked)}
            />
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="push">Push Notifications</Label>
            <Switch
              id="push"
              checked={preferences.push_notifications}
              onCheckedChange={(checked) => updatePreference('push_notifications', checked)}
            />
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="sms">SMS Notifications</Label>
            <Switch
              id="sms"
              checked={preferences.sms_notifications}
              onCheckedChange={(checked) => updatePreference('sms_notifications', checked)}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Notification Types</CardTitle>
          <CardDescription>Select which types of notifications you want to receive</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="bookings">Booking Updates</Label>
            <Switch
              id="bookings"
              checked={preferences.booking_notifications}
              onCheckedChange={(checked) => updatePreference('booking_notifications', checked)}
            />
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="payments">Payment & Wallet Updates</Label>
            <Switch
              id="payments"
              checked={preferences.payment_notifications}
              onCheckedChange={(checked) => updatePreference('payment_notifications', checked)}
            />
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="marketing">Marketing & Promotions</Label>
            <Switch
              id="marketing"
              checked={preferences.marketing_notifications}
              onCheckedChange={(checked) => updatePreference('marketing_notifications', checked)}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Timing & Frequency</CardTitle>
          <CardDescription>Control when and how often you receive notifications</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="frequency">Notification Frequency</Label>
            <Select
              value={preferences.notification_frequency}
              onValueChange={(value: 'instant' | 'hourly' | 'daily') => 
                updatePreference('notification_frequency', value)
              }
            >
              <SelectTrigger className="mt-2">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="instant">Instant</SelectItem>
                <SelectItem value="hourly">Hourly Digest</SelectItem>
                <SelectItem value="daily">Daily Digest</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="quiet-start">Quiet Hours Start</Label>
              <input
                id="quiet-start"
                type="time"
                value={preferences.quiet_hours_start}
                onChange={(e) => updatePreference('quiet_hours_start', e.target.value)}
                className="mt-2 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <Label htmlFor="quiet-end">Quiet Hours End</Label>
              <input
                id="quiet-end"
                type="time"
                value={preferences.quiet_hours_end}
                onChange={(e) => updatePreference('quiet_hours_end', e.target.value)}
                className="mt-2 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Button onClick={savePreferences} disabled={saving} className="w-full">
        {saving ? 'Saving...' : 'Save Preferences'}
      </Button>
    </div>
  );
}
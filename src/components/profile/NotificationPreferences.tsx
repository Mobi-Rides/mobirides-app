import React, { useState, useEffect } from 'react';
import { Bell, Info, ArrowLeft } from 'lucide-react';
import { SettingsSidebar } from '@/components/settings/SettingsSidebar';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// Car rental-specific notification groups and notifications
const notificationGroups = [
  {
    key: 'booking',
    label: 'Booking & Reservation',
    notifications: [
      { key: 'booking_confirmation', title: 'Booking Confirmation', description: 'Your car rental booking is confirmed.' },
      { key: 'booking_reminder', title: 'Booking Reminder', description: 'Reminder for your upcoming car rental.' },
      { key: 'booking_modification', title: 'Booking Modification', description: 'Your booking has been updated/changed.' },
      { key: 'booking_cancellation', title: 'Booking Cancellation', description: 'Your booking has been cancelled.' },
      { key: 'booking_expiry', title: 'Booking Expiry', description: 'Your reservation is about to expire.' },
    ],
  },
  {
    key: 'pickup',
    label: 'Pickup & Drop-off',
    notifications: [
      { key: 'pickup_reminder', title: 'Pickup Reminder', description: 'It’s time to pick up your rental car.' },
      { key: 'dropoff_reminder', title: 'Drop-off Reminder', description: 'Reminder to return your rental car.' },
      { key: 'late_return_alert', title: 'Late Return Alert', description: 'Your car is overdue for return.' },
    ],
  },
  {
    key: 'payment',
    label: 'Payment & Billing',
    notifications: [
      { key: 'payment_confirmation', title: 'Payment Confirmation', description: 'Your payment was successful.' },
      { key: 'payment_failure', title: 'Payment Failure', description: 'There was an issue with your payment.' },
      { key: 'invoice_receipt', title: 'Invoice/Receipt', description: 'Your rental invoice/receipt is ready.' },
      { key: 'refund_processed', title: 'Refund Processed', description: 'Your refund has been processed.' },
    ],
  },
  {
    key: 'vehicle',
    label: 'Vehicle Status & Safety',
    notifications: [
      { key: 'vehicle_ready', title: 'Vehicle Ready', description: 'Your car is ready for pickup.' },
      { key: 'vehicle_location_update', title: 'Vehicle Location Update', description: 'Your car’s location has changed.' },
      { key: 'maintenance_alert', title: 'Maintenance Alert', description: 'The car you booked requires maintenance; please select another.' },
      { key: 'damage_report', title: 'Damage Report', description: 'Damage has been reported on your rental car.' },
    ],
  },
  {
    key: 'promotions',
    label: 'Promotions & Offers',
    notifications: [
      { key: 'special_offers', title: 'Special Offers', description: 'Get 10% off your next rental.' },
      { key: 'loyalty_rewards', title: 'Loyalty Rewards', description: 'You’ve earned a free rental day!' },
      { key: 'seasonal_promotions', title: 'Seasonal Promotions', description: 'Holiday/weekend deals.' },
    ],
  },
  {
    key: 'account',
    label: 'Account & Support',
    notifications: [
      { key: 'profile_update', title: 'Profile Update', description: 'Your account details have been updated.' },
      { key: 'document_expiry', title: 'Document Expiry', description: 'Your driver’s license or ID is expiring soon.' },
      { key: 'support_ticket_update', title: 'Support Ticket Update', description: 'Your support request has been updated/resolved.' },
      { key: 'feedback_request', title: 'Feedback Request', description: 'Please rate your recent rental experience.' },
    ],
  },
  {
    key: 'security',
    label: 'Security & Compliance',
    notifications: [
      { key: 'suspicious_activity', title: 'Suspicious Activity', description: 'Unusual activity detected on your account.' },
      { key: 'policy_update', title: 'Policy Update', description: 'Changes to rental terms or privacy policy.' },
    ],
  },
];

const channels = [
  { key: 'email', label: 'Email' },
  { key: 'sms', label: 'SMS' },
  { key: 'push', label: 'Push' },
  { key: 'inApp', label: 'In-App' },
];

// Default preferences: all enabled
const defaultPrefs = {};
notificationGroups.forEach(group => {
  group.notifications.forEach(notif => {
    defaultPrefs[notif.key] = {
      email: true,
      sms: false,
      push: true,
      inApp: true,
    };
  });
});

const NotificationPreferences = () => {
  const [prefs, setPrefs] = useState(defaultPrefs);
  const [saved, setSaved] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const navigate = useNavigate();

  // Load persisted preferences on mount
  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase
        .from('notification_preferences')
        .select('*')
        .eq('user_id', user.id)
        .single();
      if (!data) return;
      // Map coarse DB columns back onto fine-grained UI prefs
      setPrefs(prev => {
        const next = { ...prev };
        Object.keys(next).forEach(key => {
          const group = notificationGroups.find(g => g.notifications.some(n => n.key === key))?.key;
          next[key] = {
            email: group === 'promotions' ? data.marketing_notifications : data.email_notifications,
            sms: data.sms_notifications,
            push: group === 'booking' || group === 'payment' ? data.booking_notifications && data.push_notifications : data.push_notifications,
            inApp: true,
          };
        });
        return next;
      });
    };
    load();
  }, []);

  const handleToggle = (notifKey, channel) => {
    setPrefs(prev => ({
      ...prev,
      [notifKey]: { ...prev[notifKey], [channel]: !prev[notifKey][channel] },
    }));
  };

  const handleReset = () => {
    setPrefs(defaultPrefs);
    setSaved(false);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Derive coarse-grained DB columns from fine-grained UI state
      const anyEmail = Object.values(prefs).some((p: any) => p.email);
      const anyPush = Object.values(prefs).some((p: any) => p.push);
      const anySms = Object.values(prefs).some((p: any) => p.sms);
      const bookingOn = notificationGroups
        .find(g => g.key === 'booking')!.notifications
        .some(n => prefs[n.key]?.push);
      const paymentOn = notificationGroups
        .find(g => g.key === 'payment')!.notifications
        .some(n => prefs[n.key]?.email);
      const marketingOn = notificationGroups
        .find(g => g.key === 'promotions')!.notifications
        .some(n => prefs[n.key]?.email);

      const { error } = await supabase
        .from('notification_preferences')
        .upsert({
          user_id: user.id,
          email_notifications: anyEmail,
          push_notifications: anyPush,
          sms_notifications: anySms,
          booking_notifications: bookingOn,
          payment_notifications: paymentOn,
          marketing_notifications: marketingOn,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'user_id' });

      if (error) throw error;
      setSaved(true);
      toast.success('Preferences saved');
      setTimeout(() => setSaved(false), 2000);
    } catch (err: any) {
      toast.error(err.message || 'Failed to save preferences');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex flex-col md:flex-row gap-8 p-4 max-w-5xl mx-auto">
      <SettingsSidebar activeItem="notifications" />
      {/* Main content */}
      <main className="flex-1">
        <div className="flex items-center gap-3 mb-6">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/profile')}
            className="md:hidden"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Bell className="w-5 h-5" /> Notification Preferences
          </h2>
        </div>
        {notificationGroups.map(group => (
          <div key={group.key} className="mb-8">
            <h3 className="font-semibold mb-2 text-lg">{group.label}</h3>
            <div className="bg-white dark:bg-gray-900 rounded-lg shadow border divide-y">
              <div className="flex font-semibold text-xs text-gray-500 px-4 py-2">
                <div className="flex-1">Notification</div>
                {channels.map(ch => (
                  <div key={ch.key} className="w-20 text-center">{ch.label}</div>
                ))}
              </div>
              {group.notifications.map(notif => (
                <div key={notif.key} className="flex items-center px-4 py-3">
                  <div className="flex-1">
                    <div className="font-medium text-sm">{notif.title}</div>
                    <div className="text-xs text-gray-500 mt-0.5">{notif.description}</div>
                  </div>
                  {channels.map(ch => (
                    <div key={ch.key} className="w-20 flex justify-center">
                      <input
                        type="checkbox"
                        checked={prefs[notif.key][ch.key]}
                        onChange={() => handleToggle(notif.key, ch.key)}
                        aria-label={`${notif.title} via ${ch.label}`}
                        className="accent-blue-600 h-5 w-5"
                      />
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        ))}
        {/* Sticky action bar */}
        <div className="sticky bottom-0 bg-white dark:bg-gray-900 p-3 border-t flex gap-2 justify-end z-10 mt-8">
          <button onClick={handleReset} className="btn btn-secondary">Reset</button>
          <button onClick={handleSave} disabled={isSaving} className="btn btn-primary">
            {isSaving ? 'Saving...' : 'Save Changes'}
          </button>
          {saved && <span className="text-green-600 text-xs ml-2">Preferences saved!</span>}
        </div>
      </main>
    </div>
  );
};
export default NotificationPreferences; 
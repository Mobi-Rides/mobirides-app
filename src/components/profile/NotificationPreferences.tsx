import React, { useState } from 'react';
import { Bell, Info } from 'lucide-react';

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
  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="flex flex-col md:flex-row gap-8 p-4 max-w-5xl mx-auto">
      {/* Sidebar (static for demo) */}
      <aside className="hidden md:block w-56 flex-shrink-0">
        <div className="bg-white dark:bg-gray-900 rounded-lg shadow border p-4">
          <h3 className="font-semibold mb-4">Settings</h3>
          <ul className="space-y-2 text-sm">
            <li className="text-gray-700 dark:text-gray-200">Profile</li>
            <li className="text-gray-700 dark:text-gray-200">Display</li>
            <li className="bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-200 rounded px-2 py-1 font-semibold">Notifications</li>
            <li className="text-gray-700 dark:text-gray-200">Security</li>
          </ul>
        </div>
      </aside>
      {/* Main content */}
      <main className="flex-1">
        <h2 className="text-xl font-bold mb-6 flex items-center gap-2"><Bell className="w-5 h-5" /> Notification Preferences</h2>
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
          <button onClick={handleSave} className="btn btn-primary">Save Changes</button>
          {saved && <span className="text-green-600 text-xs ml-2">Preferences saved!</span>}
        </div>
        {/* Info banner */}
        <div className="bg-blue-50 dark:bg-blue-900 border border-blue-200 dark:border-blue-700 rounded-md p-3 flex items-start gap-2 mt-6 text-xs text-blue-900 dark:text-blue-100">
          <Info className="w-4 h-4 mt-0.5 text-blue-500 dark:text-blue-300" />
          <div>
            <div>Preferences are stored locally for demo purposes. In production, sync with your backend.</div>
          </div>
        </div>
      </main>
    </div>
  );
};
export default NotificationPreferences; 
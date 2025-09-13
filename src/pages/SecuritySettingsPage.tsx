import React, { useState } from 'react';
import { Shield, Key, Smartphone, ArrowLeft } from 'lucide-react';
import { SettingsSidebar } from '@/components/settings/SettingsSidebar';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';

const SecuritySettingsPage = () => {
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [emailAlerts, setEmailAlerts] = useState(true);
  const navigate = useNavigate();

  return (
    <div className="flex flex-col md:flex-row gap-8 p-4 max-w-5xl mx-auto">
      <SettingsSidebar activeItem="security" />
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
            <Shield className="w-5 h-5" /> Security Settings
          </h2>
        </div>
        
        <div className="space-y-6">
          {/* Password Section */}
          <div className="bg-white dark:bg-gray-900 rounded-lg shadow border p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Key className="w-4 h-4" /> Password
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Current Password</label>
                <input 
                  type="password" 
                  className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" 
                  placeholder="Enter current password"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">New Password</label>
                <input 
                  type="password" 
                  className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" 
                  placeholder="Enter new password"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Confirm New Password</label>
                <input 
                  type="password" 
                  className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" 
                  placeholder="Confirm new password"
                />
              </div>
              <button className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
                Update Password
              </button>
            </div>
          </div>

          {/* Two-Factor Authentication */}
          <div className="bg-white dark:bg-gray-900 rounded-lg shadow border p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Smartphone className="w-4 h-4" /> Two-Factor Authentication
            </h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Enable 2FA</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Add an extra layer of security to your account
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={twoFactorEnabled}
                    onChange={(e) => setTwoFactorEnabled(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                </label>
              </div>
              {twoFactorEnabled && (
                <div className="bg-blue-50 dark:bg-blue-900 p-4 rounded-md">
                  <p className="text-sm text-blue-800 dark:text-blue-200">
                    Two-factor authentication is enabled. You'll need to verify your identity with a second factor when signing in.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Security Alerts */}
          <div className="bg-white dark:bg-gray-900 rounded-lg shadow border p-6">
            <h3 className="text-lg font-semibold mb-4">Security Alerts</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Email security alerts</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Get notified about suspicious account activity
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={emailAlerts}
                    onChange={(e) => setEmailAlerts(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                </label>
              </div>
            </div>
          </div>

          {/* Account Deletion */}
          <div className="bg-white dark:bg-gray-900 rounded-lg shadow border p-6">
            <h3 className="text-lg font-semibold mb-4 text-red-600">Danger Zone</h3>
            <div className="space-y-4">
              <div>
                <p className="font-medium text-red-600">Delete Account</p>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  Permanently delete your account and all associated data. This action cannot be undone.
                </p>
                <button className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700">
                  Delete Account
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default SecuritySettingsPage;
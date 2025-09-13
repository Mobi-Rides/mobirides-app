import React from 'react';
import { User } from 'lucide-react';
import { SettingsSidebar } from '@/components/settings/SettingsSidebar';

const ProfileSettingsPage = () => {
  return (
    <div className="flex flex-col md:flex-row gap-8 p-4 max-w-5xl mx-auto">
      <SettingsSidebar activeItem="profile" />
      <main className="flex-1">
        <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
          <User className="w-5 h-5" /> Profile Settings
        </h2>
        <div className="bg-white dark:bg-gray-900 rounded-lg shadow border p-6">
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium mb-2">Display Name</label>
              <input 
                type="text" 
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" 
                placeholder="Enter your display name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Bio</label>
              <textarea 
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" 
                rows={4}
                placeholder="Tell us about yourself"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Phone Number</label>
              <input 
                type="tel" 
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" 
                placeholder="Enter your phone number"
              />
            </div>
            <div className="flex gap-2">
              <button className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
                Save Changes
              </button>
              <button className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50">
                Cancel
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default ProfileSettingsPage;
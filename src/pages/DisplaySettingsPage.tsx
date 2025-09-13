import React, { useState } from 'react';
import { Monitor, ArrowLeft } from 'lucide-react';
import { SettingsSidebar } from '@/components/settings/SettingsSidebar';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';

const DisplaySettingsPage = () => {
  const [theme, setTheme] = useState('system');
  const [language, setLanguage] = useState('en');
  const [dateFormat, setDateFormat] = useState('MM/DD/YYYY');
  const navigate = useNavigate();

  return (
    <div className="flex flex-col md:flex-row gap-8 p-4 max-w-5xl mx-auto">
      <SettingsSidebar activeItem="display" />
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
            <Monitor className="w-5 h-5" /> Display Settings
          </h2>
        </div>
        <div className="bg-white dark:bg-gray-900 rounded-lg shadow border p-6">
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium mb-2">Theme</label>
              <select 
                value={theme} 
                onChange={(e) => setTheme(e.target.value)}
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="light">Light</option>
                <option value="dark">Dark</option>
                <option value="system">System</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Language</label>
              <select 
                value={language} 
                onChange={(e) => setLanguage(e.target.value)}
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="en">English</option>
                <option value="es">Spanish</option>
                <option value="fr">French</option>
                <option value="de">German</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Date Format</label>
              <select 
                value={dateFormat} 
                onChange={(e) => setDateFormat(e.target.value)}
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                <option value="YYYY-MM-DD">YYYY-MM-DD</option>
              </select>
            </div>
            <div>
              <label className="flex items-center gap-2">
                <input type="checkbox" className="accent-blue-600" />
                <span className="text-sm">Show animations</span>
              </label>
            </div>
            <div>
              <label className="flex items-center gap-2">
                <input type="checkbox" className="accent-blue-600" defaultChecked />
                <span className="text-sm">High contrast mode</span>
              </label>
            </div>
            <div className="flex gap-2">
              <button className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
                Save Changes
              </button>
              <button className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50">
                Reset to Default
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default DisplaySettingsPage;
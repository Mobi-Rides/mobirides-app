import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { User, Monitor, Bell, Shield, ShieldCheck, Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { useIsMobile } from '@/hooks/use-mobile';

interface SettingsSidebarProps {
  activeItem?: string;
}

const settingsItems = [
  { key: 'profile', label: 'Profile', path: '/settings/profile', icon: User },
  { key: 'verification', label: 'Verification', path: '/settings/verification', icon: ShieldCheck },
  { key: 'display', label: 'Display', path: '/settings/display', icon: Monitor },
  { key: 'notifications', label: 'Notifications', path: '/notification-preferences', icon: Bell },
  { key: 'security', label: 'Security', path: '/settings/security', icon: Shield },
];

export const SettingsSidebar: React.FC<SettingsSidebarProps> = ({ activeItem }) => {
  const location = useLocation();
  const isMobile = useIsMobile();
  
  const getActiveItem = () => {
    if (activeItem) return activeItem;
    
    // Determine active item from current path
    if (location.pathname === '/notification-preferences') return 'notifications';
    if (location.pathname.includes('/settings/profile')) return 'profile';
    if (location.pathname.includes('/settings/verification')) return 'verification';
    if (location.pathname.includes('/settings/display')) return 'display';
    if (location.pathname.includes('/settings/security')) return 'security';
    
    return '';
  };

  const currentActive = getActiveItem();

  const SidebarContent = () => (
    <div className="bg-white dark:bg-gray-900 rounded-lg shadow border p-4">
      <h3 className="font-semibold mb-4">Settings</h3>
      <ul className="space-y-2 text-sm">
        {settingsItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentActive === item.key;
          
          return (
            <li key={item.key}>
              <Link
                to={item.path}
                className={`flex items-center gap-2 px-2 py-1 rounded transition-colors ${
                  isActive
                    ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-200 font-semibold'
                    : 'text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800'
                }`}
              >
                <Icon className="w-4 h-4" />
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );

  if (isMobile) {
    return (
      <div className="md:hidden mb-4">
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="outline" size="icon">
              <Menu className="w-4 h-4" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left">
            <SheetHeader>
              <SheetTitle>Settings</SheetTitle>
            </SheetHeader>
            <div className="mt-4">
              <ul className="space-y-2 text-sm">
                {settingsItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = currentActive === item.key;
                  
                  return (
                    <li key={item.key}>
                      <Link
                        to={item.path}
                        className={`flex items-center gap-2 px-2 py-1 rounded transition-colors ${
                          isActive
                            ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-200 font-semibold'
                            : 'text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800'
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                        {item.label}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    );
  }

  return (
    <aside className="hidden md:block w-56 flex-shrink-0">
      <SidebarContent />
    </aside>
  );
};
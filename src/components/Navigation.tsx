import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { Home, MapPin, Bookmark, CalendarClock, Bell } from "lucide-react";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "./ThemeToggle";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "./ui/badge";

interface NavigationItem {
  path: string;
  label: string;
  icon: React.ReactNode;
  activeIndex: number;
  badge?: number;
}

export const Navigation = () => {
  const location = useLocation();
  const [activeIndex, setActiveIndex] = useState(0);
  
  // Fetch unread messages count
  const { data: unreadCount = 0 } = useQuery({
    queryKey: ['unreadMessagesCount'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return 0;

      const { count, error } = await supabase
        .from('messages')
        .select('*', { count: 'exact', head: true })
        .eq('receiver_id', user.id)
        .eq('status', 'sent');

      if (error) {
        console.error("Error fetching unread messages count:", error);
        return 0;
      }

      return count || 0;
    },
    refetchInterval: 10000, // Refetch every 10 seconds
  });

  // Fetch unread notifications count
  const { data: unreadNotifications = 0 } = useQuery({
    queryKey: ['unreadNotificationsCount'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return 0;

      const { count, error } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('is_read', false);

      if (error) {
        console.error("Error fetching unread notifications count:", error);
        return 0;
      }

      return count || 0;
    },
    refetchInterval: 10000, // Refetch every 10 seconds
  });

  const totalUnreadCount = unreadCount + unreadNotifications;

  const items: NavigationItem[] = [
    { path: "/", label: "Home", icon: <Home className="w-5 h-5" />, activeIndex: 0 },
    { path: "/map", label: "Map", icon: <MapPin className="w-5 h-5" />, activeIndex: 1 },
    { path: "/saved-cars", label: "Wishlist", icon: <Bookmark className="w-5 h-5" />, activeIndex: 2 },
    { path: "/bookings", label: "Bookings", icon: <CalendarClock className="w-5 h-5" />, activeIndex: 3 },
    { 
      path: "/notifications", 
      label: "Inbox", 
      icon: <Bell className="w-5 h-5" />, 
      activeIndex: 4,
      badge: totalUnreadCount > 0 ? totalUnreadCount : undefined
    },
  ];

  useEffect(() => {
    const currentItem = items.find((item) => location.pathname === item.path);
    if (currentItem) {
      setActiveIndex(currentItem.activeIndex);
    }
  }, [location.pathname]);

  return (
    <div className="fixed bottom-4 left-0 right-0 z-50 flex justify-center px-4">
      <nav className="container max-w-md mx-auto bg-white dark:bg-gray-900 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-800 h-16">
        <div className="grid grid-cols-5 h-full w-full">
          {items.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                "flex flex-col items-center justify-center h-full transition-colors px-1 relative",
                activeIndex === item.activeIndex
                  ? "text-primary dark:text-primary"
                  : "text-gray-500 dark:text-gray-400 hover:text-primary dark:hover:text-primary"
              )}
              onClick={() => setActiveIndex(item.activeIndex)}
            >
              <div className="relative">
                {item.icon}
                {item.badge && (
                  <Badge variant="destructive" className="absolute -top-2 -right-2 min-w-5 h-5 flex items-center justify-center p-0 text-xs">
                    {item.badge > 99 ? '99+' : item.badge}
                  </Badge>
                )}
              </div>
              <span className="text-xs mt-1">{item.label}</span>
            </Link>
          ))}
        </div>
      </nav>
      <div className="absolute -top-12 sm:-top-1 right-8 bg-white dark:bg-gray-900 p-2 rounded-full border border-gray-200 dark:border-gray-800 shadow-md">
        <ThemeToggle />
      </div>
    </div>
  );
};

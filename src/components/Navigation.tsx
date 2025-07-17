
import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Home, MapPin, CalendarClock, Bell, User, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "./ui/badge";
import { useUserRole } from "@/hooks/useUserRole";

interface NavigationItem {
  path: string;
  label: string;
  icon: React.ReactNode;
  activeIndex: number;
  badge?: number;
  onClick?: () => void;
}

export const Navigation = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [activeIndex, setActiveIndex] = useState(0);
  const queryClient = useQueryClient();
  const { userRole } = useUserRole();
  
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
    refetchInterval: 5000, // Refetch every 5 seconds for faster notification updates
  });

  // Listen for wallet transaction changes to refresh notifications
  useEffect(() => {
    const setupRealtimeSubscription = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const channel = supabase
        .channel('wallet-notifications')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'notifications'
          },
          () => {
            // Invalidate notification queries when new notifications are created
            queryClient.invalidateQueries({ queryKey: ['unreadNotificationsCount'] });
            queryClient.invalidateQueries({ queryKey: ['notifications'] });
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    };

    setupRealtimeSubscription();
  }, [queryClient]);

  const totalUnreadCount = unreadCount + unreadNotifications;

  const handleBookingsClick = () => {
    if (userRole === "host") {
      navigate("/host-bookings");
    } else {
      navigate("/renter-bookings");
    }
  };

  const items: NavigationItem[] = [
    { path: "/", label: "Explore", icon: <Search className="w-5 h-5" />, activeIndex: 0 },
    { path: "/map", label: "Map", icon: <MapPin className="w-5 h-5" />, activeIndex: 1 },
    { 
      path: userRole === "host" ? "/host-bookings" : "/renter-bookings", 
      label: "Bookings", 
      icon: <CalendarClock className="w-5 h-5" />, 
      activeIndex: 2,
      onClick: handleBookingsClick
    },
    { 
      path: "/notifications", 
      label: "Inbox", 
      icon: <Bell className="w-5 h-5" />, 
      activeIndex: 3,
      badge: totalUnreadCount > 0 ? totalUnreadCount : undefined
    },
    { 
      path: "/profile", 
      label: "Profile", 
      icon: <User className="w-5 h-5" />, 
      activeIndex: 4 
    },
  ];

  useEffect(() => {
    const currentItem = items.find((item) => {
      if (item.activeIndex === 2) {
        // For bookings, check both host and renter booking paths
        return location.pathname === "/host-bookings" || location.pathname === "/renter-bookings";
      }
      return location.pathname === item.path;
    });
    if (currentItem) {
      setActiveIndex(currentItem.activeIndex);
    }
  }, [location.pathname, userRole]);

  return (
    <div className="fixed bottom-4 left-0 right-0 z-50 flex justify-center px-4">
      <nav className="container max-w-md mx-auto bg-white dark:bg-gray-900 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-800 h-16">
        <div className="grid grid-cols-5 h-full w-full">
          {items.map((item) => (
            <div
              key={item.activeIndex}
              className={cn(
                "flex flex-col items-center justify-center h-full transition-colors px-1 relative cursor-pointer",
                activeIndex === item.activeIndex
                  ? "text-primary dark:text-primary"
                  : "text-gray-500 dark:text-gray-400 hover:text-primary dark:hover:text-primary"
              )}
              onClick={() => {
                setActiveIndex(item.activeIndex);
                if (item.onClick) {
                  item.onClick();
                } else {
                  navigate(item.path);
                }
              }}
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
            </div>
          ))}
        </div>
      </nav>
    </div>
  );
};

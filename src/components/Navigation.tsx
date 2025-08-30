
import { useState, useEffect, useMemo } from "react";
import { Link, useLocation } from "react-router-dom";
import { Home, MapPin, CalendarClock, Bell, User, Search, Settings } from "lucide-react";
import { cn } from "@/lib/utils";
import { useQuery, useQueryClient } from "@tanstack/react-query";
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
  const queryClient = useQueryClient();
  
  // Fetch unread messages count from conversation system
  const { data: unreadCount = 0 } = useQuery({
    queryKey: ['unreadMessagesCount'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return 0;

      // Get user's conversation IDs
      const { data: userParticipations, error: participationError } = await supabase
        .from('conversation_participants')
        .select('conversation_id')
        .eq('user_id', user.id);

      if (participationError || !userParticipations?.length) {
        console.error("Error fetching user participations:", participationError);
        return 0;
      }

      const conversationIds = userParticipations.map(p => p.conversation_id);

      // Count unread messages in user's conversations
      const { count, error } = await supabase
        .from('conversation_messages')
        .select('*', { count: 'exact', head: true })
        .in('conversation_id', conversationIds)
        .neq('sender_id', user.id) // Exclude messages sent by the user
        .or('delivery_status.eq.sent,delivery_status.eq.delivered'); // Only count unread messages

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

  // Listen for real-time changes to refresh counts
  useEffect(() => {
    const setupRealtimeSubscription = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const channel = supabase
        .channel('navigation-updates')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'conversation_messages'
          },
          () => {
            // Invalidate message count when conversation messages change
            queryClient.invalidateQueries({ queryKey: ['unreadMessagesCount'] });
          }
        )
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

  const items: NavigationItem[] = useMemo(() => [
    { path: "/", label: "Explore", icon: <Search className="w-5 h-5" />, activeIndex: 0 },
    { path: "/map", label: "Map", icon: <MapPin className="w-5 h-5" />, activeIndex: 1 },
    { path: "/bookings", label: "Bookings", icon: <CalendarClock className="w-5 h-5" />, activeIndex: 2 },
    { 
      path: "/messages", 
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
  ], [totalUnreadCount]);

  useEffect(() => {
    const currentItem = items.find((item) => {
      // Handle role-specific booking routes
      if (item.path === "/bookings") {
        return location.pathname === "/bookings" || 
               location.pathname === "/host-bookings" || 
               location.pathname === "/renter-bookings";
      }
      return location.pathname === item.path;
    });
    
    if (currentItem) {
      setActiveIndex(currentItem.activeIndex);
    }
  }, [location.pathname, items]);

  return (
    <div className="fixed bottom-4 left-0 right-0 z-50 flex justify-center px-4">
      <nav className="container max-w-md mx-auto bg-white dark:bg-gray-900 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-800 h-16">
        <div className="grid grid-cols-5 h-full w-full">
          {items.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                "flex flex-col items-center justify-center h-full transition-all duration-200 px-1 relative hover-scale",
                activeIndex === item.activeIndex
                  ? "text-primary dark:text-primary animate-scale-in"
                  : "text-gray-500 dark:text-gray-400 hover:text-primary dark:hover:text-primary"
              )}
              onClick={() => setActiveIndex(item.activeIndex)}
            >
              <div className="relative">
                {item.icon}
                {item.badge && (
                  <Badge variant="destructive" className="absolute -top-2 -right-2 min-w-5 h-5 flex items-center justify-center p-0 text-xs animate-pulse">
                    {item.badge > 99 ? '99+' : item.badge}
                  </Badge>
                )}
              </div>
              <span className="text-xs mt-1">{item.label}</span>
            </Link>
          ))}
        </div>
      </nav>
    </div>
  );
};

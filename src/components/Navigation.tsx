
import { useState, useEffect, useMemo } from "react";
import { Link, useLocation } from "react-router-dom";
import { Home, MapPin, CalendarClock, Bell, Menu, Search, Settings } from "lucide-react";
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

      // Get user's conversation IDs and their last_read_at timestamps
      const { data: userParticipations, error: participationError } = await supabase
        .from('conversation_participants')
        .select('conversation_id, last_read_at')
        .eq('user_id', user.id);

      if (participationError) {
        console.error("Error fetching user participations:", participationError);
        return 0;
      }
      
      if (!userParticipations?.length) {
        return 0;
      }

      let totalUnread = 0;

      // For each conversation, count messages after last_read_at
      for (const participation of userParticipations) {
        const lastReadAt = participation.last_read_at;

        let query = supabase
          .from('conversation_messages')
          .select('*', { count: 'exact', head: true })
          .eq('conversation_id', participation.conversation_id)
          .neq('sender_id', user.id); // Exclude messages sent by the user

        // If user has read this conversation before, only count messages after last_read_at
        if (lastReadAt) {
          query = query.gt('created_at', lastReadAt);
        }
        // If never read, count all messages

        const { count, error } = await query;

        if (error) {
          console.error("Error fetching unread messages for conversation:", participation.conversation_id, error);
          continue;
        }

        totalUnread += count || 0;
      }

      return totalUnread;
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
            event: 'UPDATE',
            schema: 'public',
            table: 'conversation_participants',
            filter: `user_id=eq.${user?.id}`
          },
          () => {
            // Invalidate unread count when user reads a conversation
            queryClient.invalidateQueries({ queryKey: ['unreadMessagesCount'] });
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
      badge: unreadCount > 0 ? unreadCount : undefined
    },
    { 
      path: "/more", 
      label: "More", 
      icon: <Menu className="w-5 h-5" />, 
      activeIndex: 4 
    },
  ], [unreadCount]);

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
    <div className="fixed bottom-0 left-0 right-0 z-50 flex justify-center px-0 pb-safe-area-inset-bottom pointer-events-none">
      <nav className="w-full max-w-md mx-auto bg-white/95 dark:bg-gray-900/95 backdrop-blur-md shadow-[0_-4px_20px_rgba(0,0,0,0.05)] border-t border-gray-100 dark:border-gray-800 h-[68px] pb-2 pointer-events-auto md:rounded-t-2xl md:mb-4 md:border md:h-16 md:pb-0 transition-all duration-300">
        <div className="grid grid-cols-5 h-full w-full">
          {items.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                "group flex flex-col items-center justify-center h-full transition-all duration-300 relative select-none",
                activeIndex === item.activeIndex
                  ? "text-primary dark:text-primary"
                  : "text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"
              )}
              onClick={() => setActiveIndex(item.activeIndex)}
            >
              {/* Active Indicator Line */}
              <span className={cn(
                "absolute top-0 w-8 h-1 rounded-b-full bg-primary transition-all duration-300 ease-out",
                activeIndex === item.activeIndex ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-2"
              )} />
              
              <div className="relative p-1 transition-transform duration-200 group-active:scale-95">
                <div className={cn(
                  "transition-all duration-300",
                  activeIndex === item.activeIndex ? "transform -translate-y-0.5" : ""
                )}>
                  {item.icon}
                </div>
                {item.badge && (
                  <Badge 
                    variant="destructive" 
                    className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] flex items-center justify-center p-0 text-[10px] animate-in zoom-in-50 duration-300 border-2 border-white dark:border-gray-900 shadow-sm"
                  >
                    {item.badge > 99 ? '99+' : item.badge}
                  </Badge>
                )}
              </div>
              <span className={cn(
                "text-[10px] font-medium transition-all duration-300 mt-0.5",
                activeIndex === item.activeIndex 
                  ? "opacity-100 translate-y-0" 
                  : "opacity-70 group-hover:opacity-100"
              )}>
                {item.label}
              </span>
            </Link>
          ))}
        </div>
      </nav>
    </div>
  );
};

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { useEffect } from "react";

export const useNotifications = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();



  // Fetch notifications
  const {
    data: notifications = [],
    isLoading,
    error
  } = useQuery({
    queryKey: ['notifications', user?.id],
    queryFn: async () => {
      if (!user?.id) {
        return [];
      }
      
      const { data, error } = await supabase
        .from('notifications')
        .select(`
          *,
          bookings:related_booking_id (
            id,
            start_date,
            end_date,
            total_price,
            status,
            cars (
              id,
              brand,
              model,
              image_url
            )
          ),
          cars:related_car_id (
            id,
            brand,
            model,
            image_url
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }
      
      return data || [];
    },
    enabled: !!user?.id,
  });

  // Count unread notifications
  const unreadCount = notifications.filter(n => !n.is_read).length;
  


  // Set up real-time subscription
  useEffect(() => {
    if (!user?.id) return;

    const channel = supabase
      .channel('notifications-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`
        },
        () => {
          // Invalidate and refetch notifications
          queryClient.invalidateQueries({ queryKey: ['notifications', user.id] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, queryClient]);

  // Mark notification as read
  const markAsRead = async (notificationId: string) => {
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', notificationId);

    if (!error) {
      queryClient.invalidateQueries({ queryKey: ['notifications', user?.id] });
    }
    
    return { error };
  };

  // Mark all as read
  const markAllAsRead = async () => {
    if (!user?.id) return { error: new Error('No user') };

    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', user.id)
      .eq('is_read', false);

    if (!error) {
      queryClient.invalidateQueries({ queryKey: ['notifications', user.id] });
    }

    return { error };
  };

  // Delete notification
  const deleteNotification = async (notificationId: string) => {
    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('id', notificationId);

    if (!error) {
      queryClient.invalidateQueries({ queryKey: ['notifications', user?.id] });
    }

    return { error };
  };

  return {
    notifications,
    unreadCount,
    isLoading,
    error,
    markAsRead,
    markAllAsRead,
    deleteNotification
  };
};
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { useEffect } from "react";
import type { Database } from "@/integrations/supabase/types";

type NotificationRole = Database['public']['Enums']['notification_role'];
type UserRole = Database['public']['Enums']['user_role'];

export const useNotifications = (options?: {
  includeExpired?: boolean;
  roleFilter?: NotificationRole[];
}) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { includeExpired = false, roleFilter } = options || {};



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
      
      let query = supabase
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
        .eq('user_id', user.id);

      // Filter out expired notifications unless explicitly requested
      if (!includeExpired) {
        query = query.or('expires_at.is.null,expires_at.gt.' + new Date().toISOString());
      }

      // Apply role-based filtering if specified
      if (roleFilter && roleFilter.length > 0) {
        query = query.in('role_target', roleFilter);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

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
  const markAsRead = async (notificationId: number) => {
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
  const deleteNotification = async (notificationId: number) => {
    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('id', notificationId);

    if (!error) {
      queryClient.invalidateQueries({ queryKey: ['notifications', user?.id] });
    }

    return { error };
  };

  // Clean up expired notifications
  const cleanupExpiredNotifications = async () => {
    if (!user?.id) return { error: new Error('No user') };

    try {
      const { error } = await supabase.rpc('cleanup_expired_notifications_enhanced');
      
      if (!error) {
        queryClient.invalidateQueries({ queryKey: ['notifications', user.id] });
      }
      
      return { error };
    } catch (error) {
      return { error: error as Error };
    }
  };

  // Get notifications filtered by role
  const getNotificationsByRole = (role: NotificationRole) => {
    return notifications.filter(notification => 
      notification.role_target === role || notification.role_target === 'system_wide'
    );
  };

  // Get user-specific notifications based on their role
  const getUserRoleNotifications = async () => {
    if (!user?.id) return [];

    // Get user's role from the profiles table
    const { data: userData, error: userError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (userError || !userData) {
      console.error('Error fetching user role:', userError);
      return notifications; // Return all notifications if we can't determine role
    }

    const userRole = userData.role as UserRole;
    
    // Filter notifications based on user role
    return notifications.filter(notification => {
      const roleTarget = notification.role_target as NotificationRole;
      
      // System-wide notifications are visible to everyone
      if (roleTarget === 'system_wide') return true;
      
      // Role-specific filtering  
      if (roleTarget === 'host_only' && userRole === 'host') return true;
      if (roleTarget === 'renter_only' && userRole === 'renter') return true;
      // Note: admin_only notifications would need admin role support in profiles table
      
      return false;
    });
  };

  return {
    notifications,
    unreadCount,
    isLoading,
    error,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    cleanupExpiredNotifications,
    getNotificationsByRole,
    getUserRoleNotifications
  };
};
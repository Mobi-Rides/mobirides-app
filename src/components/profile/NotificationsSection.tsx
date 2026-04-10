
import { ScrollArea } from "@/components/ui/scroll-area";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

export const NotificationsSection = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const { data: notifications } = useQuery({
    queryKey: ['notifications', user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    }
  });

  // Realtime subscription removed — useNotifications.ts already handles this via 'notifications-changes' channel

  const handleNotificationClick = (notificationId: string) => {
    console.log('Navigating to notification:', notificationId);
    navigate(`/notifications/${notificationId}`);
  };

  return (
    <div className="mb-8">
      <h2 className="text-lg font-semibold mb-4">Notifications</h2>
      
      <ScrollArea className="h-[300px] rounded-md border p-4">
        {notifications && notifications.length > 0 ? (
          <div className="space-y-4">
            {notifications.map((notification) => (
              <div 
                key={notification.id} 
                className={`p-4 rounded-lg border ${
                  notification.is_read ? 'bg-white' : 'bg-blue-50'
                } cursor-pointer hover:bg-gray-50 transition-colors`}
                onClick={() => handleNotificationClick(notification.id?.toString() || "")}
              >
                <h4 className="text-sm font-medium text-gray-800">{notification.title}</h4>
                <p className="text-xs text-gray-600 mt-1">{notification.description}</p>
                <span className="text-xs text-gray-400 mt-2 block">
                  {new Date(notification.created_at).toLocaleDateString()}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-center text-muted-foreground">No notifications yet</p>
        )}
      </ScrollArea>

      {/* Chat drawer removed */}
    </div>
  );
};

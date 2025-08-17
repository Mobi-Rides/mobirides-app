
import { useState } from "react";
import { Bell, Mail } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useOptimizedConversations } from "@/hooks/useOptimizedConversations";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";

export const NotificationsSection = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [selectedChat, setSelectedChat] = useState<{
    isOpen: boolean;
    senderId: string;
    senderName: string;
  }>({
    isOpen: false,
    senderId: '',
    senderName: '',
  });

  const { conversations, isLoading: conversationsLoading } = useOptimizedConversations();
  
  // Calculate unread messages from conversations
  const unreadCount = conversations.reduce((total, conv) => {
    // Count unread messages in each conversation
    // This is a simplified calculation - you might want to implement actual read status tracking
    return total + (conv.lastMessage ? 1 : 0);
  }, 0);

  const { data: notifications } = useQuery({
    queryKey: ['notifications'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    }
  });

  // Set up real-time subscription for notifications
  useEffect(() => {
    const setupRealtimeSubscription = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const channel = supabase
        .channel('notifications-realtime')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'notifications',
            filter: `user_id=eq.${user.id}`
          },
          () => {
            // Refresh notifications when new ones are created
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

  const handleChatClick = async (conversationId: string, participantName: string) => {
    // Navigate to the conversation
    navigate(`/messages?conversation=${conversationId}`);
  };

  const handleNotificationClick = (notificationId: string) => {
    console.log('Navigating to notification:', notificationId);
    navigate(`/notifications/${notificationId}`);
  };

  return (
    <div className="mb-8">
      <h2 className="text-lg font-semibold mb-4">Messages & Notifications</h2>
      
      <Tabs defaultValue="inbox" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="inbox" className="flex items-center gap-2">
            <Mail className="h-4 w-4" />
            Inbox
            {unreadCount > 0 && (
              <Badge variant="secondary" className="ml-2">
                {unreadCount}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex items-center gap-2">
            <Bell className="h-4 w-4" />
            Notifications
          </TabsTrigger>
        </TabsList>

        <TabsContent value="inbox">
          <ScrollArea className="h-[300px] rounded-md border p-4">
            {conversationsLoading ? (
              <p className="text-center text-muted-foreground">Loading conversations...</p>
            ) : conversations.length > 0 ? (
              <div className="space-y-4">
                {conversations.map((conversation) => {
                  const otherParticipant = conversation.participants.find(p => p.id !== conversation.participants[0]?.id);
                  const participantName = otherParticipant?.name || conversation.title || 'Unknown User';
                  
                  return (
                    <div 
                      key={conversation.id} 
                      className="p-4 rounded-lg border bg-white cursor-pointer hover:bg-gray-50 transition-colors"
                      onClick={() => handleChatClick(conversation.id, participantName)}
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h4 className="font-medium">{participantName}</h4>
                          {conversation.lastMessage && (
                            <p className="text-sm text-gray-600 mt-1 truncate">
                              {conversation.lastMessage.content}
                            </p>
                          )}
                        </div>
                        {conversation.lastMessage && (
                          <span className="text-xs text-gray-400">
                            {new Date(conversation.lastMessage.created_at).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-center text-muted-foreground">No conversations yet</p>
            )}
          </ScrollArea>
        </TabsContent>

        <TabsContent value="notifications">
          <ScrollArea className="h-[300px] rounded-md border p-4">
            {notifications && notifications.length > 0 ? (
              <div className="space-y-4">
                {notifications.map((notification) => (
                  <div 
                    key={notification.id} 
                    className={`p-4 rounded-lg border ${
                      notification.is_read ? 'bg-white' : 'bg-blue-50'
                    } cursor-pointer hover:bg-gray-50 transition-colors`}
                    onClick={() => handleNotificationClick(notification.id?.toString())}
                  >
                    <p className="text-sm text-gray-600">{notification.content}</p>
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
        </TabsContent>
      </Tabs>

      {/* Chat drawer removed */}
    </div>
  );
};

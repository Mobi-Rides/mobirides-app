
import { useState } from "react";
import { Navigation } from "@/components/Navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Bell, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { useMessages } from "@/hooks/useMessages";
import { ChatDrawer } from "@/components/chat/ChatDrawer";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";

const Notifications = () => {
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

  const { messages, markMessageAsRead, isLoading: messagesLoading } = useMessages();
  const unreadCount = messages?.filter(msg => msg.status === 'sent').length || 0;

  const { data: notifications, isLoading: notificationsLoading } = useQuery({
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

  const unreadNotifications = notifications?.filter(n => !n.is_read).length || 0;

  const handleChatClick = async (senderId: string, senderName: string | null) => {
    await markMessageAsRead(senderId);
    setSelectedChat({
      isOpen: true,
      senderId,
      senderName: senderName || 'Unknown User',
    });
  };

  const handleNotificationClick = (notificationId: string) => {
    console.log('Navigating to notification:', notificationId);
    navigate(`/notifications/${notificationId}`);
  };

  const handleMarkAllAsRead = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Mark all notifications as read
      const { error: notificationError } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', user.id)
        .eq('is_read', false);

      if (notificationError) {
        console.error("Error marking notifications as read:", notificationError);
        toast.error("Couldn't mark notifications as read");
        return;
      }

      // Mark all messages as read
      const { error: messageError } = await supabase
        .from('messages')
        .update({ status: 'read' })
        .eq('receiver_id', user.id)
        .eq('status', 'sent');

      if (messageError) {
        console.error("Error marking messages as read:", messageError);
        toast.error("Couldn't mark messages as read");
        return;
      }

      // Invalidate queries to refresh data
      await queryClient.invalidateQueries({ queryKey: ['notifications'] });
      await queryClient.invalidateQueries({ queryKey: ['messages'] });
      await queryClient.invalidateQueries({ queryKey: ['unreadMessagesCount'] });
      await queryClient.invalidateQueries({ queryKey: ['unreadNotificationsCount'] });

      toast.success("All notifications marked as read");
    } catch (error) {
      console.error("Error in markAllAsRead:", error);
      toast.error("Failed to mark notifications as read");
    }
  };

  return (
    <div className="min-h-screen pb-24">
      <header className="bg-white dark:bg-gray-900 p-4 sticky top-0 z-10 shadow-sm flex justify-between items-center">
        <h1 className="text-xl font-semibold">Notifications</h1>
        {(unreadCount > 0 || unreadNotifications > 0) && (
          <Button variant="outline" size="sm" onClick={handleMarkAllAsRead}>
            Mark all as read
          </Button>
        )}
      </header>

      <main className="p-4">
        <Tabs defaultValue="inbox" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="inbox" className="flex items-center gap-2">
              <Mail className="h-4 w-4" />
              Messages
              {unreadCount > 0 && (
                <Badge variant="destructive" className="ml-2">
                  {unreadCount}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="notifications" className="flex items-center gap-2">
              <Bell className="h-4 w-4" />
              Notifications
              {unreadNotifications > 0 && (
                <Badge variant="destructive" className="ml-2">
                  {unreadNotifications}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="inbox">
            {messagesLoading ? (
              <div className="space-y-4 mt-2">
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-20 w-full" />
              </div>
            ) : messages && messages.length > 0 ? (
              <ScrollArea className="h-[calc(100vh-200px)] rounded-md border p-4">
                {messages.map((message) => (
                  <div 
                    key={message.id} 
                    className={`mb-4 cursor-pointer hover:bg-muted p-2 rounded-md transition-colors ${
                      message.status === 'sent' ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                    }`}
                    onClick={() => handleChatClick(message.sender_id, message.sender?.full_name || null)}
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{message.sender?.full_name || 'Unknown User'}</span>
                      <span className="text-sm text-muted-foreground">
                        {new Date(message.created_at).toLocaleDateString()}
                      </span>
                      {message.status === 'sent' && (
                        <Badge variant="success" className="ml-auto">New</Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">{message.content}</p>
                    <Separator className="my-2" />
                  </div>
                ))}
              </ScrollArea>
            ) : (
              <div className="text-center py-10 text-muted-foreground">
                <p>No messages yet</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="notifications">
            {notificationsLoading ? (
              <div className="space-y-4 mt-2">
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-20 w-full" />
              </div>
            ) : notifications && notifications.length > 0 ? (
              <ScrollArea className="h-[calc(100vh-200px)] rounded-md border p-4">
                <div className="space-y-4">
                  {notifications.map((notification) => (
                    <div 
                      key={notification.id} 
                      className={`p-4 rounded-lg border ${
                        notification.is_read ? 'bg-white dark:bg-gray-900' : 'bg-blue-50 dark:bg-blue-900/20'
                      } cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors`}
                      onClick={() => handleNotificationClick(notification.id)}
                    >
                      <p className="text-sm text-gray-600 dark:text-gray-300">{notification.content}</p>
                      <div className="flex justify-between items-center mt-2">
                        <span className="text-xs text-gray-400">
                          {new Date(notification.created_at).toLocaleDateString()}
                        </span>
                        {!notification.is_read && (
                          <Badge variant="success">New</Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            ) : (
              <div className="text-center py-10 text-muted-foreground">
                <p>No notifications yet</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>

      <ChatDrawer
        isOpen={selectedChat.isOpen}
        onClose={() => setSelectedChat({ isOpen: false, senderId: '', senderName: '' })}
        receiverId={selectedChat.senderId}
        receiverName={selectedChat.senderName}
      />

      <Navigation />
    </div>
  );
};

export default Notifications;

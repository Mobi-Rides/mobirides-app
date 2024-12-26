import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Bell, Mail } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { ChatDrawer } from "@/components/chat/ChatDrawer";

interface Message {
  id: string;
  content: string;
  created_at: string;
  sender_id: string;
  status: 'sent' | 'read';
  sender: {
    id: string;
    full_name: string | null;
    avatar_url: string | null;
  };
}

export const NotificationsSection = () => {
  const [userRole, setUserRole] = useState<'host' | 'renter'>('renter');
  const [unreadCount, setUnreadCount] = useState(0);
  const [selectedChat, setSelectedChat] = useState<{
    isOpen: boolean;
    senderId: string;
    senderName: string;
  }>({
    isOpen: false,
    senderId: '',
    senderName: '',
  });

  // Fetch user role
  useEffect(() => {
    const fetchUserRole = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

      if (profile) {
        setUserRole(profile.role);
      }
    };

    fetchUserRole();
  }, []);

  // Fetch messages based on user role
  const { data: messages } = useQuery({
    queryKey: ['messages', userRole],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data: messages } = await supabase
        .from('messages')
        .select(`
          id,
          content,
          created_at,
          sender_id,
          status,
          sender:profiles!messages_sender_id_fkey (
            id,
            full_name,
            avatar_url
          )
        `)
        .eq(userRole === 'host' ? 'receiver_id' : 'sender_id', user.id)
        .order('created_at', { ascending: false });

      return messages as Message[] || [];
    }
  });

  // Update unread count
  useEffect(() => {
    const unread = messages?.filter(msg => msg.status === 'sent').length || 0;
    setUnreadCount(unread);
  }, [messages]);

  const handleChatClick = (senderId: string, senderName: string | null) => {
    setSelectedChat({
      isOpen: true,
      senderId,
      senderName: senderName || 'Unknown User',
    });
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
            {messages?.map((message) => (
              <div 
                key={message.id} 
                className="mb-4 cursor-pointer hover:bg-muted p-2 rounded-md transition-colors"
                onClick={() => handleChatClick(message.sender_id, message.sender.full_name)}
              >
                <div className="flex items-center gap-2">
                  <span className="font-medium">{message.sender.full_name || 'Unknown User'}</span>
                  <span className="text-sm text-muted-foreground">
                    {new Date(message.created_at).toLocaleDateString()}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">{message.content}</p>
                <Separator className="my-2" />
              </div>
            ))}
            {!messages?.length && (
              <p className="text-center text-muted-foreground">No messages yet</p>
            )}
          </ScrollArea>
        </TabsContent>

        <TabsContent value="notifications">
          <ScrollArea className="h-[300px] rounded-md border p-4">
            <p className="text-center text-muted-foreground">No notifications yet</p>
          </ScrollArea>
        </TabsContent>
      </Tabs>

      <ChatDrawer
        isOpen={selectedChat.isOpen}
        onClose={() => setSelectedChat({ isOpen: false, senderId: '', senderName: '' })}
        receiverId={selectedChat.senderId}
        receiverName={selectedChat.senderName}
      />
    </div>
  );
};
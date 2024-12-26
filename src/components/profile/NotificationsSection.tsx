import { useState } from "react";
import { Bell, Mail } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ChatDrawer } from "@/components/chat/ChatDrawer";
import { useMessages } from "@/hooks/useMessages";
import { MessageList } from "./MessageList";

export const NotificationsSection = () => {
  const [selectedChat, setSelectedChat] = useState<{
    isOpen: boolean;
    senderId: string;
    senderName: string;
  }>({
    isOpen: false,
    senderId: '',
    senderName: '',
  });

  const { messages, markMessageAsRead } = useMessages();
  const unreadCount = messages?.filter(msg => msg.status === 'sent').length || 0;

  const handleChatClick = async (senderId: string, senderName: string | null) => {
    await markMessageAsRead(senderId);
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
          <MessageList 
            messages={messages || []}
            onMessageClick={handleChatClick}
          />
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
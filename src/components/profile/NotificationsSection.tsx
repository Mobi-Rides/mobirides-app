import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Bell, Mail } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";

interface Message {
  id: string;
  content: string;
  created_at: string;
  sender: {
    full_name: string;
    avatar_url: string;
  };
}

export const NotificationsSection = () => {
  const [userRole, setUserRole] = useState<'host' | 'renter'>('renter');
  const [unreadCount, setUnreadCount] = useState(0);

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
          sender:sender_id(
            full_name,
            avatar_url
          )
        `)
        .eq(userRole === 'host' ? 'receiver_id' : 'sender_id', user.id)
        .order('created_at', { ascending: false });

      return messages || [];
    }
  });

  // Update unread count
  useEffect(() => {
    const unread = messages?.filter(msg => msg.status === 'sent').length || 0;
    setUnreadCount(unread);
  }, [messages]);

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
            {messages?.map((message: Message) => (
              <div key={message.id} className="mb-4">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{message.sender.full_name}</span>
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
    </div>
  );
};
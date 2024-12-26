import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, ArrowRight, Send, X } from "lucide-react";
import { useEffect, useState } from "react";

interface Message {
  id: string;
  content: string;
  sender_id: string;
  created_at: string;
  status: 'sent' | 'delivered' | 'read';
}

interface ChatDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  receiverId: string;
  receiverName: string;
  carId?: string;
}

export const ChatDrawer = ({ isOpen, onClose, receiverId, receiverName, carId }: ChatDrawerProps) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [receiverAvatar, setReceiverAvatar] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (!isOpen) return;

    const fetchReceiverProfile = async () => {
      const { data: profile } = await supabase
        .from('profiles')
        .select('avatar_url')
        .eq('id', receiverId)
        .single();

      if (profile?.avatar_url) {
        const { data } = supabase.storage
          .from('avatars')
          .getPublicUrl(profile.avatar_url);
        setReceiverAvatar(data.publicUrl);
      }
    };

    fetchReceiverProfile();

    const fetchMessages = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error fetching messages:', error);
        return;
      }

      setMessages(data || []);
    };

    fetchMessages();

    // Subscribe to new messages
    const channel = supabase
      .channel('messages_channel')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
        },
        (payload) => {
          setMessages((current) => [...current, payload.new as Message]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [isOpen, receiverId]);

  const sendMessage = async () => {
    if (!newMessage.trim()) return;

    try {
      setSending(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('messages')
        .insert({
          content: newMessage.trim(),
          sender_id: user.id,
          receiver_id: receiverId,
          related_car_id: carId,
        });

      if (error) throw error;

      setNewMessage("");
      toast({
        title: "Message sent",
        description: "Your message has been sent successfully.",
      });
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSending(false);
    }
  };

  return (
    <Drawer open={isOpen} onOpenChange={onClose}>
      <DrawerContent className="h-[90vh]">
        <DrawerHeader className="flex items-center justify-between border-b pb-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
            <div className="flex items-center gap-3">
              <DrawerTitle>{receiverName}</DrawerTitle>
              <Avatar className="h-8 w-8">
                <AvatarImage src={receiverAvatar || undefined} alt={receiverName} />
                <AvatarFallback>
                  {receiverName.split(' ').map(n => n[0]).join('')}
                </AvatarFallback>
              </Avatar>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon">
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </DrawerHeader>
        <div className="p-4 flex flex-col h-full">
          <ScrollArea className="flex-1 mb-4">
            <div className="space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`p-3 rounded-lg max-w-[80%] ${
                    message.sender_id === receiverId
                      ? "bg-muted ml-0"
                      : "bg-primary text-primary-foreground ml-auto"
                  }`}
                >
                  {message.content}
                </div>
              ))}
            </div>
          </ScrollArea>
          <div className="flex gap-2">
            <Textarea
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type your message..."
              className="resize-none"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  sendMessage();
                }
              }}
            />
            <Button 
              onClick={sendMessage} 
              disabled={sending || !newMessage.trim()}
              className="flex-shrink-0"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
};
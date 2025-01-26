import { Drawer, DrawerContent } from "@/components/ui/drawer";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";
import { ChatHeader } from "./ChatHeader";
import { ChatInput } from "./ChatInput";
import { ChatMessages } from "./ChatMessages";
import type { Message } from "@/types/message";

interface ChatDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  receiverId: string;
  receiverName: string;
  carId?: string;
}

export const ChatDrawer = ({
  isOpen,
  onClose,
  receiverId,
  receiverName,
  carId,
}: ChatDrawerProps) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [receiverAvatar, setReceiverAvatar] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
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

    const fetchMessages = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      
      setCurrentUserId(user.id);

      const { data, error } = await supabase
        .from("messages")
        .select("*")
        .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
        .order("created_at", { ascending: true });

      if (error) {
        console.error("Error fetching messages:", error);
        return;
      }

      setMessages(data || []);
    };

    fetchReceiverProfile();
    fetchMessages();

    // Subscribe to new messages
    const channel = supabase
      .channel("messages")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
        },
        (payload) => {
          console.log("New message received:", payload);
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

    setSending(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: "Error",
          description: "You must be logged in to send messages",
          variant: "destructive",
        });
        return;
      }

      const { error } = await supabase.from("messages").insert({
        content: newMessage.trim(),
        sender_id: user.id,
        receiver_id: receiverId,
        related_car_id: carId,
      });

      if (error) throw error;

      setNewMessage("");
    } catch (error) {
      console.error("Error sending message:", error);
      toast({
        title: "Error",
        description: "Could not send message. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSending(false);
    }
  };

  return (
    <Drawer open={isOpen} onOpenChange={onClose}>
      <DrawerContent className="h-[90%] flex flex-col">
        <ChatHeader
          receiverName={receiverName}
          receiverAvatar={receiverAvatar}
          onClose={onClose}
        />
        {currentUserId && (
          <ChatMessages
            messages={messages}
            currentUserId={currentUserId}
          />
        )}
        <ChatInput
          newMessage={newMessage}
          onChange={setNewMessage}
          onSend={sendMessage}
          sending={sending}
        />
      </DrawerContent>
    </Drawer>
  );
};
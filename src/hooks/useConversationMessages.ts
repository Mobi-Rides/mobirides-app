import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Message } from "@/types/message";

interface DatabaseMessage {
  id: string;
  content: string;
  sender_id: string;
  created_at: string;
  updated_at: string;
  message_type: 'text' | 'image' | 'file';
  edited: boolean;
  edited_at?: string;
  reply_to_message_id?: string;
  related_car_id?: string;
  metadata: any;
  sender: {
    id: string;
    full_name: string;
    avatar_url?: string;
  };
}

export const useConversationMessages = (conversationId: string | undefined) => {
  const queryClient = useQueryClient();

  const { data: messages, isLoading } = useQuery({
    queryKey: ['conversation-messages', conversationId],
    queryFn: async () => {
      if (!conversationId) return [];
      
      console.log("Fetching messages for conversation:", conversationId);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data: messages, error } = await supabase
        .from('conversation_messages')
        .select(`
          id,
          content,
          sender_id,
          created_at,
          updated_at,
          message_type,
          edited,
          edited_at,
          reply_to_message_id,
          related_car_id,
          metadata,
          sender:profiles!conversation_messages_sender_id_fkey (
            id,
            full_name,
            avatar_url
          )
        `)
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (error) {
        console.error("Error fetching messages:", error);
        return [];
      }

      console.log("Raw messages fetched:", messages);
      
      // Transform to UI format
      const transformedMessages: Message[] = (messages as any[]).map((msg: any) => ({
        id: msg.id,
        content: msg.content,
        senderId: msg.sender_id,
        conversationId,
        timestamp: new Date(msg.created_at),
        type: msg.message_type,
        edited: msg.edited,
        editedAt: msg.edited_at ? new Date(msg.edited_at) : undefined,
        // Additional properties for compatibility
        sender: msg.sender,
        sender_id: msg.sender_id,
        created_at: msg.created_at
      }));

      console.log("Transformed messages:", transformedMessages);
      return transformedMessages;
    },
    enabled: !!conversationId,
    refetchInterval: 5000, // Refetch every 5 seconds
  });

  const sendMessageMutation = useMutation({
    mutationFn: async ({ content, type = 'text' }: { content: string; type?: 'text' | 'image' | 'file' }) => {
      if (!conversationId) throw new Error('No conversation ID');
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data: message, error } = await supabase
        .from('conversation_messages')
        .insert({
          conversation_id: conversationId,
          sender_id: user.id,
          content,
          message_type: type
        })
        .select(`
          id,
          content,
          sender_id,
          created_at,
          updated_at,
          message_type,
          edited,
          edited_at,
          reply_to_message_id,
          related_car_id,
          metadata,
          sender:profiles!conversation_messages_sender_id_fkey (
            id,
            full_name,
            avatar_url
          )
        `)
        .single();

      if (error) throw error;
      return message;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversation-messages', conversationId] });
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    }
  });

  return {
    messages: messages || [],
    isLoading,
    sendMessage: sendMessageMutation.mutate,
    isSendingMessage: sendMessageMutation.isPending
  };
};
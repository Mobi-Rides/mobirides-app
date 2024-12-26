import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Message } from "@/types/message";

export const useMessages = () => {
  const queryClient = useQueryClient();

  const { data: messages, isLoading } = useQuery({
    queryKey: ['messages'],
    queryFn: async () => {
      console.log("Fetching messages");
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data: messages, error } = await supabase
        .from('messages')
        .select(`
          id,
          content,
          created_at,
          sender_id,
          receiver_id,
          status,
          sender:profiles!messages_sender_id_fkey (
            id,
            full_name,
            avatar_url
          )
        `)
        .eq('receiver_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error("Error fetching messages:", error);
        return [];
      }

      console.log("Messages fetched:", messages);
      return messages as Message[];
    }
  });

  const markMessageAsRead = async (senderId: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase
      .from('messages')
      .update({ status: 'read' })
      .eq('sender_id', senderId)
      .eq('receiver_id', user.id)
      .eq('status', 'sent');

    if (error) {
      console.error('Error updating message status:', error);
    } else {
      queryClient.invalidateQueries({ queryKey: ['messages'] });
    }
  };

  return {
    messages,
    isLoading,
    markMessageAsRead
  };
};
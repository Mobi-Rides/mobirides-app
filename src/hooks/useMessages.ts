// DEPRECATED: Legacy message hook - Use useConversationMessages instead
// This hook is maintained for backward compatibility during migration
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Message } from "@/types/message";

/**
 * @deprecated Use useConversationMessages instead
 * This hook provides legacy message support during migration period
 */
export const useMessages = () => {
  const queryClient = useQueryClient();

  const { data: messages, isLoading } = useQuery({
    queryKey: ['legacy-messages'],
    queryFn: async () => {
      console.warn("Using deprecated useMessages hook - consider migrating to conversation system");
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      // First check if messages have been migrated to conversations
      const { data: migratedMessages, error: migrationError } = await supabase
        .from('messages')
        .select('id, migrated_to_conversation_id')
        .eq('receiver_id', user.id)
        .not('migrated_to_conversation_id', 'is', null)
        .limit(1);

      if (!migrationError && migratedMessages?.length > 0) {
        console.log("Messages have been migrated to conversation system - returning empty for legacy");
        return [];
      }

      // Fetch legacy messages only if not migrated
      const { data: messages, error } = await supabase
        .from('messages')
        .select(`
          id,
          content,
          created_at,
          sender_id,
          receiver_id,
          status,
          related_car_id,
          migrated_to_conversation_id,
          sender:profiles!messages_sender_id_fkey (
            id,
            full_name,
            avatar_url
          )
        `)
        .eq('receiver_id', user.id)
        .is('migrated_to_conversation_id', null)
        .order('created_at', { ascending: false });

      if (error) {
        console.error("Error fetching legacy messages:", error);
        return [];
      }

      // Transform to match Message interface
      return messages.map(msg => ({
        id: msg.id,
        content: msg.content,
        senderId: msg.sender_id,
        conversationId: msg.migrated_to_conversation_id || '',
        timestamp: new Date(msg.created_at),
        type: 'text' as const,
        status: msg.status,
        sender: msg.sender,
        sender_id: msg.sender_id,
        created_at: msg.created_at
      })) as Message[];
    },
    refetchInterval: 10000, // Reduced frequency for legacy
  });

  const markMessageAsRead = async (senderId: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase
      .from('messages')
      .update({ status: 'read' })
      .eq('sender_id', senderId)
      .eq('receiver_id', user.id)
      .eq('status', 'sent')
      .is('migrated_to_conversation_id', null);

    if (error) {
      console.error('Error updating legacy message status:', error);
    } else {
      queryClient.invalidateQueries({ queryKey: ['legacy-messages'] });
    }
  };

  return {
    messages,
    isLoading,
    markMessageAsRead
  };
};
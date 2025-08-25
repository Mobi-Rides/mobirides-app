import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Message } from '@/types/message';

interface DatabaseMessage {
  id: string;
  content: string;
  sender_id: string;
  conversation_id: string;
  created_at: string;
  updated_at: string;
  message_type: 'text' | 'image' | 'file';
  sender: {
    id: string;
    full_name: string;
    avatar_url?: string;
  } | null;
}

export const useConversationMessages = (conversationId?: string) => {
  const queryClient = useQueryClient();

  const messagesQuery = useQuery<Message[]>({
    queryKey: ['conversation-messages', conversationId],
    queryFn: async () => {
      if (!conversationId) {
        return [];
      }

      console.log('[useConversationMessages] Fetching messages for conversation:', conversationId);

      const { data, error } = await supabase
        .from('conversation_messages')
        .select(`
          id,
          content,
          sender_id,
          conversation_id,
          created_at,
          updated_at,
          message_type,
          sender:profiles!sender_id (
            id,
            full_name,
            avatar_url
          )
        `)
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('[useConversationMessages] Error fetching messages:', error);
        throw error;
      }

      console.log(`[useConversationMessages] Fetched ${data?.length || 0} messages`);

      return (data as DatabaseMessage[])?.map((msg: DatabaseMessage) => ({
        id: msg.id,
        content: msg.content,
        senderId: msg.sender_id,
        conversationId: msg.conversation_id,
        timestamp: new Date(msg.created_at),
        type: msg.message_type,
        sender: msg.sender ? {
          id: msg.sender.id,
          full_name: msg.sender.full_name,
          avatar_url: msg.sender.avatar_url
        } : null
      })) || [];
    },
    enabled: !!conversationId,
    staleTime: 0, // Always fetch fresh data
    gcTime: 30000, // Keep in cache for 30 seconds
  });

  // Auth-aware real-time subscription setup
  useEffect(() => {
    if (!conversationId) return;

    console.log('[useConversationMessages] Setting up auth-aware real-time subscription for:', conversationId);

    const setupMessageSubscription = async () => {
      try {
        // Validate auth and conversation access before subscribing
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user) {
          console.warn('[useConversationMessages] No valid session, skipping subscription');
          return;
        }

        // Validate conversation access
        const { data: accessData } = await supabase.rpc('validate_conversation_access', {
          p_conversation_id: conversationId
        });

        if (!(accessData as any)?.has_access) {
          console.warn('[useConversationMessages] No access to conversation, skipping subscription');
          return;
        }

        const channel = supabase
          .channel(`conversation-messages-${conversationId}-${session.user.id}`)
          .on(
            'postgres_changes',
            {
              event: 'INSERT',
              schema: 'public',
              table: 'conversation_messages',
              filter: `conversation_id=eq.${conversationId}`,
            },
            (payload) => {
              console.log('[useConversationMessages] New message received:', payload);
              queryClient.invalidateQueries({ 
                queryKey: ['conversation-messages', conversationId] 
              });
            }
          )
          .subscribe((status) => {
            console.log('[useConversationMessages] Message subscription status:', status);
          });

        return () => {
          console.log('[useConversationMessages] Cleaning up message subscription');
          supabase.removeChannel(channel);
        };
      } catch (error) {
        console.error('[useConversationMessages] Message subscription setup failed:', error);
        return () => {}; // Return empty cleanup function
      }
    };

    const cleanup = setupMessageSubscription();
    return () => {
      cleanup.then(cleanupFn => {
        if (typeof cleanupFn === 'function') {
          cleanupFn();
        }
      }).catch(error => {
        console.error('[useConversationMessages] Cleanup error:', error);
      });
    };
  }, [conversationId, queryClient]);

    return messagesQuery;
};
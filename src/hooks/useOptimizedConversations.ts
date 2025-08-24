import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { useEffect, useMemo, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Conversation, User, Message } from "@/types/message";
import { toast } from "sonner";

interface DatabaseConversation {
  id: string;
  title?: string;
  type: 'direct' | 'group';
  created_at: string;
  updated_at: string;
  last_message_at?: string;
  created_by: string;
  conversation_participants: Array<{
    user_id: string;
    joined_at: string;
    profiles: {
      id: string;
      full_name: string;
      avatar_url?: string;
    };
  }>;
  conversation_messages: Array<{
    id: string;
    content: string;
    sender_id: string;
    created_at: string;
    message_type: 'text' | 'image' | 'file';
  }>;
}

/**
 * Optimized conversation hook with better real-time performance and batching
 */
export const useOptimizedConversations = () => {
  const queryClient = useQueryClient();

  // Optimized real-time subscription with targeted filters
  useEffect(() => {
    let conversationIds: string[] = [];

    const setupSubscription = async () => {
      const { data: { session }, error } = await supabase.auth.getSession();
      if (error || !session?.user) {
        console.log('No valid session for subscription setup');
        return;
      }
      const user = session.user;

      // Get user's conversation IDs first
      const { data: userParticipations } = await supabase
        .from('conversation_participants')
        .select('conversation_id')
        .eq('user_id', user.id);

      conversationIds = userParticipations?.map(p => p.conversation_id) || [];

      const channel = supabase
        .channel(`optimized-conversations-${user.id}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'conversation_messages',
            filter: conversationIds.length > 0 ? `conversation_id=in.(${conversationIds.join(',')})` : 'conversation_id=eq.never'
          },
          (payload) => {
            console.log('Optimized message update:', payload);
            // Batch invalidation to prevent excessive queries
            setTimeout(() => {
              queryClient.invalidateQueries({ queryKey: ['optimized-conversations'] });
            }, 100);
          }
        )
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'conversation_participants',
            filter: `user_id=eq.${user.id}`
          },
          (payload) => {
            console.log('Optimized participation update:', payload);
            queryClient.invalidateQueries({ queryKey: ['optimized-conversations'] });
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    };

    const cleanup = setupSubscription();
    return () => {
      cleanup.then(fn => fn?.());
    };
  }, [queryClient]);

  const { data: conversations, isLoading } = useQuery({
    queryKey: ['optimized-conversations'],
    queryFn: async () => {
      console.log("Fetching optimized conversations");
      const { data: { session }, error } = await supabase.auth.getSession();
      if (error || !session?.user) {
        console.log("No valid session for conversation fetch");
        return [];
      }
      const user = session.user;

      try {
        // Get user's conversation IDs with a single query
        const { data: userParticipations, error: participationError } = await supabase
          .from('conversation_participants')
          .select('conversation_id')
          .eq('user_id', user.id);

        if (participationError) {
          console.error("Error fetching user participations:", participationError);
          return [];
        }

        if (!userParticipations || userParticipations.length === 0) {
          console.log("No conversations found for user");
          return [];
        }

        const convIds = userParticipations.map(p => p.conversation_id);

        // Batch fetch all conversation data
        const [conversationsResult, participantsResult, messagesResult] = await Promise.all([
          supabase
            .from('conversations')
            .select('id, title, type, created_at, updated_at, last_message_at, created_by')
            .in('id', convIds)
            .order('updated_at', { ascending: false }),
          
          supabase
            .from('conversation_participants')
            .select(`
              conversation_id,
              user_id,
              joined_at,
              profiles (id, full_name, avatar_url)
            `)
            .in('conversation_id', convIds),
          
          supabase
            .from('conversation_messages')
            .select(`
              id, 
              content, 
              sender_id, 
              created_at, 
              message_type, 
              conversation_id,
              sender:profiles (
                id,
                full_name,
                avatar_url
              )
            `)
            .in('conversation_id', convIds)
            .order('created_at', { ascending: false })
        ]);

        const { data: userConversations, error: convError } = conversationsResult;
        const { data: participants, error: participantsError } = participantsResult;
        const { data: latestMessages, error: messagesError } = messagesResult;

        if (convError || participantsError || messagesError) {
          console.error("Error in batch fetch:", { convError, participantsError, messagesError });
          return [];
        }

        // Transform conversations with optimized lookups
        const participantsByConv = new Map();
        participants?.forEach(p => {
          if (!participantsByConv.has(p.conversation_id)) {
            participantsByConv.set(p.conversation_id, []);
          }
          participantsByConv.get(p.conversation_id).push(p);
        });

        const messagesByConv = new Map();
        latestMessages?.forEach(m => {
          if (!messagesByConv.has(m.conversation_id)) {
            messagesByConv.set(m.conversation_id, m);
          }
        });

        const transformedConversations: Conversation[] = userConversations?.map((conv: any) => {
          const conversationParticipants = participantsByConv.get(conv.id) || [];
          
          const participantUsers: User[] = conversationParticipants.map((p: any) => ({
            id: p.user_id,
            name: p.profiles?.full_name || 'Unknown User',
            avatar: p.profiles?.avatar_url ? 
              supabase.storage.from('avatars').getPublicUrl(p.profiles.avatar_url).data.publicUrl : 
              undefined,
            status: 'offline' as const
          }));

          const lastMessage = messagesByConv.get(conv.id);

          return {
            id: conv.id,
            title: conv.title || conv.name || 'Direct Message',
            participants: participantUsers,
            lastMessage: lastMessage ? {
              id: lastMessage.id,
              content: lastMessage.content,
              senderId: lastMessage.sender_id,
              conversationId: conv.id,
              timestamp: new Date(lastMessage.created_at),
              type: lastMessage.message_type as 'text' | 'image' | 'file',
              sender: lastMessage.sender
            } : undefined,
            unreadCount: 0,
            type: (conv.type || 'direct') as 'direct' | 'group',
            createdAt: new Date(conv.created_at || new Date().toISOString()),
            updatedAt: new Date(conv.updated_at || conv.last_message_at || new Date().toISOString())
          };
        }) || [];

        console.log("Optimized conversations transformed:", transformedConversations);
        return transformedConversations;

      } catch (error) {
        console.error("Error in optimized conversation fetch:", error);
        return [];
      }
    },
    enabled: true,
    staleTime: 30000, // Cache for 30 seconds
    gcTime: 300000, // Keep in cache for 5 minutes
  });

  const createConversationMutation = useMutation({
    mutationFn: async ({ participantIds, title }: { participantIds: string[], title?: string }) => {
      console.log('Creating conversation - checking session...');
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error('Session error in conversation creation:', error);
        throw new Error('Authentication session error');
      }
      
      if (!session?.user) {
        console.error('No valid session for conversation creation');
        throw new Error('Not authenticated - no valid session');
      }
      
      console.log('Session validated, user:', session.user.id);
      const user = session.user;

      // Check if direct conversation already exists
      if (participantIds.length === 1) {
        const existingConversation = conversations?.find(conv => 
          conv.type === 'direct' && 
          conv.participants.length === 2 &&
          conv.participants.some(p => p.id === participantIds[0]) &&
          conv.participants.some(p => p.id === user.id)
        );
        
        if (existingConversation) {
          console.log('Using existing conversation:', existingConversation.id);
          return existingConversation;
        }
      }

      // Create new conversation
      const { data: conversation, error: convError } = await supabase
        .from('conversations')
        .insert({
          title,
          type: participantIds.length > 1 ? 'group' : 'direct',
          created_by: user.id
        })
        .select()
        .single();

      if (convError) {
        console.error('Error creating conversation:', convError);
        console.error('User ID used:', user.id);
        console.error('Session details:', { 
          userId: session.user.id,
          accessToken: session.access_token ? 'present' : 'missing',
          refreshToken: session.refresh_token ? 'present' : 'missing'
        });
        
        if (convError.code === '42501') {
          toast.error('Unable to create conversation. Please try logging out and back in.');
          throw new Error('Authentication context mismatch - please refresh your session');
        }
        
        throw convError;
      }

      // Add participants
      const participantsToAdd = [user.id, ...participantIds.filter(id => id !== user.id)];
      const { error: participantsError } = await supabase
        .from('conversation_participants')
        .insert(
          participantsToAdd.map(userId => ({
            conversation_id: conversation.id,
            user_id: userId
          }))
        );

      if (participantsError) {
        console.error('Error adding participants:', participantsError);
        throw participantsError;
      }

      return conversation;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['optimized-conversations'] });
    },
    onError: (error) => {
      console.error('Conversation creation failed:', error);
      
      if (error.message.includes('Authentication context mismatch')) {
        toast.error('Session expired. Please refresh the page and try again.');
      } else if (error.message.includes('Not authenticated')) {
        toast.error('Please log in to start a conversation.');
      } else {
        toast.error('Failed to create conversation. Please try again.');
      }
    }
  });

  // Enhanced message operations
  const getConversationMessages = useCallback((conversationId: string) => {
    return useQuery({
      queryKey: ['conversation-messages', conversationId],
      queryFn: async () => {
        if (!conversationId) return [];
        
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        if (sessionError || !session?.user) return [];

        const { data: messages, error: messagesError } = await supabase
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
            sender:profiles (
              id,
              full_name,
              avatar_url
            )
          `)
          .eq('conversation_id', conversationId)
          .order('created_at', { ascending: true });

        if (messagesError) {
          console.error("Error fetching messages:", messagesError);
          return [];
        }
        
        // Transform to UI format
        const transformedMessages: Message[] = messages?.map((msg: any) => ({
          id: msg.id,
          content: msg.content,
          senderId: msg.sender_id,
          conversationId,
          timestamp: new Date(msg.created_at),
          type: msg.message_type as 'text' | 'image' | 'file',
          edited: msg.edited,
          editedAt: msg.edited_at ? new Date(msg.edited_at) : undefined,
          sender: msg.sender ? {
            id: msg.sender.id,
            full_name: msg.sender.full_name,
            avatar_url: msg.sender.avatar_url
          } : undefined
        })) || [];

        return transformedMessages;
      },
      enabled: !!conversationId
    });
  }, []);

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async ({ conversationId, content, type = 'text' }: { 
      conversationId: string; 
      content: string; 
      type?: 'text' | 'image' | 'file' 
    }) => {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !session?.user) throw new Error('Not authenticated');
      const user = session.user;

      const { data: message, error: messageError } = await supabase
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
          sender:profiles (
            id,
            full_name,
            avatar_url
          )
        `)
        .single();

      if (messageError) throw messageError;
      return message;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['conversation-messages', variables.conversationId] });
      queryClient.invalidateQueries({ queryKey: ['optimized-conversations'] });
    }
  });

  const memoizedConversations = useMemo(() => conversations || [], [conversations]);

  return {
    conversations: memoizedConversations,
    isLoading,
    createConversation: createConversationMutation.mutate,
    isCreatingConversation: createConversationMutation.isPending,
    getConversationMessages,
    sendMessage: sendMessageMutation.mutate,
    isSendingMessage: sendMessageMutation.isPending
  };
};
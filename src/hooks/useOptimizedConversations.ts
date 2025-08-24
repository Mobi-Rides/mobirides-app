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

  // Phase 2: Session stability and retry logic
  const waitForStableSession = async (retries = 3): Promise<any> => {
    for (let i = 0; i < retries; i++) {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.warn(`Session check attempt ${i + 1} failed:`, error);
          if (i === retries - 1) throw error;
          await new Promise(resolve => setTimeout(resolve, 500 * (i + 1))); // Exponential backoff
          continue;
        }
        
        if (!session?.user) {
          console.warn(`No session on attempt ${i + 1}, refreshing...`);
          
          // Attempt session refresh
          const { data: { session: refreshedSession }, error: refreshError } = await supabase.auth.refreshSession();
          
          if (refreshError) {
            console.warn('Session refresh failed:', refreshError);
            if (i === retries - 1) throw new Error('Unable to establish valid session');
            await new Promise(resolve => setTimeout(resolve, 500 * (i + 1)));
            continue;
          }
          
          if (!refreshedSession?.user) {
            if (i === retries - 1) throw new Error('No authenticated user after session refresh');
            await new Promise(resolve => setTimeout(resolve, 500 * (i + 1)));
            continue;
          }
          
          return refreshedSession;
        }
        
        // Verify session is actually valid by making a test call
        try {
          await supabase.from('profiles').select('id').eq('id', session.user.id).limit(1);
          console.log(`Session validated on attempt ${i + 1}, user:`, session.user.id);
          return session;
        } catch (testError) {
          console.warn(`Session validation failed on attempt ${i + 1}:`, testError);
          if (i === retries - 1) throw new Error('Session validation failed');
          await new Promise(resolve => setTimeout(resolve, 500 * (i + 1)));
        }
      } catch (error) {
        console.error(`Session establishment attempt ${i + 1} failed:`, error);
        if (i === retries - 1) throw error;
        await new Promise(resolve => setTimeout(resolve, 500 * (i + 1)));
      }
    }
    
    throw new Error('Failed to establish stable session after retries');
  };

  const createConversationMutation = useMutation({
    mutationFn: async ({ participantIds, title }: { participantIds: string[], title?: string }) => {
      console.log('Creating conversation - establishing stable session...');
      
      // Phase 2: Implement session stability checks
      const session = await waitForStableSession();
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

      // Phase 2 & 3: Enhanced conversation creation with RPC fallback
      let conversation, convError;
      const maxRetries = 2;
      
      for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
          console.log(`Conversation creation attempt ${attempt + 1}`);
          
          // Ensure fresh session for each retry
          if (attempt > 0) {
            const freshSession = await waitForStableSession(1);
            console.log('Using fresh session for retry, user:', freshSession.user.id);
          }
          
          // Try direct table insertion first (fastest method)
          if (attempt === 0) {
            const result = await supabase
              .from('conversations')
              .insert({
                title,
                type: participantIds.length > 1 ? 'group' : 'direct',
                created_by: user.id
              })
              .select()
              .single();
            
            conversation = result.data;
            convError = result.error;
            
            if (!convError) {
              console.log('Conversation created successfully via direct insertion');
              break;
            }
          }
          
          // Phase 3: Fallback to secure RPC function for RLS issues
          if (convError?.code === '42501' || attempt > 0) {
            console.log(`Attempting RPC fallback method on attempt ${attempt + 1}`);
            
            const rpcResult = await supabase.rpc('create_conversation_secure', {
              p_title: title,
              p_type: participantIds.length > 1 ? 'group' : 'direct',
              p_participant_ids: participantIds,
              p_created_by_id: user.id
            });
            
            if (rpcResult.error) {
              convError = rpcResult.error;
              console.error('RPC method failed:', rpcResult.error);
            } else {
              // Convert RPC result to conversation format
              conversation = rpcResult.data;
              convError = null;
              console.log('Conversation created successfully via RPC method');
              
              // If existing conversation was found, skip participant addition
              if (conversation.exists) {
                console.log('Using existing conversation, skipping participant addition');
                return conversation;
              }
              break;
            }
          }
          
          // If it's an RLS error and we have retries left, try again
          if (convError?.code === '42501' && attempt < maxRetries) {
            console.warn(`RLS error on attempt ${attempt + 1}, retrying...`);
            await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)));
            continue;
          }
          
          break;
        } catch (error) {
          console.error(`Attempt ${attempt + 1} failed with error:`, error);
          convError = error;
          
          if (attempt < maxRetries) {
            await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)));
            continue;
          }
          
          break;
        }
      }

      if (convError) {
        console.error('Final error creating conversation:', convError);
        console.error('User ID used:', user.id);
        console.error('Session details:', { 
          userId: session.user.id,
          accessToken: session.access_token ? 'present' : 'missing',
          refreshToken: session.refresh_token ? 'present' : 'missing',
          sessionExpiry: session.expires_at ? new Date(session.expires_at * 1000).toISOString() : 'unknown'
        });
        
        if (convError.code === '42501') {
          // Phase 3: Enhanced error handling
          console.error('RLS Policy violation - auth context issue detected');
          toast.error('Authentication issue detected. Please refresh the page and try again.');
          throw new Error('RLS authentication context failure - session refresh required');
        }
        
        // Phase 3: User-friendly error messages
        if (convError.message?.includes('duplicate')) {
          toast.error('Conversation already exists with this user.');
        } else if (convError.message?.includes('network')) {
          toast.error('Network error. Please check your connection and try again.');
        } else {
          toast.error('Failed to create conversation. Please try again.');
        }
        
        throw convError;
      }

      // Add participants (only if we used direct insertion, not RPC)
      if (conversation && !conversation.exists) {
        const participantsToAdd = [user.id, ...participantIds.filter(id => id !== user.id)];
        
        // Only add participants if we didn't use RPC (RPC handles this internally)
        if (!conversation.created_by_rpc) {
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
        } else {
          console.log('Skipping participant addition - handled by RPC method');
        }
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
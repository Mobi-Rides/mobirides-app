import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { useEffect, useMemo, useCallback, useRef } from "react";
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

  const { data: conversations = [], isLoading, error } = useQuery({
    queryKey: ['optimized-conversations'],
    queryFn: async () => {
      try {
        console.log("🔄 [CONVERSATIONS] Starting fetch process");
        const sessionStart = Date.now();
        
        const { data: { session }, error } = await supabase.auth.getSession();
        console.log(`⏱️ [CONVERSATIONS] Session fetch took ${Date.now() - sessionStart}ms`);
        
        if (error || !session?.user) {
          console.warn("❌ [CONVERSATIONS] No valid session:", { error: error?.message, hasUser: !!session?.user });
          return [];
        }
        
        const user = session.user;
        console.log(`✅ [CONVERSATIONS] Valid session for user: ${user.id}`);

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
          console.log("📭 [CONVERSATIONS] No conversations found for user");
          return [];
        }

        const convIds = userParticipations.map(p => p.conversation_id);
        console.log(`📊 [CONVERSATIONS] Found ${convIds.length} conversation IDs:`, convIds);

        // Test simple query first to isolate the issue
        console.log("🔍 [DEBUG] Testing simple profiles query...");
        const { data: testProfile, error: testError } = await supabase
          .from('profiles')
          .select('id, full_name')
          .eq('id', user.id)
          .maybeSingle();
        
        console.log("🔍 [DEBUG] Simple profiles test result:", { testProfile, testError });
        
        if (testError) {
          console.error("🚨 [DEBUG] Simple profiles query failed:", JSON.stringify(testError, null, 2));
        }

        // Test session state before complex queries
        console.log("🔍 [DEBUG] Testing session state...");
        const { data: sessionCheck, error: sessionError } = await supabase.auth.getSession();
        console.log("🔍 [DEBUG] Current session state:", {
          hasSession: !!sessionCheck.session,
          hasUser: !!sessionCheck.session?.user,
          userId: sessionCheck.session?.user?.id,
          tokenPresent: !!sessionCheck.session?.access_token,
          error: sessionError
        });

        // Test RLS function directly
        console.log("🔍 [DEBUG] Testing is_conversation_participant function...");
        if (convIds.length > 0) {
          try {
            const { data: rlsTest, error: rlsError } = await supabase
              .rpc('is_conversation_participant', {
                conversation_uuid: convIds[0],
                user_uuid: user.id
              });
            console.log("🔍 [DEBUG] RLS function test result:", { rlsTest, rlsError });
          } catch (rlsTestError) {
            console.error("🚨 [DEBUG] RLS function test failed:", rlsTestError);
          }
        }

        // Test basic conversation_participants query
        console.log("🔍 [DEBUG] Testing basic conversation_participants query...");
        const { data: basicParticipants, error: basicError } = await supabase
          .from('conversation_participants')
          .select('conversation_id, user_id')
          .eq('user_id', user.id)
          .limit(1);
        
        console.log("🔍 [DEBUG] Basic participants test result:", { basicParticipants, basicError });

        // Batch fetch all conversation data
        const batchStart = Date.now();
        console.log("🔄 [CONVERSATIONS] Starting batch fetch for conversations, participants, and messages");
        
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

        console.log(`⏱️ [CONVERSATIONS] Batch fetch completed in ${Date.now() - batchStart}ms`);
        console.log(`📋 [CONVERSATIONS] Batch results:`, {
          conversations: userConversations?.length || 0,
          participants: participants?.length || 0, 
          messages: latestMessages?.length || 0
        });

        if (convError || participantsError || messagesError) {
          console.error("❌ [CONVERSATIONS] Error in batch fetch:");
          console.error("🚨 [CONVERSATIONS ERROR] Raw errors:", JSON.stringify({ convError, participantsError, messagesError }, null, 2));
          
          if (convError) console.error("🚨 [CONV ERROR] Details:", convError);
          if (participantsError) console.error("🚨 [PARTICIPANTS ERROR] Details:", participantsError);
          if (messagesError) console.error("🚨 [MESSAGES ERROR] Details:", messagesError);
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

        console.log("🔄 [CONVERSATIONS] Starting transformation process");
        const transformStart = Date.now();
        
        const transformedConversations: Conversation[] = (userConversations || []).map((conv: any) => {
          const conversationParticipants = participantsByConv.get(conv?.id) || [];
          console.log(`👥 [CONVERSATIONS] Conv ${conv?.id}: ${conversationParticipants.length} participants found`);
          
          const participantUsers: User[] = (conversationParticipants || []).map((p: any) => ({
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

        console.log(`✅ [CONVERSATIONS] Transformation completed in ${Date.now() - transformStart}ms`);
        console.log(`📊 [CONVERSATIONS] Final result: ${transformedConversations.length} conversations transformed`);
        console.log("🎯 [CONVERSATIONS] Detailed conversations:", transformedConversations.map(c => ({
          id: c.id,
          participantCount: c.participants?.length || 0,
          hasLastMessage: !!c.lastMessage,
          type: c.type
        })));
        
        return transformedConversations || [];

      } catch (error) {
        console.error("Error in optimized conversation fetch:", error);
        return [];
      }
      } catch (queryError) {
        console.error("Critical error in conversation query:", queryError);
        return [];
      }
    },
    enabled: true,
    staleTime: 30000, // Cache for 30 seconds
    gcTime: 300000, // Keep in cache for 5 minutes
    retry: (failureCount, error) => {
      console.log(`🔄 [CONVERSATIONS] Query retry ${failureCount}:`, error);
      return failureCount < 3;
    }
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

  // Circuit breaker for repeated failures
  const conversationAttempts = useRef(new Map<string, { count: number, lastAttempt: number }>());
  
  const createConversationMutation = useMutation({
    mutationFn: async ({ participantIds, title }: { participantIds: string[], title?: string }) => {
      const attemptKey = participantIds.sort().join(',');
      const now = Date.now();
      const attempt = conversationAttempts.current.get(attemptKey);
      
      // Circuit breaker: prevent spam for same participant combination
      if (attempt && attempt.count >= 3 && (now - attempt.lastAttempt) < 30000) {
        throw new Error('Too many attempts. Please wait 30 seconds before trying again.');
      }
      
      console.log('Creating conversation - establishing stable session...');
      
      // Phase 2: Implement session stability checks
      const session = await waitForStableSession();
      const user = session.user;

      // Check if direct conversation already exists in current data
      if (participantIds.length === 1 && conversations) {
        console.log('Checking existing conversations:', conversations.length);
        
        const existingConversation = conversations.find(conv => {
          // Add comprehensive validation and logging
          if (!conv.participants) {
            console.warn('Conversation missing participants:', conv.id);
            return false;
          }
          
          if (conv.participants.length !== 2) {
            return false;
          }
          
          const hasRecipient = conv.participants.some(p => p.id === participantIds[0]);
          const hasCurrentUser = conv.participants.some(p => p.id === user.id);
          
          return conv.type === 'direct' && hasRecipient && hasCurrentUser;
        });
        
        if (existingConversation) {
          console.log('Using existing conversation:', existingConversation.id);
          // Reset attempt counter on success
          conversationAttempts.current.delete(attemptKey);
          return existingConversation;
        }
        
        console.log('No existing direct conversation found, creating new one');
      }

      // Use secure RPC method with circuit breaker tracking
      try {
        // Update attempt counter
        const currentAttempt = conversationAttempts.current.get(attemptKey) || { count: 0, lastAttempt: 0 };
        conversationAttempts.current.set(attemptKey, { count: currentAttempt.count + 1, lastAttempt: now });
        
        console.log('Using RPC method for conversation creation');
        const { data: rpcResult, error: rpcError } = await supabase.rpc('create_conversation_secure', {
          p_title: title || null,
          p_type: participantIds.length > 1 ? 'group' : 'direct',
          p_participant_ids: participantIds.filter(id => id && typeof id === 'string'),
          p_created_by_id: user.id
        });
        
        if (rpcError) {
          console.error('RPC method failed:', rpcError);
          throw rpcError;
        }
        
         console.log('Conversation created via RPC:', rpcResult);
         
         // Reset attempt counter on success
         conversationAttempts.current.delete(attemptKey);
         
         // Cast RPC result and return the conversation in the expected format
         const conversation = rpcResult as any;
         return {
           id: conversation.id,
           title: conversation.title || title,
           type: conversation.type,
           participants: [
             { id: user.id, name: user.email || 'You' },
             ...participantIds.map(id => ({ id, name: 'User' }))
           ],
           lastMessage: null,
           unreadCount: 0,
           createdAt: new Date(conversation.created_at || new Date().toISOString()),
           updatedAt: new Date(conversation.updated_at || new Date().toISOString())
         };
       } catch (error) {
         console.error('Final error creating conversation:', error);
         console.error('User ID used:', user.id);
         console.error('Session details:', {
           userId: session.user.id,
           accessToken: session.access_token ? 'present' : 'missing',
           refreshToken: session.refresh_token ? 'present' : 'missing',
           sessionExpiry: session.expires_at ? new Date(session.expires_at * 1000).toISOString() : 'unknown'
         });
         throw error;
       }
     },
    onSuccess: (newConversation) => {
      console.log('Conversation created successfully:', newConversation);
      // Immediately refetch conversations to show the new one
      queryClient.invalidateQueries({ queryKey: ['optimized-conversations'] });
    },
    onError: (error) => {
      console.error('Conversation creation failed:', error);
    },
  });

  // Send message mutation with comprehensive auth and error handling
  const sendMessageMutation = useMutation({
    mutationFn: async ({ conversationId, content, type = 'text' }: { 
      conversationId: string; 
      content: string; 
      type?: 'text' | 'image' | 'file' 
    }) => {
      console.log("📤 [SEND_MESSAGE] Starting send operation:", { conversationId, content, type });
      
      // Establish stable session with retries
      const session = await waitForStableSession();
      console.log("✅ [SEND_MESSAGE] Authenticated user:", session.user.id);

      // Verify user has access to the conversation
      const { data: participationCheck, error: participationError } = await supabase
        .from('conversation_participants')
        .select('user_id')
        .eq('conversation_id', conversationId)
        .eq('user_id', session.user.id)
        .single();
      
      if (participationError || !participationCheck) {
        console.error("❌ [SEND_MESSAGE] User not authorized for conversation:", conversationId);
        throw new Error('You are not authorized to send messages in this conversation');
      }
      
      console.log("🔄 [SEND_MESSAGE] Inserting message into database");
      const { data, error } = await supabase
        .from('conversation_messages')
        .insert({
          conversation_id: conversationId,
          sender_id: session.user.id,
          content: content.trim(),
          message_type: type || 'text',
          sent_at: new Date().toISOString(),
          delivery_status: 'sent',
          is_encrypted: false,
          edited: false
        })
        .select(`
          id,
          content,
          sender_id,
          conversation_id,
          created_at,
          sent_at,
          delivery_status,
          message_type
        `)
        .single();

      if (error) {
        console.error("❌ [SEND_MESSAGE] Database insert failed:", {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code,
          conversationId,
          userId: session.user.id
        });
        
        // Provide user-friendly error messages
        if (error.message?.includes('row-level security')) {
          throw new Error('You are not authorized to send messages in this conversation. Please refresh and try again.');
        } else if (error.message?.includes('violates check constraint')) {
          throw new Error('Message content is invalid. Please check your message and try again.');
        } else if (error.code === '23503') {
          throw new Error('Conversation not found. Please refresh the page and try again.');
        } else {
          throw new Error(`Failed to send message: ${error.message}`);
        }
      }
      
      if (!data) {
        console.error("❌ [SEND_MESSAGE] No data returned from insert");
        throw new Error('Message was not created properly');
      }
      
      console.log("✅ [SEND_MESSAGE] Message sent successfully:", data.id);
      return data;
    },
    onSuccess: (data) => {
      console.log("✅ [SEND_MESSAGE] Mutation successful, invalidating queries");
      queryClient.invalidateQueries({ queryKey: ['conversation-messages'] });
      queryClient.invalidateQueries({ queryKey: ['optimized-conversations'] });
      toast.success('Message sent successfully');
    },
    onError: (error: any) => {
      console.error("❌ [SEND_MESSAGE] Mutation failed:", error);
      const errorMessage = error?.message || 'Failed to send message';
      toast.error(errorMessage);
    },
  });

  return {
    conversations,
    isLoading,
    error,
    createConversation: createConversationMutation.mutate,
    isCreatingConversation: createConversationMutation.isPending,
    sendMessage: sendMessageMutation.mutate,
    isSendingMessage: sendMessageMutation.isPending,
    sendMessageError: sendMessageMutation.error,
    sendMessageSuccess: sendMessageMutation.isSuccess,
  };
};

// Separate hook for fetching messages to avoid conditional hook usage
export const useConversationMessages = (conversationId?: string) => {
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
    enabled: !!conversationId,
    staleTime: 10000, // Cache for 10 seconds
    gcTime: 300000, // Keep in cache for 5 minutes
  });
};
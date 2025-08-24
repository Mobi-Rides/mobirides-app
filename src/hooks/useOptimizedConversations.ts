import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { useEffect, useMemo, useCallback, useRef, useState } from "react";
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
 * Phase 1: Add authentication guard to prevent queries before user is loaded
 */
export const useOptimizedConversations = (userId?: string) => {
  const queryClient = useQueryClient();

  // Optimized real-time subscription with targeted filters
  useEffect(() => {
    let conversationIds: string[] = [];

    const setupSubscription = async () => {
      // Phase 1: Only set up subscription if userId is provided
      if (!userId) {
        console.log('No userId provided, skipping subscription setup');
        return;
      }

      // Get user's conversation IDs first
      const { data: userParticipations } = await supabase
        .from('conversation_participants')
        .select('conversation_id')
        .eq('user_id', userId);

      conversationIds = userParticipations?.map(p => p.conversation_id) || [];

      const channel = supabase
        .channel(`optimized-conversations-${userId}`)
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
              queryClient.invalidateQueries({ queryKey: ['optimized-conversations', userId] });
            }, 100);
          }
        )
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'conversation_participants',
            filter: `user_id=eq.${userId}`
          },
          (payload) => {
            console.log('Optimized participation update:', payload);
            queryClient.invalidateQueries({ queryKey: ['optimized-conversations', userId] });
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
  }, [queryClient, userId]);

  // Phase 2: Add circuit breaker and error recovery
  const [retryCount, setRetryCount] = useState(0);
  const maxRetries = 3;

  const { data: conversations = [], isLoading, error } = useQuery<Conversation[]>({
    queryKey: ['optimized-conversations', userId],
    queryFn: async () => {
      try {
        console.log("🔄 [CONVERSATIONS] Starting fetch process");
        const sessionStart = Date.now();
        
        // Phase 1: Use provided userId or fall back to session
        let user;
        if (userId) {
          user = { id: userId };
          console.log(`✅ [CONVERSATIONS] Using provided user ID: ${userId}`);
        } else {
          const { data: { session }, error } = await supabase.auth.getSession();
          console.log(`⏱️ [CONVERSATIONS] Session fetch took ${Date.now() - sessionStart}ms`);
          
          if (error || !session?.user) {
            console.warn("❌ [CONVERSATIONS] No valid session:", { error: error?.message, hasUser: !!session?.user });
            return [];
          }
          
          user = session.user;
          console.log(`✅ [CONVERSATIONS] Valid session for user: ${user.id}`);
        }

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

        // Batch fetch all conversation data
        const batchStart = Date.now();
        console.log("🔄 [CONVERSATIONS] Starting batch fetch for conversations, participants, and messages");
        
        // Phase 2: Implement fallback logic for embedding failures
        let conversationsResult, participantsResult, messagesResult;
        
        try {
          [conversationsResult, participantsResult, messagesResult] = await Promise.all([
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
                profiles!conversation_participants_user_id_fkey (id, full_name, avatar_url)
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
                profiles!conversation_messages_sender_id_fkey (
                  id,
                  full_name,
                  avatar_url
                )
              `)
              .in('conversation_id', convIds)
              .order('created_at', { ascending: false })
          ]);
        } catch (embeddingError) {
          console.warn("⚠️ [CONVERSATIONS] Embedding query failed, using fallback queries:", embeddingError);
          
          // Phase 2: Fallback to separate queries if embedding fails
          [conversationsResult, participantsResult, messagesResult] = await Promise.all([
            supabase
              .from('conversations')
              .select('id, title, type, created_at, updated_at, last_message_at, created_by')
              .in('id', convIds)
              .order('updated_at', { ascending: false }),
            
            supabase
              .from('conversation_participants')
              .select('conversation_id, user_id, joined_at')
              .in('conversation_id', convIds),
            
            supabase
              .from('conversation_messages')
              .select('id, content, sender_id, created_at, message_type, conversation_id')
              .in('conversation_id', convIds)
              .order('created_at', { ascending: false })
          ]);
          
          // Fetch profiles separately for participants
          const participantUserIds = participantsResult.data?.map(p => p.user_id) || [];
          if (participantUserIds.length > 0) {
            const { data: profiles } = await supabase
              .from('profiles')
              .select('id, full_name, avatar_url')
              .in('id', participantUserIds);
            
            // Merge profiles with participants
            if (participantsResult.data && profiles) {
              participantsResult.data = participantsResult.data.map(p => ({
                ...p,
                profiles: profiles.find(profile => profile.id === p.user_id) || null
              }));
            }
          }
          
          // Fetch profiles separately for message senders
          const senderUserIds = messagesResult.data?.map(m => m.sender_id) || [];
          if (senderUserIds.length > 0) {
            const { data: senderProfiles } = await supabase
              .from('profiles')
              .select('id, full_name, avatar_url')
              .in('id', senderUserIds);
            
            // Merge profiles with messages
            if (messagesResult.data && senderProfiles) {
              messagesResult.data = messagesResult.data.map(m => ({
                ...m,
                sender: senderProfiles.find(profile => profile.id === m.sender_id) || null
              }));
            }
          }
        }

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
    // Phase 1: Only enable query when user is authenticated
    enabled: !!userId,
    staleTime: 30000, // Cache for 30 seconds
    gcTime: 300000, // Keep in cache for 5 minutes
    retry: (failureCount, error) => {
      console.log(`🔄 [CONVERSATIONS] Query retry ${failureCount}:`, error);
      setRetryCount(failureCount);
      return failureCount < maxRetries;
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
      
      // Phase 2: Implement session stability checks or use provided userId
      let user;
      if (userId) {
        user = { id: userId };
      } else {
        const session = await waitForStableSession();
        user = session.user;
      }

      // Check if direct conversation already exists in current data
      if (participantIds.length === 1 && Array.isArray(conversations)) {
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
          p_type: participantIds.length === 1 ? 'direct' : 'group',
          p_participant_ids: participantIds,
          p_created_by_id: user.id
        });

        if (rpcError) {
          console.error('RPC conversation creation failed:', rpcError);
          throw new Error(`Failed to create conversation: ${rpcError.message}`);
        }

        console.log('RPC result:', rpcResult);

        if (rpcResult && typeof rpcResult === 'object' && 'exists' in rpcResult && rpcResult.exists) {
          console.log('RPC returned existing conversation:', (rpcResult as any).id);
          // Find in current conversations or transform the result
          const existingInState = conversations.find(c => c.id === (rpcResult as any).id);
          if (existingInState) {
            conversationAttempts.current.delete(attemptKey);
            return existingInState;
          }
        }

        // Reset attempt counter on successful creation
        conversationAttempts.current.delete(attemptKey);
        return rpcResult;

      } catch (error) {
        console.error('RPC conversation creation error:', error);
        throw error;
      }
    },
    onSuccess: (data) => {
      console.log('✅ [CONVERSATIONS] Successfully created/found conversation:', data);
      toast.success('Conversation ready!');
      queryClient.invalidateQueries({ queryKey: ['optimized-conversations', userId] });
    },
    onError: (error: Error) => {
      console.error('❌ [CONVERSATIONS] Failed to create conversation:', error);
      toast.error(error.message || 'Failed to create conversation. Please try again.');
    }
  });

  // Phase 4: Enhanced message sending with better authentication and error handling
  const sendMessageMutation = useMutation({
    mutationFn: async ({ conversationId, content, type = 'text' }: { 
      conversationId: string; 
      content: string; 
      type?: 'text' | 'image' | 'file' 
    }) => {
      console.log('📤 [SEND MESSAGE] Starting send process:', { conversationId, contentLength: content.length, type });
      
      // Use session recovery wrapper for reliable auth context
      return await SessionRecovery.withAuthRetry(async () => {
        // Verify auth context with enhanced verifier
        const authVerifier = AuthContextVerifier.getInstance();
        const authCheck = await authVerifier.verifyAuthContext();
        
        if (!authCheck.isValid) {
          throw new Error(`Authentication failed: ${authCheck.error}`);
        }
        
        console.log('✅ [SEND MESSAGE] Auth context verified, user:', authCheck.userId);

        // Test RLS access with actual database query
        const { data: accessCheck, error: accessError } = await supabase
          .from('conversation_participants')
          .select('user_id')
          .eq('conversation_id', conversationId)
          .eq('user_id', authCheck.userId)
          .single();

        if (accessError) {
          console.error('❌ [SEND MESSAGE] RLS access check failed:', accessError);
          if (accessError.code === 'PGRST116') {
            throw new Error('You do not have access to this conversation');
          }
          throw new Error(`Database access error: ${accessError.message}`);
        }

        console.log('✅ [SEND MESSAGE] RLS access verified, proceeding with message insert...');

        const { data, error } = await supabase
          .from('conversation_messages')
          .insert({
            conversation_id: conversationId,
            sender_id: authCheck.userId!,
            content: content.trim(),
            message_type: type
          })
          .select(`
            *,
            profiles!conversation_messages_sender_id_fkey (
              id,
              full_name,
              avatar_url
            )
          `)
          .single();

        if (error) {
          console.error('❌ [SEND MESSAGE] Database error:', error);
          
          // Enhanced error messages for common issues
          if (error.code === '23503') {
            throw new Error('Invalid conversation or user reference');
          } else if (error.code === '42501') {
            throw new Error('Permission denied - you may not have access to this conversation');
          } else {
            throw new Error(`Failed to send message: ${error.message}`);
          }
        }

        console.log('✅ [SEND MESSAGE] Message sent successfully:', data?.id);
        return data;
        
      }, 'Send Message Operation');
    },
    onSuccess: (data) => {
      console.log('✅ [CONVERSATIONS] Message sent successfully:', data);
      toast.success('Message sent!');
      // Invalidate both conversations and messages queries
      queryClient.invalidateQueries({ queryKey: ['optimized-conversations', userId] });
      queryClient.invalidateQueries({ queryKey: ['conversation-messages'] });
    },
    onError: (error: Error) => {
      console.error('❌ [CONVERSATIONS] Failed to send message:', error);
      toast.error(error.message || 'Failed to send message. Please try again.');
    }
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
    sendMessageSuccess: sendMessageMutation.isSuccess
  };
};

/**
 * Hook for fetching messages in a specific conversation with real-time updates
 * Phase 4: Ensure message fetching works with proper authentication
 */
export const useConversationMessages = (conversationId?: string) => {
  const queryClient = useQueryClient();

  // Real-time subscription for messages in this conversation
  useEffect(() => {
    if (!conversationId) return;

    console.log('Setting up message subscription for conversation:', conversationId);
    
    const channel = supabase
      .channel(`conversation-${conversationId}-messages`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'conversation_messages',
          filter: `conversation_id=eq.${conversationId}`
        },
        (payload) => {
          console.log('Message update received:', payload);
          queryClient.invalidateQueries({ 
            queryKey: ['conversation-messages', conversationId] 
          });
        }
      )
      .subscribe();

    return () => {
      console.log('Cleaning up message subscription for conversation:', conversationId);
      supabase.removeChannel(channel);
    };
  }, [conversationId, queryClient]);

  return useQuery({
    queryKey: ['conversation-messages', conversationId],
    queryFn: async (): Promise<Message[]> => {
      if (!conversationId) return [];

      console.log('📥 [MESSAGES] Fetching messages for conversation:', conversationId);

      const { data, error } = await supabase
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
          profiles!conversation_messages_sender_id_fkey (
            id,
            full_name,
            avatar_url
          )
        `)
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('❌ [MESSAGES] Error fetching messages:', error);
        throw error;
      }

      console.log(`✅ [MESSAGES] Fetched ${data?.length || 0} messages`);

      return (data || []).map((msg: any): Message => ({
        id: msg.id,
        content: msg.content,
        senderId: msg.sender_id,
        conversationId: conversationId,
        timestamp: new Date(msg.created_at),
        type: msg.message_type || 'text',
        edited: msg.edited || false,
        editedAt: msg.edited_at ? new Date(msg.edited_at) : undefined,
        sender: msg.sender ? {
          id: msg.sender.id,
          full_name: msg.sender.full_name,
          avatar_url: msg.sender.avatar_url
        } : undefined
      }));
    },
    enabled: !!conversationId,
    staleTime: 10000, // Cache messages for 10 seconds
    gcTime: 300000, // Keep in cache for 5 minutes
    retry: 2
  });
};
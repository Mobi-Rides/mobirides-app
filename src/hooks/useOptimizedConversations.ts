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
    message_type: 'text' | 'image' | 'file' | 'audio' | 'video';
  }>;
}

/**
 * Optimized conversation hook with better real-time performance and batching
 * Phase 1: Add authentication guard to prevent queries before user is loaded
 */
export const useOptimizedConversations = (userId?: string) => {
  const queryClient = useQueryClient();

  // Auth-aware real-time subscription with session monitoring
  useEffect(() => {
    let conversationIds: string[] = [];
    let authListener: any;
    let currentChannel: any;

    const setupAuthAwareSubscription = async () => {
      try {
        // Enhanced auth check with session stability
        const { data: { session } } = await supabase.auth.getSession();

        if (!session?.user || !userId) {
          console.log('🔐 [SUBSCRIPTION] Auth check failed or no userId, skipping subscription setup');
          return;
        }

        console.log('🔐 [SUBSCRIPTION] Setting up auth-aware subscription for user:', userId);

        // Get user's conversation IDs with auth validation
        const { data: userParticipations, error } = await supabase
          .from('conversation_participants')
          .select('conversation_id')
          .eq('user_id', userId);

        if (error) {
          console.error('❌ [SUBSCRIPTION] Failed to fetch user participations:', error);
          return;
        }

        conversationIds = userParticipations?.map(p => p.conversation_id) || [];
        console.log(`📊 [SUBSCRIPTION] Setting up subscription for ${conversationIds.length} conversations`);

        // Create auth-aware channel
        currentChannel = supabase
          .channel(`auth-aware-conversations-${userId}-${Date.now()}`)
          .on(
            'postgres_changes',
            {
              event: '*',
              schema: 'public',
              table: 'conversation_messages',
              filter: conversationIds.length > 0 ? `conversation_id=in.(${conversationIds.join(',')})` : 'conversation_id=eq.never'
            },
            async (payload) => {
              console.log('📨 [SUBSCRIPTION] Auth-aware message update:', payload);

              // Verify auth before processing update
              try {
                const { data: { session } } = await supabase.auth.getSession();
                if (!session?.user) throw new Error('Not authenticated');

                // Batch invalidation to prevent excessive queries
                setTimeout(() => {
                  queryClient.invalidateQueries({ queryKey: ['optimized-conversations', userId] });
                }, 100);
              } catch (authError) {
                console.warn('🔐 [SUBSCRIPTION] Auth failed during message update, ignoring:', authError);
              }
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
            async (payload) => {
              console.log('👥 [SUBSCRIPTION] Auth-aware participation update:', payload);

              // Verify auth before processing update
              try {
                const { data: { session } } = await supabase.auth.getSession();
                if (!session?.user) throw new Error('Not authenticated');
                queryClient.invalidateQueries({ queryKey: ['optimized-conversations', userId] });
              } catch (authError) {
                console.warn('🔐 [SUBSCRIPTION] Auth failed during participation update, ignoring:', authError);
              }
            }
          )
          .subscribe((status) => {
            console.log('🔗 [SUBSCRIPTION] Channel status:', status);
          });

        // Set up auth state listener to handle session changes
        authListener = supabase.auth.onAuthStateChange(async (event, session) => {
          console.log('🔐 [SUBSCRIPTION] Auth state changed:', event, !!session);

          if (event === 'SIGNED_OUT' || !session) {
            console.log('🔐 [SUBSCRIPTION] User signed out, cleaning up subscription');
            if (currentChannel) {
              await supabase.removeChannel(currentChannel);
              currentChannel = null;
            }
            // Clear cached data
            queryClient.removeQueries({ queryKey: ['optimized-conversations'] });
            queryClient.removeQueries({ queryKey: ['conversation-messages'] });
          } else if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
            console.log('🔐 [SUBSCRIPTION] User signed in/token refreshed, refreshing data');
            // Refresh queries with new session
            queryClient.invalidateQueries({ queryKey: ['optimized-conversations', userId] });
          }
        });

      } catch (error) {
        console.error('❌ [SUBSCRIPTION] Failed to setup auth-aware subscription:', error);
      }
    };

    const cleanup = setupAuthAwareSubscription();

    return () => {
      cleanup.then(() => {
        if (currentChannel) {
          supabase.removeChannel(currentChannel);
        }
        if (authListener) {
          authListener.data?.subscription?.unsubscribe();
        }
      });
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
                last_read_at,
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
                sender:profiles!sender_id (
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
                .select('conversation_id, user_id, joined_at, last_read_at')
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

            // Find current user's participation to get last_read_at
            const currentUserParticipation = conversationParticipants.find((p: any) => p.user_id === userId);
            const lastReadAt = currentUserParticipation?.last_read_at;

            // Calculate unread count
            let unreadCount = 0;
            if (latestMessages) {
              const conversationMessages = latestMessages.filter((m: any) => m.conversation_id === conv.id);
              if (lastReadAt) {
                // Count messages created after last_read_at
                unreadCount = conversationMessages.filter((m: any) =>
                  new Date(m.created_at) > new Date(lastReadAt) && m.sender_id !== userId
                ).length;
              } else {
                // If never read, count all messages not sent by current user
                unreadCount = conversationMessages.filter((m: any) => m.sender_id !== userId).length;
              }
            }

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
                type: lastMessage.message_type as 'text' | 'image' | 'file' | 'audio' | 'video',
                sender: lastMessage.sender
              } : undefined,
              unreadCount: unreadCount,
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
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user) {
          throw new Error('Authentication required');
        }
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

  // Phase 4: Enhanced message sending using secure RPC function
  const sendMessageMutation = useMutation({
    mutationFn: async (params: {
      conversationId: string;
      content: string;
      messageType?: 'text' | 'image' | 'file' | 'audio' | 'video';
      metadata?: Record<string, any>;
      replyToMessageId?: string;
    }) => {
      console.log('📤 [SEND MESSAGE] Starting send process with RPC:', { conversationId: params.conversationId, contentLength: params.content.length, type: params.messageType });

      // Basic validation before calling RPC
      if (!userId) {
        console.error('❌ [SEND MESSAGE] No authenticated user');
        throw new Error('User not authenticated - please log in');
      }

      if (!params.content?.trim()) {
        console.warn('❌ [SEND MESSAGE] Empty content provided');
        throw new Error('Message content cannot be empty');
      }

      console.log('💬 [SEND MESSAGE] Calling send_conversation_message RPC for conversation:', params.conversationId);

      // Use the secure RPC function for message sending
      console.log('💬 [SEND MESSAGE] Calling send_conversation_message RPC for conversation:', params.conversationId);

      const { data: rpcResult, error: rpcError } = await supabase.rpc('send_conversation_message', {
        p_conversation_id: params.conversationId,
        p_content: params.content.trim(),
        p_message_type: params.messageType || 'text',
        p_related_car_id: null,
        p_reply_to_message_id: params.replyToMessageId || null,
        p_metadata: params.metadata || {}
      });

      if (rpcError) {
        console.error('❌ [SEND MESSAGE] RPC error:', rpcError);
        throw new Error(`Failed to send message: ${rpcError.message}`);
      }

      // Check if RPC returned an error in the result
      if (rpcResult && typeof rpcResult === 'object' && 'success' in rpcResult) {
        if (!rpcResult.success) {
          console.error('❌ [SEND MESSAGE] RPC returned error:', rpcResult.error);
          throw new Error(String(rpcResult.error) || 'Failed to send message');
        }

        console.log('✅ [SEND MESSAGE] Message sent successfully via RPC:', rpcResult.message_id);

        return {
          id: rpcResult.message_id,
          conversation_id: rpcResult.conversation_id,
          sender_id: rpcResult.sender_id,
          content: rpcResult.content,
          message_type: rpcResult.message_type,
          metadata: rpcResult.metadata,
          created_at: rpcResult.created_at,
          messageParams: params
        };
      }

      console.log('✅ [SEND MESSAGE] Message sent successfully via RPC');
      return {
        ...(typeof rpcResult === 'object' && rpcResult !== null ? rpcResult : {}),
        messageParams: params
      } as any;
    },
    onSuccess: async (data) => {
      console.log('✅ [CONVERSATIONS] Message sent successfully:', data);
      toast.success('Message sent!');
      // Invalidate both conversations and messages queries
      queryClient.invalidateQueries({ queryKey: ['optimized-conversations', userId] });
      queryClient.invalidateQueries({ queryKey: ['conversation-messages'] });

      // Handle push notifications at application layer
      try {
        const { PushNotificationService } = await import('@/services/pushNotificationService');
        const pushService = PushNotificationService.getInstance();

        // Get conversation participants to send notifications
        const { data: participants } = await supabase
          .from('conversation_participants')
          .select('user_id, profiles(full_name)')
          .eq('conversation_id', data.messageParams.conversationId)
          .neq('user_id', userId); // Exclude sender

        if (participants && participants.length > 0) {
          // Get sender's name from user profile
          const { data: senderProfile } = await supabase
            .from('profiles')
            .select('full_name')
            .eq('id', userId)
            .single();

          const senderName = senderProfile?.full_name || 'Someone';
          const messagePreview = data.messageParams.content.length > 50
            ? data.messageParams.content.substring(0, 50) + '...'
            : data.messageParams.content;

          // Send push notifications to all participants except sender
          for (const participant of participants) {
            await pushService.sendMessageNotification(participant.user_id, {
              senderName,
              messagePreview
            });
          }

          console.log('📱 [PUSH NOTIFICATIONS] Sent to', participants.length, 'participants');
        }
      } catch (pushError) {
        console.error('❌ [PUSH NOTIFICATIONS] Failed to send push notifications:', pushError);
        // Don't throw error - message was sent successfully, push notification is secondary
      }
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
    sendMessage: (params: { conversationId: string; content: string; messageType?: 'text' | 'image' | 'file' | 'audio' | 'video'; metadata?: Record<string, any>; replyToMessageId?: string }) => sendMessageMutation.mutate(params),
    isSendingMessage: sendMessageMutation.isPending,
    sendMessageError: sendMessageMutation.error,
    sendMessageSuccess: sendMessageMutation.isSuccess
  };
};

/**
 * Hook for fetching messages in a specific conversation with auth-aware real-time updates
 * Enhanced with session monitoring and authentication validation
 */
export const useConversationMessages = (conversationId?: string) => {
  const queryClient = useQueryClient();

  // Auth-aware real-time subscription for messages in this conversation
  useEffect(() => {
    if (!conversationId) return;

    let currentChannel: any;
    let authListener: any;

    const setupAuthAwareMessageSubscription = async () => {
      try {
        // Verify authentication before setting up subscription
        const { data: { session } } = await supabase.auth.getSession();

        if (!session?.user) {
          console.log('🔐 [MESSAGE_SUB] Auth check failed, skipping message subscription setup');
          return;
        }

        console.log('🔐 [MESSAGE_SUB] Setting up auth-aware message subscription for conversation:', conversationId);

        currentChannel = supabase
          .channel(`auth-aware-messages-${conversationId}-${Date.now()}`)
          .on(
            'postgres_changes',
            {
              event: '*',
              schema: 'public',
              table: 'conversation_messages',
              filter: `conversation_id=eq.${conversationId}`
            },
            async (payload) => {
              console.log('📨 [MESSAGE_SUB] Auth-aware message update received:', payload);

              // Verify auth before processing message update
              try {
                const { data: { session } } = await supabase.auth.getSession();
                if (!session?.user) throw new Error('Not authenticated');

                queryClient.invalidateQueries({
                  queryKey: ['conversation-messages', conversationId]
                });
              } catch (authError) {
                console.warn('🔐 [MESSAGE_SUB] Auth failed during message update, ignoring:', authError);
              }
            }
          )
          .subscribe((status) => {
            console.log('🔗 [MESSAGE_SUB] Message channel status:', status);
          });

        // Set up auth state listener for message subscription
        authListener = supabase.auth.onAuthStateChange(async (event, session) => {
          console.log('🔐 [MESSAGE_SUB] Auth state changed for messages:', event, !!session);

          if (event === 'SIGNED_OUT' || !session) {
            console.log('🔐 [MESSAGE_SUB] User signed out, cleaning up message subscription');
            if (currentChannel) {
              await supabase.removeChannel(currentChannel);
              currentChannel = null;
            }
            // Clear message cache
            queryClient.removeQueries({ queryKey: ['conversation-messages', conversationId] });
          } else if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
            console.log('🔐 [MESSAGE_SUB] User signed in/token refreshed, refreshing messages');
            // Refresh message queries with new session
            queryClient.invalidateQueries({ queryKey: ['conversation-messages', conversationId] });
          }
        });

      } catch (error) {
        console.error('❌ [MESSAGE_SUB] Failed to setup auth-aware message subscription:', error);
      }
    };

    const cleanup = setupAuthAwareMessageSubscription();

    return () => {
      cleanup.then(() => {
        if (currentChannel) {
          console.log('🧹 [MESSAGE_SUB] Cleaning up message subscription for conversation:', conversationId);
          supabase.removeChannel(currentChannel);
        }
        if (authListener) {
          authListener.data?.subscription?.unsubscribe();
        }
      });
    };
  }, [conversationId, queryClient]);

  return useQuery({
    queryKey: ['conversation-messages', conversationId],
    queryFn: async (): Promise<Message[]> => {
      if (!conversationId) return [];

      // Step 1: Fetch messages without embedding reply_to_message (avoids ambiguous relationship issues)
      const { data, error } = await supabase
        .from('conversation_messages')
        .select(`
          id,
          content,
          sender_id,
          created_at,
          updated_at,
          message_type,
          metadata,
          edited,
          edited_at,
          reply_to_message_id,
          sender:profiles!sender_id (
            id,
            full_name,
            avatar_url
          ),
          message_reactions (
            emoji,
            user_id,
            created_at
          )
        `)
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('❌ [MESSAGES] Error fetching messages:', error);
        throw error;
      }

      // Step 2: Manually fetch parent messages for replies
      // This is necessary because self-referencing embedding in PostgREST can be ambiguous/buggy
      let messagesWithReplies = data || [];

      // Collect unique reply IDs
      const replyIds = [...new Set(messagesWithReplies
        .map((m: any) => m.reply_to_message_id)
        .filter((id: any) => id && typeof id === 'string')
      )];

      if (replyIds.length > 0) {
        console.log(`🔄 [MESSAGES] Fetching ${replyIds.length} parent messages for replies`);

        const { data: parentMessages, error: parentError } = await supabase
          .from('conversation_messages')
          .select(`
            id,
            content,
            sender_id,
            sender:profiles!sender_id (
              full_name
            )
          `)
          .in('id', replyIds);

        if (parentError) {
          console.error('❌ [MESSAGES] Error fetching parent messages:', parentError);
        } else if (parentMessages) {
          // Create a lookup map
          const parentMap = new Map(parentMessages.map(p => [p.id, p]));

          // Attach parent messages to the original messages
          messagesWithReplies = messagesWithReplies.map((m: any) => {
            if (m.reply_to_message_id) {
              return {
                ...m,
                reply_to_message: parentMap.get(m.reply_to_message_id) || null
              };
            }
            return m;
          });
        }
      }

      if (messagesWithReplies.length > 0) {
        const msgWithReply = messagesWithReplies.find((m: any) => m.reply_to_message_id);
        if (msgWithReply) {
          console.log('🔍 [MESSAGES LOG] Detail reply object:', msgWithReply.reply_to_message);
        }
      }

      return messagesWithReplies.map((msg: any): Message => ({
        id: msg.id,
        content: msg.content,
        senderId: msg.sender_id,
        conversationId: conversationId,
        timestamp: new Date(msg.created_at),
        type: msg.message_type || 'text',
        metadata: msg.metadata,
        edited: msg.edited || false,
        editedAt: msg.edited_at ? new Date(msg.edited_at) : undefined,
        sender: msg.sender ? {
          id: msg.sender.id,
          full_name: msg.sender.full_name,
          avatar_url: msg.sender.avatar_url
        } : undefined,
        reactions: msg.message_reactions?.map((r: any) => ({
          emoji: r.emoji,
          userId: r.user_id,
          timestamp: new Date(r.created_at)
        })) || [],
        replyToMessageId: msg.reply_to_message_id,
        replyTo: msg.reply_to_message ? {
          id: msg.reply_to_message.id,
          content: msg.reply_to_message.content,
          sender: {
            id: msg.reply_to_message.sender_id,
            name: msg.reply_to_message.sender?.full_name || 'Unknown User'
          }
        } : undefined
      }));
    },
    enabled: !!conversationId,
    staleTime: 10000, // Cache messages for 10 seconds
    gcTime: 300000, // Keep in cache for 5 minutes
    retry: 2
  });
};

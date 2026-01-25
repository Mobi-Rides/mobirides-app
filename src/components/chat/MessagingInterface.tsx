import { useState, useEffect, useCallback } from 'react';
import { ConversationList } from './ConversationList';
import { ChatWindow } from './ChatWindow';
import { NewConversationModal } from './NewConversationModal';
import { CallInterface } from './CallInterface';
import { VideoCallInterface } from './VideoCallInterface';
import { Conversation, Message, User } from '@/types/message';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useOptimizedConversations, useConversationMessages } from '@/hooks/useOptimizedConversations';
import { useVoiceCall } from '@/hooks/useVoiceCall';
import { useVideoCall } from '@/hooks/useVideoCall';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Loader2, MessageSquare } from 'lucide-react';

interface MessagingInterfaceProps {
  className?: string;
  recipientId?: string;
  recipientName?: string;
  initialCarId?: string;
  initialCarTitle?: string;
}

export function MessagingInterface({ className, recipientId, recipientName, initialCarId, initialCarTitle }: MessagingInterfaceProps) {
  const queryClient = useQueryClient();
  console.log("MessagingInterface: Loading with", { recipientId, recipientName, initialCarId });

  // Phase 1: Authentication state management
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);

  // Fetch the current user from Supabase with proper error handling
  useEffect(() => {
    const fetchCurrentUser = async () => {
      console.log("👤 [MESSAGING] Fetching current user");
      setAuthLoading(true);
      setAuthError(null);

      try {
        const userStart = Date.now();
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        console.log(`⏱️[MESSAGING] User fetch took ${Date.now() - userStart}ms`);

        if (userError) {
          console.error('❌ [MESSAGING] Auth error:', userError);
          setAuthError('Authentication failed');
          setAuthLoading(false);
          return;
        }

        if (user) {
          console.log(`✅ [MESSAGING] User found: ${user.id}`);

          // Fetch user profile data with error handling
          const { data: profileData, error: profileError } = await supabase
            .from('profiles')
            .select('full_name, avatar_url, role')
            .eq('id', user.id)
            .maybeSingle();

          if (profileError) {
            console.warn('⚠️ [MESSAGING] Profile fetch error:', profileError);
          }

          const newUser: User = {
            id: user.id,
            name: profileData?.full_name || user.email?.split('@')[0] || 'You',
            avatar: profileData?.avatar_url ?
              supabase.storage.from('avatars').getPublicUrl(profileData.avatar_url).data.publicUrl :
              'https://i.pravatar.cc/150?img=32',
            status: 'online' as const,
            role: (profileData?.role as 'host' | 'renter' | 'admin' | 'super_admin') || 'renter'
          };

          console.log("👤 [MESSAGING] Setting current user:", newUser.id, newUser.name);
          setCurrentUser(newUser);
        } else {
          console.warn("⚠️ [MESSAGING] No user found in auth");
          setAuthError('No authenticated user');
        }
      } catch (error) {
        console.error('❌ [MESSAGING] Error fetching current user:', error);
        setAuthError('Failed to load user data');
      } finally {
        setAuthLoading(false);
      }
    };

    fetchCurrentUser();
  }, []);

  // Phase 1: Only initialize conversations hook after auth is complete
  const {
    conversations,
    isLoading: conversationsLoading,
    createConversation,
    isCreatingConversation,
    sendMessage,
    isSendingMessage,
    sendMessageError,
    sendMessageSuccess
  } = useOptimizedConversations(currentUser?.id); // Pass user ID to hook

  const [selectedConversationId, setSelectedConversationId] = useState<string | undefined>();

  console.log("🖥️ [MESSAGING] Hook state", {
    conversationsCount: Array.isArray(conversations) ? conversations.length : 0,
    conversationsLoading,
    hasConversations: Array.isArray(conversations),
    selectedConversationId,
    currentUserId: currentUser?.id,
    authLoading
  });

  // Get messages for selected conversation using the stable hook
  const { data: messages = [], isLoading: isLoadingMessages, error: messagesError } = useConversationMessages(selectedConversationId);
  const [searchTerm, setSearchTerm] = useState('');
  const [isNewConversationDialogOpen, setIsNewConversationDialogOpen] = useState(false);

  // Update last_read_at when conversation is selected or new messages arrive
  useEffect(() => {
    if (selectedConversationId && currentUser?.id) {
      const updateLastReadAt = async () => {
        try {
          console.log("📖 [READ_TRACKING] Updating last_read_at for conversation:", selectedConversationId);

          // Calculate the correct timestamp to avoid clock skew issues
          let newLastReadAt = new Date().toISOString();
          
          if (messages && messages.length > 0) {
            const lastMessage = messages[messages.length - 1];
            // Use the message's created_at if available to ensure we mark up to this specific message as read
            // This handles cases where client clock is behind server clock
            if (lastMessage.created_at) {
              newLastReadAt = lastMessage.created_at;
            } else if (lastMessage.timestamp) {
              newLastReadAt = lastMessage.timestamp.toISOString();
            }
          }

          // Optimistic updates to UI before DB confirmation
          if (currentUser?.id) {
            // Cancel any in-flight queries to prevent overwriting optimistic updates
            await queryClient.cancelQueries({ queryKey: ['unreadMessagesCount'] });
            await queryClient.cancelQueries({ queryKey: ['optimized-conversations', currentUser.id] });

            // 1. Update global unread count
            const previousConversations = queryClient.getQueryData<Conversation[]>(['optimized-conversations', currentUser.id]);
            const conversation = previousConversations?.find(c => c.id === selectedConversationId);
            
            if (conversation && conversation.unreadCount > 0) {
              const unreadToSubtract = conversation.unreadCount;
              console.log(`📉 [READ_TRACKING] Optimistically subtracting ${unreadToSubtract} from unread count`);

              queryClient.setQueryData(['unreadMessagesCount'], (old: number | undefined) => {
                return Math.max(0, (old || 0) - unreadToSubtract);
              });

              // 2. Update conversation list unread count
              queryClient.setQueryData(['optimized-conversations', currentUser.id], (old: Conversation[] | undefined) => {
                if (!old) return old;
                return old.map(c => c.id === selectedConversationId ? { ...c, unreadCount: 0 } : c);
              });
            }
          }

          const { error } = await supabase
            .from('conversation_participants')
            .update({ last_read_at: newLastReadAt })
            .eq('conversation_id', selectedConversationId)
            .eq('user_id', currentUser.id);

          if (error) {
            console.error("❌ [READ_TRACKING] Error updating last_read_at:", error);
            // Revert optimistic updates if needed (optional, or just invalidate)
            queryClient.invalidateQueries({ queryKey: ['unreadMessagesCount'] });
            queryClient.invalidateQueries({ queryKey: ['optimized-conversations'] });
          } else {
            console.log("✅ [READ_TRACKING] Successfully updated last_read_at");
            // Force refresh of unread count and conversation list to ensure eventual consistency
            queryClient.invalidateQueries({ queryKey: ['unreadMessagesCount'] });
            queryClient.invalidateQueries({ queryKey: ['optimized-conversations'] });
          }
        } catch (error) {
          console.error("❌ [READ_TRACKING] Error in updateLastReadAt:", error);
        }
      };

      updateLastReadAt();
    }
  }, [selectedConversationId, currentUser?.id, messages?.length, queryClient]);

  // Memoize the createConversation function to prevent infinite loops
  const handleCreateConversation = useCallback((params: { participantIds: string[], title?: string }) => {
    if (!isCreatingConversation) {
      createConversation(params);
    }
  }, [createConversation, isCreatingConversation]);

  // Debounced conversation creation to prevent spam
  const [creationAttempts, setCreationAttempts] = useState(new Map<string, number>());

  // Handle recipient-based conversation creation/selection
  useEffect(() => {
    try {
      console.log("MessagingInterface: recipientId=", recipientId, "recipientName=", recipientName, "currentUser.id=", currentUser?.id);

      if (recipientId && recipientName && currentUser?.id && !conversationsLoading) {
        console.log("MessagingInterface: Processing recipient data, looking for existing conversation");

        const existingConversation = Array.isArray(conversations) ? conversations.find(conv =>
          conv?.type === 'direct' &&
          Array.isArray(conv?.participants) &&
          conv.participants.length === 2 &&
          conv.participants.some(p => p?.id === recipientId) &&
          conv.participants.some(p => p?.id === currentUser.id)
        ) : null;

        console.log("MessagingInterface: Existing conversation found:", existingConversation);

        if (existingConversation) {
          console.log("MessagingInterface: Selecting existing conversation:", existingConversation.id);
          setSelectedConversationId(existingConversation.id);
          // Clear any creation attempts for this recipient
          setCreationAttempts(prev => {
            const updated = new Map(prev);
            updated.delete(recipientId);
            return updated;
          });
        } else if (!isCreatingConversation) {
          // Circuit breaker: limit creation attempts per recipient
          const attempts = creationAttempts.get(recipientId) || 0;
          if (attempts < 3) {
            console.log("MessagingInterface: Creating new conversation with:", { participantIds: [recipientId], title: recipientName });
            setCreationAttempts(prev => {
              const updated = new Map(prev);
              updated.set(recipientId, attempts + 1);
              return updated;
            });
            handleCreateConversation({
              participantIds: [recipientId]
              // Don't set title for direct conversations - let UI determine display name
            });
          } else {
            console.warn("MessagingInterface: Max creation attempts reached for recipient:", recipientId);
          }
        }
      }
    } catch (error) {
      console.error("MessagingInterface: Error in recipient handling:", error);
    }
  }, [recipientId, recipientName, conversations, currentUser?.id, conversationsLoading, isCreatingConversation]);

  const selectedConversation = Array.isArray(conversations) ? conversations.find(c => c.id === selectedConversationId) : undefined;

  // Generate initial message if coming from car details
  const initialMessage = (initialCarTitle && recipientId && selectedConversation?.participants.some(p => p.id === recipientId))
    ? `Hi, I'm interested in your ${initialCarTitle}. Is it available?`
    : undefined;

  const handleSendMessage = useCallback((content: string, type: 'text' | 'image' | 'file' | 'audio' | 'video' = 'text', metadata: any = {}, replyToMessageId?: string) => {
    if (selectedConversationId && content.trim()) {
      console.log('Sending message:', { conversationId: selectedConversationId, content, type, replyToMessageId });
      sendMessage({
        conversationId: selectedConversationId,
        content: content.trim(),
        messageType: type,
        metadata,
        replyToMessageId
      });
    } else {
      console.warn('Cannot send message:', { selectedConversationId, hasContent: !!content.trim() });
    }
  }, [selectedConversationId, sendMessage]);

  const handleNewConversation = () => {
    setIsNewConversationDialogOpen(true);
  };

  const handleStartConversation = async (participant: User) => {
    try {
      handleCreateConversation({
        participantIds: [participant.id]
      });
      setIsNewConversationDialogOpen(false);
    } catch (error) {
      console.error('Error creating conversation:', error);
    }
  };

  const handleReactToMessage = useCallback(async (messageId: string, emoji: string) => {
    if (!currentUser) {
      console.warn('Cannot react: No current user');
      return;
    }

    try {
      // Optimistic update
      const message = messages.find(m => m.id === messageId);
      const existingReaction = message?.reactions?.find(r => r.userId === currentUser.id && r.emoji === emoji);

      console.log('Reacting to message:', { messageId, emoji, userId: currentUser.id, existingReaction });

      if (existingReaction) {
        // Remove reaction
        const { error } = await supabase
          .from('message_reactions')
          .delete()
          .eq('message_id', messageId)
          .eq('user_id', currentUser.id)
          .eq('emoji', emoji);

        if (error) throw error;
      } else {
        // Add reaction
        const { error } = await supabase
          .from('message_reactions')
          .insert({
            message_id: messageId,
            user_id: currentUser.id,
            emoji: emoji
          });

        if (error) throw error;
      }

      // Invalidate cache to trigger re-fetch and show the updated reactions
      queryClient.invalidateQueries({ queryKey: ['conversation-messages', selectedConversationId] });

    } catch (error) {
      console.error('Error handling reaction:', error);
      toast.error('Failed to update reaction');
    }
  }, [currentUser, messages, queryClient, selectedConversationId]);

  // Voice Call logic
  const {
    callStatus,
    caller,
    isMuted,
    startCall,
    acceptCall,
    endCall,
    toggleMute
  } = useVoiceCall({ currentUserId: currentUser?.id });

  const handleStartCall = () => {
    if (selectedConversation) {
      // Find other participant
      const otherParticipant = selectedConversation.type === 'direct'
        ? selectedConversation.participants.find(p => p.id !== currentUser?.id)
        : null; // Group calls not supported yet

      if (otherParticipant) {
        startCall(otherParticipant.id, otherParticipant.name || 'User', otherParticipant.avatar);
      } else {
        toast.error('Cannot call this user');
      }
    }
  };

  // Video Call logic
  const {
    callStatus: videoCallStatus,
    caller: videoCaller,
    isMuted: isVideoMuted,
    isCameraOff,
    startCall: startVideoCall,
    acceptCall: acceptVideoCall,
    endCall: endVideoCall,
    toggleMute: toggleVideoMute,
    toggleCamera,
    setLocalVideoElement,
    setRemoteVideoElement
  } = useVideoCall({ currentUserId: currentUser?.id });

  const handleStartVideoCall = () => {
    if (selectedConversation) {
      // Find other participant
      const otherParticipant = selectedConversation.type === 'direct'
        ? selectedConversation.participants.find(p => p.id !== currentUser?.id)
        : null; // Group calls not supported yet

      if (otherParticipant) {
        startVideoCall(otherParticipant.id, otherParticipant.name || 'User', otherParticipant.avatar);
      } else {
        toast.error('Cannot video call this user');
      }
    }
  };

  // Phase 1: Show loading state while authentication is in progress
  if (authLoading || !currentUser) {
    console.log("🔄 [MESSAGING] Showing loading state - authentication in progress");
    return (
      <div className={cn("flex items-center justify-center h-full bg-card rounded-lg border border-notification-border", className)}>
        <div className="text-center p-8">
          <Loader2 className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4" />
          <div className="text-muted-foreground">
            {authError ? `Error: ${authError}` : 'Loading conversations...'}
          </div>
          {authError && (
            <button
              onClick={() => window.location.reload()}
              className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
            >
              Retry
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={cn("flex h-[calc(100vh-4rem)] bg-background overflow-hidden relative", className)}>
      {/* Voice Call Interface Overlay */}
      <CallInterface
        status={callStatus}
        callerName={caller?.name}
        callerAvatar={caller?.avatar}
        isMuted={isMuted}
        onAccept={acceptCall}
        onDecline={() => endCall(true)}
        onEnd={() => endCall(true)}
        onToggleMute={toggleMute}
      />

      {/* Video Call Interface Overlay */}
      <VideoCallInterface
        status={videoCallStatus}
        callerName={videoCaller?.name}
        callerAvatar={videoCaller?.avatar}
        isMuted={isVideoMuted}
        isCameraOff={isCameraOff}
        onAccept={acceptVideoCall}
        onDecline={() => endVideoCall(true)}
        onEnd={() => endVideoCall(true)}
        onToggleMute={toggleVideoMute}
        onToggleCamera={toggleCamera}
        setLocalVideoElement={setLocalVideoElement}
        setRemoteVideoElement={setRemoteVideoElement}
      />

      {/* Sidebar - Conversation List */}
      <div className={cn(
        "w-full md:w-80 lg:w-96 border-r border-notification-border bg-card flex flex-col transition-all duration-300 ease-in-out absolute md:relative z-10 h-full",
        selectedConversationId ? "max-md:-translate-x-full" : "translate-x-0"
      )}>
        <ConversationList
          conversations={Array.isArray(conversations) ? conversations : []}
          selectedConversationId={selectedConversationId}
          currentUser={currentUser}
          onSelectConversation={setSelectedConversationId}
          onNewConversation={handleNewConversation}
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
        />
      </div>

      {/* Main Chat Area */}
      <div className={cn(
        "flex-1 flex flex-col bg-background transition-all duration-300 ease-in-out absolute md:relative w-full h-full",
        selectedConversationId ? "translate-x-0" : "max-md:translate-x-full"
      )}>
        {selectedConversation ? (
          <ChatWindow
            conversation={selectedConversation}
            messages={Array.isArray(messages) ? messages : []}
            currentUser={currentUser}
            typingUsers={[]} // Placeholder until real typing logic is hooked up if available
            onSendMessage={handleSendMessage}
            onReactToMessage={handleReactToMessage}
            isLoading={isSendingMessage}
            onBack={() => setSelectedConversationId(undefined)}
            onStartCall={handleStartCall}
            onStartVideoCall={handleStartVideoCall}
            initialMessage={initialMessage}
          />
        ) : (
          <div className="hidden md:flex flex-col items-center justify-center h-full text-muted-foreground">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
              <MessageSquare className="w-8 h-8 text-primary" />
            </div>
            <p className="text-lg font-medium">Select a conversation to start messaging</p>
          </div>
        )}
      </div>

      {/* New Conversation Dialog */}
      <NewConversationModal
        isOpen={isNewConversationDialogOpen}
        onClose={() => setIsNewConversationDialogOpen(false)}
        onStartConversation={handleStartConversation}
        currentUser={currentUser}
      />
    </div>
  );
}
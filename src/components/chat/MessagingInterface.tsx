import { useState, useEffect, useCallback } from 'react';
import { ConversationList } from './ConversationList';
import { ChatWindow } from './ChatWindow';
import { NewConversationModal } from './NewConversationModal';
import { Button } from '@/components/ui/button';
import { Conversation, Message, User } from '@/types/message';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useOptimizedConversations, useConversationMessages } from '@/hooks/useOptimizedConversations';

interface MessagingInterfaceProps {
  className?: string;
  recipientId?: string;
  recipientName?: string;
}

export function MessagingInterface({ className, recipientId, recipientName }: MessagingInterfaceProps) {
  console.log("MessagingInterface: Loading with", { recipientId, recipientName });
  
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
        console.log(`⏱️ [MESSAGING] User fetch took ${Date.now() - userStart}ms`);
        
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
  const [isNewConversationModalOpen, setIsNewConversationModalOpen] = useState(false);

  // Update last_read_at when conversation is selected
  useEffect(() => {
    if (selectedConversationId && currentUser?.id) {
      const updateLastReadAt = async () => {
        try {
          console.log("📖 [READ_TRACKING] Updating last_read_at for conversation:", selectedConversationId);
          
          const { error } = await supabase
            .from('conversation_participants')
            .update({ last_read_at: new Date().toISOString() })
            .eq('conversation_id', selectedConversationId)
            .eq('user_id', currentUser.id);

          if (error) {
            console.error("❌ [READ_TRACKING] Error updating last_read_at:", error);
          } else {
            console.log("✅ [READ_TRACKING] Successfully updated last_read_at");
          }
        } catch (error) {
          console.error("❌ [READ_TRACKING] Error in updateLastReadAt:", error);
        }
      };

      updateLastReadAt();
    }
  }, [selectedConversationId, currentUser?.id]);

  // Removed auto-select: Users should see conversation list first and choose which to open
  // Recipient-based selection (from car details, bookings, etc.) still works via the useEffect below

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
      console.log("MessagingInterface: recipientId=", recipientId, "recipientName=", recipientName, "currentUser.id=", currentUser.id);
      
      if (recipientId && recipientName && currentUser?.id && !conversationsLoading) {
        console.log("MessagingInterface: Processing recipient data, looking for existing conversation");
        console.log("MessagingInterface: Current conversations:", Array.isArray(conversations) ? conversations.length : 'not array');
        
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
      } else {
        console.log("MessagingInterface: Missing required data, user not loaded, or conversations loading");
      }
    } catch (error) {
      console.error("MessagingInterface: Error in recipient handling:", error);
    }
  }, [recipientId, recipientName, conversations, currentUser?.id, conversationsLoading, isCreatingConversation]);

  const filteredConversations = Array.isArray(conversations) ? conversations.filter(conv => {
    if (!conv) return false;
    const title = conv.title || (Array.isArray(conv.participants) ? conv.participants : [])
      .filter(p => p?.id !== currentUser?.id)
      .map(p => p?.name || 'Unknown')
      .join(', ');
    
    return title.toLowerCase().includes(searchTerm.toLowerCase()) ||
           (conv.lastMessage?.content && conv.lastMessage.content.toLowerCase().includes(searchTerm.toLowerCase()));
  }) : [];

  const selectedConversation = filteredConversations.find(c => c.id === selectedConversationId);
  

  const handleSendMessage = useCallback((content: string) => {
    if (selectedConversationId && content.trim()) {
      console.log('Sending message:', { conversationId: selectedConversationId, content });
      sendMessage({
        conversationId: selectedConversationId,
        content: content.trim(),
        messageType: 'text'
      });
    } else {
      console.warn('Cannot send message:', { selectedConversationId, hasContent: !!content.trim() });
    }
  }, [selectedConversationId, sendMessage]);

  const handleNewConversation = () => {
    setIsNewConversationModalOpen(true);
  };

  const handleStartConversation = async (participant: User) => {
    try {
      handleCreateConversation({ 
        participantIds: [participant.id]
        // Don't set title for direct conversations - let UI determine display name
      });
      setIsNewConversationModalOpen(false);
    } catch (error) {
      console.error('Error creating conversation:', error);
    }
  };

  // Phase 1: Show loading state while authentication is in progress
  if (authLoading || !currentUser) {
    console.log("🔄 [MESSAGING] Showing loading state - authentication in progress");
    return (
      <div className={cn("flex items-center justify-center h-full bg-card rounded-lg border border-notification-border", className)}>
        <div className="text-center p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
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

    console.log("🎯 [MESSAGING] Rendering interface", {
      conversationsLoading,
      filteredConversationsCount: filteredConversations.length,
      selectedConversationId,
      currentUserId: currentUser.id,
      messagesCount: Array.isArray(messages) ? messages.length : 0
    });

  return (
    <div className={cn("flex flex-col h-full bg-card rounded-lg border border-notification-border overflow-hidden", className)}>
      <div className="flex flex-1 overflow-hidden">
        {/* Conversation List */}
        <div className={cn(
          "w-full md:w-80 flex-shrink-0 transition-all duration-300",
          selectedConversationId ? "max-md:hidden" : ""
        )}>
          <ConversationList
            conversations={filteredConversations}
            selectedConversationId={selectedConversationId}
            currentUser={currentUser}
            onSelectConversation={setSelectedConversationId}
            onNewConversation={handleNewConversation}
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
          />
        </div>

      {/* Chat Window */}
      <div className={cn(
        "flex-1 transition-all duration-300",
        selectedConversationId ? "" : "max-md:hidden"
      )}>
        {selectedConversation ? (
          <ChatWindow
            conversation={selectedConversation}
            messages={Array.isArray(messages) ? messages : []}
            currentUser={currentUser}
            typingUsers={[]}
            onSendMessage={handleSendMessage}
            isLoading={isSendingMessage}
            onBack={() => setSelectedConversationId(undefined)}
          />
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-8 h-8 text-primary"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">No conversation selected</h3>
              <p className="text-muted-foreground">Choose a conversation to start messaging</p>
            </div>
          </div>
        )}
        </div>
      </div>

      {/* New Conversation Modal */}
      <NewConversationModal
        isOpen={isNewConversationModalOpen}
        onClose={() => setIsNewConversationModalOpen(false)}
        onStartConversation={handleStartConversation}
        currentUser={currentUser}
      />
    </div>
  );
}
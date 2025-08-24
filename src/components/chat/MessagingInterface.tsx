import { useState, useEffect, useCallback } from 'react';
import { ConversationList } from './ConversationList';
import { ChatWindow } from './ChatWindow';
import { NewConversationModal } from './NewConversationModal';
import { MigrationStatusBanner } from './MigrationStatusBanner';
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
  
  const {
    conversations,
    isLoading: conversationsLoading,
    createConversation,
    isCreatingConversation,
    sendMessage,
    isSendingMessage,
    sendMessageError,
    sendMessageSuccess
  } = useOptimizedConversations();
  
  const [selectedConversationId, setSelectedConversationId] = useState<string | undefined>();
  
  console.log("🖥️ [MESSAGING] Hook state", { 
    conversationsCount: conversations?.length || 0, 
    conversationsLoading,
    hasConversations: Array.isArray(conversations),
    selectedConversationId
  });
  
  // Get messages for selected conversation using the stable hook
  const { data: messages = [], isLoading: isLoadingMessages, error: messagesError } = useConversationMessages(selectedConversationId);
  const [searchTerm, setSearchTerm] = useState('');
  const [isNewConversationModalOpen, setIsNewConversationModalOpen] = useState(false);
  
  // Use a placeholder user initially, will be updated with real user data
  const [currentUser, setCurrentUser] = useState<User>({
    id: 'user-1',
    name: 'You',
    avatar: 'https://i.pravatar.cc/150?img=32',
    status: 'online',
  });
  
  // Fetch the current user from Supabase
  useEffect(() => {
    const fetchCurrentUser = async () => {
      console.log("👤 [MESSAGING] Fetching current user");
      try {
        const userStart = Date.now();
        const { data: { user } } = await supabase.auth.getUser();
        console.log(`⏱️ [MESSAGING] User fetch took ${Date.now() - userStart}ms`);
        
        if (user) {
          console.log(`✅ [MESSAGING] User found: ${user.id}`);
          // Fetch user profile data
          const { data: profileData } = await supabase
            .from('profiles')
            .select('full_name, avatar_url')
            .eq('id', user.id)
            .single();
          
          const newUser = {
            id: user.id,
            name: profileData?.full_name || user.email?.split('@')[0] || 'You',
            avatar: profileData?.avatar_url ? 
              supabase.storage.from('avatars').getPublicUrl(profileData.avatar_url).data.publicUrl : 
              'https://i.pravatar.cc/150?img=32',
            status: 'online' as const,
          };
          
          console.log("👤 [MESSAGING] Setting current user:", newUser.id, newUser.name);
          setCurrentUser(newUser);
        } else {
          console.warn("⚠️ [MESSAGING] No user found in auth");
        }
      } catch (error) {
        console.error('❌ [MESSAGING] Error fetching current user:', error);
      }
    };
    
    fetchCurrentUser();
  }, []);

  // Auto-select first conversation if none selected
  useEffect(() => {
    try {
      console.log("🔄 [MESSAGING] Auto-select effect triggered", {
        selectedConversationId,
        conversationsLength: conversations?.length,
        conversationsLoading,
        isArray: Array.isArray(conversations)
      });
      
      if (!selectedConversationId && Array.isArray(conversations) && conversations.length > 0 && !conversationsLoading) {
        console.log("✅ [MESSAGING] Auto-selecting first conversation:", conversations[0]?.id);
        setSelectedConversationId(conversations[0]?.id);
      } else {
        console.log("⏸️ [MESSAGING] Auto-select conditions not met");
      }
    } catch (error) {
      console.error("❌ [MESSAGING] Error in auto-select:", error);
    }
  }, [conversations, selectedConversationId, conversationsLoading]);

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
      
      if (recipientId && recipientName && currentUser?.id && currentUser.id !== 'user-1' && !conversationsLoading) {
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
            participantIds: [recipientId], 
            title: recipientName 
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
        type: 'text'
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
        participantIds: [participant.id], 
        title: participant.name 
      });
      setIsNewConversationModalOpen(false);
    } catch (error) {
      console.error('Error creating conversation:', error);
    }
  };

  // Show loading state
  if (conversationsLoading && currentUser.id === 'user-1') {
    console.log("🔄 [MESSAGING] Showing loading state - user not loaded yet");
    return (
      <div className={cn("flex items-center justify-center h-full bg-card rounded-lg border border-notification-border", className)}>
        <div className="text-center p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <div className="text-muted-foreground">Loading conversations...</div>
        </div>
      </div>
    );
  }

  console.log("🎯 [MESSAGING] Rendering interface", {
    conversationsLoading,
    filteredConversationsCount: filteredConversations.length,
    selectedConversationId,
    currentUserId: currentUser.id,
    messagesCount: messages?.length || 0
  });

  return (
    <div className={cn("flex flex-col h-full bg-card rounded-lg border border-notification-border overflow-hidden", className)}>
      {/* Migration Status Banner */}
      <MigrationStatusBanner />
      
      <div className="flex flex-1 overflow-hidden">
        {/* Conversation List */}
        <div className="w-80 flex-shrink-0">
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
      <div className="flex-1">
        {selectedConversation ? (
          <ChatWindow
            conversation={selectedConversation}
            messages={messages || []}
            currentUser={currentUser}
            typingUsers={[]}
            onSendMessage={handleSendMessage}
            isLoading={isSendingMessage}
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
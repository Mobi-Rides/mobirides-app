import { useState, useEffect } from 'react';
import { ConversationList } from './ConversationList';
import { ChatWindow } from './ChatWindow';
import { NewConversationModal } from './NewConversationModal';
import { Conversation, Message, User } from '@/types/message';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useConversations } from '@/hooks/useConversations';
import { useConversationMessages } from '@/hooks/useConversationMessages';

interface MessagingInterfaceProps {
  className?: string;
  recipientId?: string;
  recipientName?: string;
}

export function MessagingInterface({ className, recipientId, recipientName }: MessagingInterfaceProps) {
  const { conversations, isLoading: conversationsLoading, createConversation } = useConversations();
  const [selectedConversationId, setSelectedConversationId] = useState<string | undefined>();
  const { messages, sendMessage, isSendingMessage } = useConversationMessages(selectedConversationId);
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
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          // Fetch user profile data
          const { data: profileData } = await supabase
            .from('profiles')
            .select('full_name, avatar_url')
            .eq('id', user.id)
            .single();
          
          setCurrentUser({
            id: user.id,
            name: profileData?.full_name || user.email?.split('@')[0] || 'You',
            avatar: profileData?.avatar_url ? 
              supabase.storage.from('avatars').getPublicUrl(profileData.avatar_url).data.publicUrl : 
              'https://i.pravatar.cc/150?img=32',
            status: 'online',
          });
        }
      } catch (error) {
        console.error('Error fetching current user:', error);
      }
    };
    
    fetchCurrentUser();
  }, []);

  // Auto-select first conversation if none selected
  useEffect(() => {
    if (!selectedConversationId && conversations.length > 0) {
      setSelectedConversationId(conversations[0].id);
    }
  }, [conversations, selectedConversationId]);

  // Handle recipient-based conversation creation/selection
  useEffect(() => {
    if (recipientId && recipientName && currentUser.id !== 'user-1') {
      const existingConversation = conversations.find(conv => 
        conv.participants.some(p => p.id === recipientId)
      );
      
      if (existingConversation) {
        setSelectedConversationId(existingConversation.id);
      } else {
        // Create new conversation
        createConversation({ 
          participantIds: [recipientId], 
          title: recipientName 
        });
      }
    }
  }, [recipientId, recipientName, conversations, currentUser.id, createConversation]);

  const filteredConversations = conversations.filter(conv => {
    const title = conv.title || conv.participants
      .filter(p => p.id !== currentUser.id)
      .map(p => p.name)
      .join(', ');
    
    return title.toLowerCase().includes(searchTerm.toLowerCase()) ||
           (conv.lastMessage && conv.lastMessage.content.toLowerCase().includes(searchTerm.toLowerCase()));
  });

  const selectedConversation = filteredConversations.find(c => c.id === selectedConversationId);

  const handleSendMessage = (content: string) => {
    if (selectedConversationId) {
      sendMessage({ content });
    }
  };

  const handleNewConversation = () => {
    setIsNewConversationModalOpen(true);
  };

  const handleStartConversation = async (participant: User) => {
    try {
      await createConversation({ 
        participantIds: [participant.id], 
        title: participant.name 
      });
      setIsNewConversationModalOpen(false);
    } catch (error) {
      console.error('Error creating conversation:', error);
    }
  };

  return (
    <div className={cn("flex h-full bg-card rounded-lg border border-notification-border overflow-hidden", className)}>
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
            messages={messages}
            currentUser={currentUser}
            typingUsers={[]} // Will be implemented with real-time features
            onSendMessage={handleSendMessage}
            onEditMessage={(messageId) => console.log('Edit message:', messageId)}
            onDeleteMessage={(messageId) => console.log('Delete message:', messageId)}
            onReactToMessage={(messageId, emoji) => console.log('React to message:', messageId, emoji)}
            onStartTyping={() => console.log('Start typing')}
            onStopTyping={() => console.log('Stop typing')}
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
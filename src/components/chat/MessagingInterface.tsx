import { useState, useEffect, useCallback } from 'react';
import { ConversationList } from './ConversationList';
import { ChatWindow } from './ChatWindow';
import { NewConversationModal } from './NewConversationModal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Conversation, Message, User } from '@/types/message';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useOptimizedConversations, useConversationMessages } from '@/hooks/useOptimizedConversations';
import { useIsMobile } from '@/hooks/use-mobile';
import { formatDistanceToNow } from 'date-fns';
import { 
  Search, 
  Plus, 
  MessageCircle,
  Users,
  ArrowLeft
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

interface MessagingInterfaceProps {
  className?: string;
  recipientId?: string;
  recipientName?: string;
}

export function MessagingInterface({ className, recipientId, recipientName }: MessagingInterfaceProps) {
  console.log("MessagingInterface: Loading with", { recipientId, recipientName });
  
  // Phase 1: Authentication state management
  const { user: authUser, isLoading: authLoading } = useAuth();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);
  
  // Mobile state management
  const isMobile = useIsMobile();
  const [showConversationList, setShowConversationList] = useState(true);
  const [selectedConversationId, setSelectedConversationId] = useState<string | undefined>();
  
  // Auto-hide conversation list on mobile when a conversation is selected
  useEffect(() => {
    if (isMobile && selectedConversationId) {
      setShowConversationList(false);
    }
  }, [isMobile, selectedConversationId]);
  
  // Reset to conversation list view when switching to mobile
  useEffect(() => {
    if (isMobile && !selectedConversationId) {
      setShowConversationList(true);
    }
  }, [isMobile, selectedConversationId]);

  // Derive currentUser from AuthProvider and fetch profile data
  useEffect(() => {
    const applyAuthUser = async () => {
      try {
        setAuthError(null);
        if (authUser) {
          const { data: profileData, error: profileError } = await supabase
            .from('profiles')
            .select('full_name, avatar_url')
            .eq('id', authUser.id)
            .maybeSingle();

          if (profileError) {
            console.warn('⚠️ [MESSAGING] Profile fetch error:', profileError);
          }

          const newUser: User = {
            id: authUser.id,
            name: profileData?.full_name || authUser.email?.split('@')[0] || 'You',
            avatar: profileData?.avatar_url ? 
              supabase.storage.from('avatars').getPublicUrl(profileData.avatar_url).data.publicUrl : 
              'https://i.pravatar.cc/150?img=32',
            status: 'online' as const,
          };

          setCurrentUser(newUser);
        } else if (!authLoading) {
          console.warn('⚠️ [MESSAGING] No authenticated user');
          setAuthError('No authenticated user');
          setCurrentUser(null);
        }
      } catch (error) {
        console.error('❌ [MESSAGING] Error applying auth user:', error);
        setAuthError('Failed to load user data');
      }
    };

    applyAuthUser();
  }, [authUser, authLoading]);

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

  // Auto-select first conversation if none selected
  useEffect(() => {
    try {
      console.log("🔄 [MESSAGING] Auto-select effect triggered", {
        selectedConversationId,
        conversationsLength: Array.isArray(conversations) ? conversations.length : 0,
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
      console.log("MessagingInterface: recipientId=", recipientId, "recipientName=", recipientName, "currentUser.id=", currentUser?.id);
      
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
  }, [recipientId, recipientName, conversations, currentUser?.id, conversationsLoading, isCreatingConversation, creationAttempts, handleCreateConversation]);

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

  // Search term change handler
  const handleSearchChange = useCallback((value: string) => {
    setSearchTerm(value);
  }, []);

  const handleNewConversation = () => {
    setIsNewConversationModalOpen(true);
  };

  // Mobile navigation functions
  const handleSelectConversation = (conversationId: string) => {
    setSelectedConversationId(conversationId);
    if (isMobile) {
      setShowConversationList(false); // Hide list, show chat on mobile
    }
  };

  const handleBackToList = () => {
    if (isMobile) {
      setShowConversationList(true); // Show list, hide chat on mobile
    }
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
    <div className={cn("flex h-full bg-background overflow-hidden", className)}>
      {/* WhatsApp-style side-by-side layout */}
      <div className="flex flex-1 h-full">
        {/* Conversation List Panel - WhatsApp left sidebar style */}
        {(!isMobile || showConversationList) && (
          <div className={cn(
            "flex flex-col bg-card border-r border-border transition-all duration-300 ease-in-out min-h-0",
            isMobile ? "w-full h-full" : "w-80 min-w-80 max-w-80",
            "shadow-sm"
          )}>
            {/* Fixed Header */}
            <div className="sticky top-0 z-30 p-4 border-b border-border bg-card/95 backdrop-blur-sm">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  {/* Back Button - Only visible on mobile */}
                  {isMobile && (
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="mr-1 bg-primary/5 hover:bg-primary/10 rounded-full transition-all duration-200 ease-in-out"
                      onClick={handleBackToList}
                    >
                      <ArrowLeft className="h-5 w-5 text-primary" />
                    </Button>
                  )}
                  <h2 className="text-lg font-semibold text-foreground">Messages</h2>
                </div>
                <Button
                  size="sm"
                  onClick={handleNewConversation}
                  className="h-8 w-8 p-0 bg-primary/10 hover:bg-primary/20 text-primary"
                  variant="ghost"
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
              
              {/* Search Bar */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search conversations..."
                  value={searchTerm}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  className="pl-9 bg-muted/50 border-muted-foreground/20 focus:bg-background transition-colors"
                />
              </div>
            </div>

            {/* Scrollable Conversations List */}
            <div className="flex-1 min-h-0 overflow-hidden">
              <ScrollArea className="h-full scroll-smooth">
                <div className="p-2 space-y-1">
                  {filteredConversations.length === 0 ? (
                    <div className="text-center py-12">
                      <MessageCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                      <p className="text-muted-foreground text-sm">
                        {searchTerm ? 'No conversations match your search' : 'No conversations yet'}
                      </p>
                    </div>
                  ) : (
                    filteredConversations.map((conversation) => {
                      const isSelected = conversation.id === selectedConversationId;
                      const otherParticipant = (conversation.participants || []).find(p => p.id !== currentUser.id);
                      
                      return (
                        <div
                          key={conversation.id}
                          className={cn(
                            "flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all duration-200",
                            "hover:bg-muted/50 active:bg-muted/70",
                            isSelected && "bg-primary/10 border border-primary/20 shadow-sm"
                          )}
                          onClick={() => handleSelectConversation(conversation.id)}
                        >
                          {/* Avatar with online status */}
                          <div className="relative flex-shrink-0">
                            {conversation.type === 'group' ? (
                              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                                <Users className="w-6 h-6 text-primary" />
                              </div>
                            ) : (
                              <Avatar className="w-12 h-12 ring-2 ring-background">
                                <AvatarImage src={otherParticipant?.avatar} />
                                <AvatarFallback className="bg-primary/10 text-primary font-medium">
                                  {(otherParticipant?.name || 'U').charAt(0).toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                            )}
                            
                            {/* Online status indicator */}
                            {conversation.type === 'direct' && otherParticipant && (
                              <div className={cn(
                                "absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full border-2 border-background",
                                otherParticipant.status === 'online' && "bg-green-500",
                                otherParticipant.status === 'away' && "bg-yellow-500",
                                otherParticipant.status === 'offline' && "bg-gray-400"
                              )} />
                            )}
                          </div>

                          {/* Conversation Info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-1">
                              <h3 className="font-medium text-foreground truncate text-sm">
                                {conversation.type === 'direct' 
                                  ? otherParticipant?.name || 'Unknown User'
                                  : conversation.title || 'Group Chat'
                                }
                              </h3>
                              
                              <div className="flex items-center gap-2 flex-shrink-0">
                                {conversation.lastMessage && (
                                  <span className="text-xs text-muted-foreground">
                                    {formatDistanceToNow(conversation.lastMessage.timestamp, { addSuffix: false })}
                                  </span>
                                )}
                                
                                {conversation.unreadCount > 0 && (
                                  <Badge 
                                    variant="default" 
                                    className="h-5 min-w-5 flex items-center justify-center text-xs px-1.5 bg-primary text-primary-foreground"
                                  >
                                    {conversation.unreadCount > 99 ? '99+' : conversation.unreadCount}
                                  </Badge>
                                )}
                              </div>
                            </div>
                            
                            <p className="text-xs text-muted-foreground truncate">
                              {conversation.lastMessage 
                                ? `${conversation.lastMessage.senderId === currentUser.id ? 'You: ' : ''}${conversation.lastMessage.content}`
                                : 'No messages yet'
                              }
                            </p>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </ScrollArea>
            </div>
          </div>
        )}

        {/* Chat Window Panel - WhatsApp right main area style */}
        {(!isMobile || !showConversationList) && (
          <div className={cn(
            "flex flex-col bg-card transition-all duration-300 ease-in-out min-h-0",
            isMobile ? "w-full h-full" : "flex-1",
            "border-l border-border/50"
          )}>
            {selectedConversation ? (
              <ChatWindow
                conversation={selectedConversation}
                messages={Array.isArray(messages) ? messages : []}
                currentUser={currentUser}
                typingUsers={[]}
                onSendMessage={handleSendMessage}
                isLoading={isSendingMessage}
                onBackToList={isMobile ? handleBackToList : undefined}
              />
            ) : (
              <div className="flex items-center justify-center h-full bg-muted/20">
                <div className="text-center max-w-md mx-auto p-8">
                  <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
                    <svg
                      className="w-10 h-10 text-primary/60"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                      />
                    </svg>
                  </div>
                  <h3 className="text-xl font-semibold text-foreground mb-2">Welcome to Messages</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    Select a conversation from the sidebar to start messaging, or create a new conversation to connect with other users.
                  </p>
                </div>
              </div>
            )}
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
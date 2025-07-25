import { useState, useEffect } from 'react';
import { ConversationList } from './ConversationList';
import { ChatWindow } from './ChatWindow';
import { Conversation, Message, User } from '@/types/message';
import { cn } from '@/lib/utils';
import supabase from '@/lib/supabaseClient';

interface MessagingInterfaceProps {
  className?: string;
  recipientId?: string;
  recipientName?: string;
}

export function MessagingInterface({ className, recipientId, recipientName }: MessagingInterfaceProps) {
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

  const [conversations, setConversations] = useState<Conversation[]>([
    {
      id: 'conv-1',
      title: 'John Doe',
      participants: [
        currentUser,
        { id: 'user-2', name: 'John Doe', avatar: 'https://i.pravatar.cc/150?img=60', status: 'online' },
      ],
      lastMessage: {
        id: 'msg-1',
        content: 'Hey there!',
        senderId: 'user-2',
        conversationId: 'conv-1',
        timestamp: new Date(Date.now() - 60 * 1000),
        type: 'text',
      },
      unreadCount: 1,
      type: 'direct',
      createdAt: new Date(Date.now() - 3600 * 1000),
      updatedAt: new Date(Date.now() - 60 * 1000),
    },
    {
      id: 'conv-2',
      title: 'Jane Smith',
      participants: [
        currentUser,
        { id: 'user-3', name: 'Jane Smith', avatar: 'https://i.pravatar.cc/150?img=47', status: 'away' },
      ],
      lastMessage: {
        id: 'msg-2',
        content: 'Are we still on for tomorrow?',
        senderId: 'user-1',
        conversationId: 'conv-2',
        timestamp: new Date(Date.now() - 120 * 1000),
        type: 'text',
      },
      unreadCount: 0,
      type: 'direct',
      createdAt: new Date(Date.now() - 7200 * 1000),
      updatedAt: new Date(Date.now() - 120 * 1000),
    },
    {
      id: 'conv-3',
      title: 'Team Alpha',
      participants: [
        currentUser,
        { id: 'user-4', name: 'Alice', avatar: 'https://i.pravatar.cc/150?img=20', status: 'online' },
        { id: 'user-5', name: 'Bob', avatar: 'https://i.pravatar.cc/150?img=10', status: 'offline' },
      ],
      lastMessage: {
        id: 'msg-3',
        content: 'Meeting at 10 AM.',
        senderId: 'user-4',
        conversationId: 'conv-3',
        timestamp: new Date(Date.now() - 300 * 1000),
        type: 'text',
      },
      unreadCount: 5,
      type: 'group',
      createdAt: new Date(Date.now() - 10800 * 1000),
      updatedAt: new Date(Date.now() - 300 * 1000),
    },
  ]);

  const [messages, setMessages] = useState<{ [conversationId: string]: Message[] }>({
    'conv-1': [
      {
        id: 'msg-1',
        content: 'Hey there!',
        senderId: 'user-2',
        conversationId: 'conv-1',
        timestamp: new Date(Date.now() - 60 * 1000),
        type: 'text',
      },
    ],
    'conv-2': [
      {
        id: 'msg-2',
        content: 'Are we still on for tomorrow?',
        senderId: 'user-1',
        conversationId: 'conv-2',
        timestamp: new Date(Date.now() - 120 * 1000),
        type: 'text',
      },
    ],
    'conv-3': [
      {
        id: 'msg-3',
        content: 'Meeting at 10 AM.',
        senderId: 'user-4',
        conversationId: 'conv-3',
        timestamp: new Date(Date.now() - 300 * 1000),
        type: 'text',
      },
    ],
  });

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedConversationId, setSelectedConversationId] = useState<string | undefined>(
    conversations.length > 0 ? conversations[0].id : undefined
  );

  useEffect(() => {
    // If recipientId is provided, check if a conversation with this recipient already exists
    if (recipientId && recipientName) {
      const existingConversation = conversations.find(conv => 
        conv.participants.some(p => p.id === recipientId)
      );
      
      if (existingConversation) {
        // If conversation exists, select it
        setSelectedConversationId(existingConversation.id);
      } else {
        // If no conversation exists, create a new one with the recipient
        const newConversationId = `conv-${Date.now()}`;
        const newConversation: Conversation = {
          id: newConversationId,
          title: recipientName,
          participants: [
            currentUser,
            { id: recipientId, name: recipientName, status: 'offline' },
          ],
          unreadCount: 0,
          type: 'direct',
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        setConversations(prevConversations => [...prevConversations, newConversation]);
        setMessages(prevMessages => ({ ...prevMessages, [newConversationId]: [] }));
        setSelectedConversationId(newConversationId);
      }
    } else if (!selectedConversationId && conversations.length > 0) {
      // Default behavior when no recipient is specified
      setSelectedConversationId(conversations[0].id);
    }
  }, [conversations, selectedConversationId, recipientId, recipientName, currentUser]);

  const filteredConversations = conversations.filter(conv => {
    const title = conv.title || conv.participants
      .filter(p => p.id !== currentUser.id)
      .map(p => p.name)
      .join(', ');
    
    return title.toLowerCase().includes(searchTerm.toLowerCase()) ||
           (conv.lastMessage && conv.lastMessage.content.toLowerCase().includes(searchTerm.toLowerCase()));
  });

  const selectedConversation = filteredConversations.find(c => c.id === selectedConversationId);
  const conversationMessages = selectedConversationId ? messages[selectedConversationId] || [] : [];

  const handleSendMessage = (conversationId: string, content: string) => {
    const newMessage: Message = {
      id: `msg-${Date.now()}`,
      content,
      senderId: currentUser.id,
      conversationId,
      timestamp: new Date(),
      type: 'text',
    };

    setMessages(prevMessages => ({
      ...prevMessages,
      [conversationId]: [...(prevMessages[conversationId] || []), newMessage],
    }));

    setConversations(prevConversations =>
      prevConversations.map(conv =>
        conv.id === conversationId ? { ...conv, lastMessage: newMessage, updatedAt: new Date() } : conv
      )
    );
  };

  const handleNewConversation = () => {
    const newConversationId = `conv-${Date.now()}`;
    const newConversation: Conversation = {
      id: newConversationId,
      title: `New Chat ${conversations.length + 1}`,
      participants: [
        currentUser,
        { id: `user-${Date.now()}-new`, name: `New User ${conversations.length + 1}`, status: 'offline' },
      ],
      unreadCount: 0,
      type: 'direct',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    setConversations(prevConversations => [...prevConversations, newConversation]);
    setMessages(prevMessages => ({ ...prevMessages, [newConversationId]: [] }));
    setSelectedConversationId(newConversationId);
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
            messages={conversationMessages}
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
    </div>
  );
}
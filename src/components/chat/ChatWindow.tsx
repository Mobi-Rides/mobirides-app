import { useState, useEffect, useRef } from 'react';
import { formatDistanceToNow, isSameDay, format } from 'date-fns';
import { 
  Phone, 
  Video, 
  Info, 
  MoreVertical,
  Users,
  Search,
  ChevronDown,
  ArrowLeft
} from 'lucide-react';
import { Conversation, Message, User, TypingIndicator } from '@/types/message';
import { MessageBubble } from './MessageBubble';
import { MessageInput } from './MessageInput';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { useIsMobile } from '@/hooks/use-mobile';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface ChatWindowProps {
  conversation: Conversation;
  messages: Message[];
  currentUser: User;
  typingUsers: TypingIndicator[];
  onSendMessage: (content: string) => void;
  onEditMessage?: (messageId: string) => void;
  onDeleteMessage?: (messageId: string) => void;
  onReactToMessage?: (messageId: string, emoji: string) => void;
  onStartTyping?: () => void;
  onStopTyping?: () => void;
  isLoading?: boolean;
}

export function ChatWindow({
  conversation,
  messages,
  currentUser,
  typingUsers,
  onSendMessage,
  onEditMessage,
  onDeleteMessage,
  onReactToMessage,
  onStartTyping,
  onStopTyping,
  isLoading = false
}: ChatWindowProps) {
  const [replyToMessage, setReplyToMessage] = useState<{
    id: string;
    content: string;
    senderName: string;
  } | null>(null);
  
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, typingUsers]);

  const getConversationTitle = () => {
    if (conversation.title) return conversation.title;
    
    const otherParticipants = conversation.participants.filter(p => p.id !== currentUser.id);
    return otherParticipants.map(p => p.name).join(', ');
  };

  const getConversationSubtitle = () => {
    if (conversation.type === 'group') {
      return `${conversation.participants.length} members`;
    }
    
    const otherParticipant = conversation.participants.find(p => p.id !== currentUser.id);
    if (!otherParticipant) return '';
    
    if (otherParticipant.status === 'online') return 'Online';
    if (otherParticipant.status === 'away') return 'Away';
    if (otherParticipant.lastSeen) {
      return `Last seen ${formatDistanceToNow(otherParticipant.lastSeen, { addSuffix: true })}`;
    }
    
    return 'Offline';
  };

  const shouldShowAvatar = (message: Message, index: number) => {
    if (index === messages.length - 1) return true;
    
    const nextMessage = messages[index + 1];
    return nextMessage.senderId !== message.senderId ||
           nextMessage.timestamp.getTime() - message.timestamp.getTime() > 300000; // 5 minutes
  };

  const shouldShowTimestamp = (message: Message, index: number) => {
    if (index === 0) return true;
    
    const prevMessage = messages[index - 1];
    return !isSameDay(message.timestamp, prevMessage.timestamp) ||
           message.timestamp.getTime() - prevMessage.timestamp.getTime() > 300000; // 5 minutes
  };

  const shouldShowDateSeparator = (message: Message, index: number) => {
    if (index === 0) return true;
    
    const prevMessage = messages[index - 1];
    return !isSameDay(message.timestamp, prevMessage.timestamp);
  };

  const handleReply = (messageId: string) => {
    const message = messages.find(m => m.id === messageId);
    if (message) {
      // Transform sender data to match expected format
      let senderName = 'Unknown User';
      
      if (message.sender?.id) {
        senderName = 'User';
      } else {
        // Fallback to finding from conversation participants
        const sender = conversation.participants.find(p => p.id === message.senderId);
        senderName = sender?.name || 'Unknown User';
      }
      
      setReplyToMessage({
        id: messageId,
        content: message.content,
        senderName
      });
    }
  };

  const getTypingText = () => {
    const typingNames = typingUsers
      .filter(t => t.userId !== currentUser.id)
      .map(t => {
        const user = conversation.participants.find(p => p.id === t.userId);
        return user?.name || 'Someone';
      });

    if (typingNames.length === 0) return '';
    if (typingNames.length === 1) return `${typingNames[0]} is typing...`;
    if (typingNames.length === 2) return `${typingNames[0]} and ${typingNames[1]} are typing...`;
    return `${typingNames[0]} and ${typingNames.length - 1} others are typing...`;
  };

  const isMobile = useIsMobile();
  
  const handleBackClick = () => {
    window.history.back();
  };

  return (
    <div className="flex flex-col h-full bg-card">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-notification-border">
        <div className="flex items-center gap-3">
          {/* Back Button - Only visible on mobile */}
          {isMobile && (
            <Button 
              variant="ghost" 
              size="icon" 
              className="mr-1 bg-primary/5 hover:bg-primary/10 rounded-full transition-all duration-200 ease-in-out"
              onClick={handleBackClick}
            >
              <ArrowLeft className="h-5 w-5 text-primary" />
            </Button>
          )}
          
          {/* Avatar */}
          {conversation.type === 'group' ? (
            <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
              <Users className="w-5 h-5 text-primary" />
            </div>
          ) : (
            <Avatar className="w-10 h-10">
              <AvatarImage src={conversation.participants.find(p => p.id !== currentUser.id)?.avatar} />
              <AvatarFallback>
                {getConversationTitle().charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
          )}

          {/* Title and status */}
          <div>
            <h3 className="font-medium text-foreground">{getConversationTitle()}</h3>
            <p className="text-sm text-muted-foreground">{getConversationSubtitle()}</p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
            <Search className="w-4 h-4" />
          </Button>
          
          <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={() => alert('Initiating audio call...')}>
            <Phone className="w-4 h-4" />
          </Button>
          
          <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={() => alert('Initiating video call...')}>
            <Video className="w-4 h-4" />
          </Button>
          
          <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
            <Info className="w-4 h-4" />
          </Button>
          
          <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
            <MoreVertical className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1" ref={scrollAreaRef}>
        <div className="py-4">
          {messages.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8 text-primary" />
              </div>
              <p className="text-muted-foreground">
                Start a conversation with {getConversationTitle()}
              </p>
            </div>
          ) : (
            <>
              {messages.map((message, index) => {
                // Transform sender data to match MessageBubble expectations
                let senderForBubble;
                
                if (message.sender?.id) {
                  // Use sender data from message
                  senderForBubble = {
                    id: message.sender.id,
                    name: 'User',
                    avatar: message.sender.avatar_url,
                    status: 'offline' as const
                  };
                } else {
                  // Fallback to conversation participants
                  const participantSender = conversation.participants.find(p => p.id === message.senderId);
                  senderForBubble = participantSender || {
                    id: message.senderId,
                    name: 'Unknown User',
                    avatar: undefined,
                    status: 'offline' as const
                  };
                }
                
                return (
                  <div key={message.id}>
                    {/* Date separator */}
                    {shouldShowDateSeparator(message, index) && (
                      <div className="flex items-center justify-center py-4">
                        <div className="bg-notification border border-notification-border rounded-full px-3 py-1">
                          <span className="text-xs text-muted-foreground">
                            {format(message.timestamp, 'MMMM d, yyyy')}
                          </span>
                        </div>
                      </div>
                    )}
                    
                    {/* Message */}
                    <MessageBubble
                      message={message}
                      sender={senderForBubble}
                      currentUser={currentUser}
                      isGroupChat={conversation.type === 'group'}
                      showAvatar={shouldShowAvatar(message, index)}
                      showTimestamp={shouldShowTimestamp(message, index)}
                      onEdit={onEditMessage}
                      onDelete={onDeleteMessage}
                      onReply={handleReply}
                      onReact={onReactToMessage}
                    />
                  </div>
                );
              })}
              
              {/* Typing indicator */}
              {typingUsers.length > 0 && (
                <div className="px-4 py-2">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <div className="flex gap-1">
                      <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" />
                      <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                      <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                    </div>
                    <span>{getTypingText()}</span>
                  </div>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </>
          )}
        </div>
      </ScrollArea>

      {/* Message Input */}
      <MessageInput
        onSendMessage={onSendMessage}
        onStartTyping={onStartTyping}
        onStopTyping={onStopTyping}
        replyToMessage={replyToMessage}
        onCancelReply={() => setReplyToMessage(null)}
        isLoading={isLoading}
      />
    </div>
  );
}
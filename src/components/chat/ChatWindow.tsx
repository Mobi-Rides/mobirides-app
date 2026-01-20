import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow, isSameDay, format } from 'date-fns';
import {
  Phone,
  Video,
  Info,
  MoreVertical,
  Users,
  Search,
  ChevronDown,
  ArrowLeft,
  X
} from 'lucide-react';
import { Conversation, Message, User, TypingIndicator } from '@/types/message';
import { MessageBubble } from './MessageBubble';
import { MessageInput } from './MessageInput';
import { QuickReplySuggestions } from './QuickReplySuggestions';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { useIsMobile } from '@/hooks/use-mobile';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/utils/toast-utils';
import { cn } from '@/lib/utils';

interface ChatWindowProps {
  conversation: Conversation;
  messages: Message[];
  currentUser: User;
  typingUsers: TypingIndicator[];
  onSendMessage: (content: string, type?: 'text' | 'image' | 'video' | 'audio' | 'file', metadata?: any, replyToMessageId?: string) => void;
  onEditMessage?: (messageId: string) => void;
  onDeleteMessage?: (messageId: string) => void;
  onReactToMessage?: (messageId: string, emoji: string) => void;
  onStartTyping?: () => void;
  onStopTyping?: () => void;
  isLoading?: boolean;
  onBack?: () => void;
  onStartCall?: () => void;
  onStartVideoCall?: () => void;
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
  isLoading = false,
  onBack,
  onStartCall,
  onStartVideoCall
}: ChatWindowProps) {
  const navigate = useNavigate();
  const [replyToMessage, setReplyToMessage] = useState<{
    id: string;
    content: string;
    senderName: string;
  } | null>(null);

  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // In-chat search state
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentMatchIndex, setCurrentMatchIndex] = useState(0);
  const [matches, setMatches] = useState<string[]>([]); // Array of message IDs

  // Debounce search and find matches
  useEffect(() => {
    if (!searchQuery.trim()) {
      setMatches([]);
      setCurrentMatchIndex(0);
      return;
    }

    const query = searchQuery.toLowerCase();
    const foundMsgIds = messages
      .filter(m => m.content && m.content.toLowerCase().includes(query))
      .map(m => m.id);

    // Reverse to match visual order (bottom to top usually, but we scroll down)
    // Actually standard is top-to-bottom for "Next" usually going down.
    // If we want "Next" to go to the *next older* message or *next newer*?
    // Usually "Next" means "Find next occurrence downwards". 
    // "Previous" means "Find upwards".
    // Let's assume matches are time-ordered (oldest to newest).
    // When we start search, we might want to jump to the most recent match?
    // Let's just store them in order.

    setMatches(foundMsgIds);
    // If we were already at a match, try to keep it, otherwise jump to last (newest)
    setCurrentMatchIndex(prev => Math.max(0, foundMsgIds.length - 1));

  }, [searchQuery, messages]);

  // Handle navigation
  const navigateMatch = (direction: 'next' | 'prev') => {
    if (matches.length === 0) return;

    let newIndex = direction === 'next' ? currentMatchIndex + 1 : currentMatchIndex - 1;

    // Wrap around
    if (newIndex >= matches.length) newIndex = 0;
    if (newIndex < 0) newIndex = matches.length - 1;

    setCurrentMatchIndex(newIndex);

    // Scroll to message
    const messageId = matches[newIndex];
    if (messageId) {
      const el = document.getElementById(`message-${messageId}`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        // Add highlight effect
        el.classList.add('ring-2', 'ring-primary', 'bg-primary/5');
        setTimeout(() => el.classList.remove('ring-2', 'ring-primary', 'bg-primary/5'), 2000);
      }
    }
  };

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, typingUsers]);

  const getConversationTitle = () => {
    // For direct conversations, always show the counterparty name, ignore stored title
    if (conversation.type === 'direct') {
      const otherParticipant = conversation.participants.find(p => p.id !== currentUser.id);
      return otherParticipant?.name || 'Unknown User';
    }

    // For group conversations, use stored title or generate from participants
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

      if (message.sender?.full_name) {
        senderName = message.sender.full_name;
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
    // Instead of navigating, we should clear the selected conversation
    // This is handled by the parent component, but we can emit an event or rely on prop
    // Since this component is tightly coupled with MessagingInterface via routing usually,
    // but here it's rendered conditionally.
    // If we are in MessagingInterface, we need a way to go back to list.
    // The parent MessagingInterface doesn't pass a "onBack" prop.
    // We should probably add it or use a query param.
    // For now, let's assume the back button is only needed on mobile where we want to show the list again.
    // The simplest way is to check if onBack is passed, or hack it via navigate.
    // But since we are using state for selection, navigate('/messages') might re-mount everything.

    // Better: Add onBack prop.
    if (onBack) {
      onBack();
    } else {
      navigate('/messages');
    }
  };

  const handleQuickReply = (text: string) => {
    onSendMessage(text);
  };

  const otherParticipant = conversation.participants.find(p => p.id !== currentUser.id);
  const isOnline = otherParticipant?.status === 'online';

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
            <div className="relative">
              <Avatar className="w-10 h-10">
                <AvatarImage src={conversation.participants.find(p => p.id !== currentUser.id)?.avatar} />
                <AvatarFallback>
                  {getConversationTitle().charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              {isOnline && (
                <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-background rounded-full" />
              )}
            </div>
          )}

          {/* Title and status */}
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-medium text-foreground">{getConversationTitle()}</h3>
              {isOnline && (
                <span className="text-xs text-green-600 font-medium bg-green-50 px-1.5 py-0.5 rounded-full">
                  Active now
                </span>
              )}
            </div>
            <p className="text-sm text-muted-foreground">{getConversationSubtitle()}</p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={() => setShowSearch(!showSearch)}>
            <Search className="w-4 h-4" />
          </Button>

          <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={onStartCall}>
            <Phone className="w-4 h-4" />
          </Button>

          <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={onStartVideoCall}>
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

      {/* In-Chat Search Bar */}
      {showSearch && (
        <div className="border-b border-notification-border p-2 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 flex items-center gap-2 animate-in slide-in-from-top-2">
          <div className="relative flex-1">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Search in conversation..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  if (e.shiftKey) {
                    navigateMatch('prev');
                  } else {
                    navigateMatch('next');
                  }
                }
                if (e.key === 'Escape') {
                  setShowSearch(false);
                  setSearchQuery('');
                }
              }}
              className="w-full pl-8 pr-4 py-1.5 text-sm bg-muted/50 border border-input rounded-md focus:outline-none focus:ring-1 focus:ring-primary placeholder:text-muted-foreground"
              autoFocus
            />
          </div>
          <div className="flex items-center gap-1">
            <span className="text-xs text-muted-foreground whitespace-nowrap px-2">
              {matches.length > 0 ? `${currentMatchIndex + 1} of ${matches.length}` : 'No results'}
            </span>
            <Button
              size="sm"
              variant="ghost"
              className="h-7 w-7 p-0"
              onClick={() => navigateMatch('prev')}
              disabled={matches.length === 0}
            >
              <ChevronDown className="w-4 h-4 rotate-180" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="h-7 w-7 p-0"
              onClick={() => navigateMatch('next')}
              disabled={matches.length === 0}
            >
              <ChevronDown className="w-4 h-4" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="h-7 w-7 p-0 ml-1 hover:bg-destructive/10 hover:text-destructive"
              onClick={() => {
                setShowSearch(false);
                setSearchQuery('');
              }}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}

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

                if (message.sender?.full_name) {
                  // Use sender data from message
                  senderForBubble = {
                    id: message.sender.id,
                    name: message.sender.full_name,
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
                  <div key={message.id} id={`message-${message.id}`} className="scroll-mt-4">
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
                      highlightTerm={searchQuery}
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

      {/* Quick Replies - Only show for direct conversations and when messages are few or empty (optional logic) */}
      {conversation.type === 'direct' && (
        <QuickReplySuggestions
          onSelect={handleQuickReply}
          userRole={currentUser.role || 'renter'}
          isVisible={true}
        />
      )}

      {/* Message Input */}
      <MessageInput
        onSendMessage={onSendMessage}
        onStartTyping={onStartTyping}
        onStopTyping={onStopTyping}
        replyToMessage={replyToMessage}
        onCancelReply={() => setReplyToMessage(null)}
        isLoading={isLoading}
        currentUserId={currentUser?.id}
      />
    </div>
  );
}
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
import { toast } from '@/utils/toast-utils';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';

interface ChatWindowProps {
  conversation: Conversation;
  messages: Message[];
  currentUser: User;
  typingUsers: TypingIndicator[];
  onSendMessage: (content: string, replyToId?: string) => void;
  onEditMessage?: (messageId: string, newContent: string) => void;
  onDeleteMessage?: (messageId: string) => void;
  onReactToMessage?: (messageId: string, emoji: string) => void;
  onStartTyping?: () => void;
  onStopTyping?: () => void;
  isLoading?: boolean;
  onBackToList?: () => void;
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
  onBackToList
}: ChatWindowProps) {
  const [replyToMessage, setReplyToMessage] = useState<{
    id: string;
    content: string;
    senderName: string;
  } | null>(null);
  
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messageRefs = useRef<Map<string, HTMLDivElement>>(new Map());

  // Search state
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [messageSearchTerm, setMessageSearchTerm] = useState('');
  const [matchIds, setMatchIds] = useState<string[]>([]);
  const [currentMatchIndex, setCurrentMatchIndex] = useState(0);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, typingUsers]);

  // Recompute matches when search term or messages change
  useEffect(() => {
    if (!messageSearchTerm.trim()) {
      setMatchIds([]);
      setCurrentMatchIndex(0);
      return;
    }
    const term = messageSearchTerm.toLowerCase();
    const ids = messages
      .filter(m => m.content?.toLowerCase().includes(term))
      .map(m => m.id);
    setMatchIds(ids);
    setCurrentMatchIndex(0);
  }, [messageSearchTerm, messages]);

  // Scroll to current match when index changes
  useEffect(() => {
    if (matchIds.length === 0) return;
    const id = matchIds[currentMatchIndex];
    const el = messageRefs.current.get(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      el.classList.add('ring-2', 'ring-primary');
      setTimeout(() => {
        el.classList.remove('ring-2', 'ring-primary');
      }, 1200);
    }
  }, [currentMatchIndex, matchIds]);

  const nextMatch = () => {
    if (matchIds.length === 0) return;
    setCurrentMatchIndex((idx) => (idx + 1) % matchIds.length);
  };
  const prevMatch = () => {
    if (matchIds.length === 0) return;
    setCurrentMatchIndex((idx) => (idx - 1 + matchIds.length) % matchIds.length);
  };

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

  // Wrapper to adapt MessageBubble onEdit signature to parent onEditMessage
  const handleEditMessage = (messageId: string) => {
    const message = messages.find(m => m.id === messageId);
    if (!message) return;
    const initial = message.content || '';
    const newContent = window.prompt('Edit message', initial);
    if (newContent != null && newContent.trim() !== '' && newContent !== initial) {
      onEditMessage?.(messageId, newContent);
    }
  };

  const isMobile = useIsMobile();
  
  const handleBackClick = () => {
    // Use the provided back handler if available (for mobile pane management)
    // Otherwise, use browser history
    if (onBackToList) {
      onBackToList();
    } else {
      window.history.back();
    }
  };

  return (
    <div className="flex flex-col h-full bg-card">
      {/* Fixed Header */}
      <div className="sticky top-0 z-40 flex items-center justify-between p-4 border-b border-border bg-card/95 backdrop-blur-sm">
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
            <Avatar className="w-10 h-10 ring-2 ring-background">
              <AvatarImage src={conversation.participants.find(p => p.id !== currentUser.id)?.avatar} />
              <AvatarFallback className="bg-primary/10 text-primary font-medium">
                {getConversationTitle().charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
          )}

          {/* Title and status */}
          <div>
            <h3 className="font-medium text-foreground">{getConversationTitle()}</h3>
            <p className="text-xs text-muted-foreground">{getConversationSubtitle()}</p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={() => setIsSearchOpen(v => !v)}>
            <Search className="w-4 h-4" />
          </Button>
          
          <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={() => toast.info('Audio call feature coming soon!')}>
            <Phone className="w-4 h-4" />
          </Button>
          
          <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={() => toast.info('Video call feature coming soon!')}>
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

      {/* Search bar */}
      {isSearchOpen && (
        <div className="sticky top-[64px] z-30 flex items-center gap-2 px-4 py-2 border-b border-border bg-muted/30">
          <Input
            placeholder="Search messages..."
            value={messageSearchTerm}
            onChange={(e) => setMessageSearchTerm(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) nextMatch();
              if (e.key === 'Enter' && e.shiftKey) prevMatch();
              if (e.key === 'Escape') setIsSearchOpen(false);
            }}
            className="max-w-sm bg-background"
          />
          <span className="text-xs text-muted-foreground whitespace-nowrap">
            {matchIds.length > 0 ? `${currentMatchIndex + 1} / ${matchIds.length}` : 'No matches'}
          </span>
          <Button size="sm" variant="outline" onClick={prevMatch} disabled={matchIds.length === 0}>
            Prev
          </Button>
          <Button size="sm" variant="outline" onClick={nextMatch} disabled={matchIds.length === 0}>
            Next
          </Button>
          <Button size="sm" variant="ghost" onClick={() => { setIsSearchOpen(false); setMessageSearchTerm(''); }}>
            Close
          </Button>
        </div>
      )}

      {/* Messages Area - Optimized scrolling */}
      <div className="flex-1 min-h-0 overflow-hidden relative">
        <ScrollArea className="h-full scroll-smooth" ref={scrollAreaRef}>
          <div className="py-4 px-4">
            {messages.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Users className="w-8 h-8 text-primary/60" />
                </div>
                <p className="text-muted-foreground">
                  Start a conversation with {getConversationTitle()}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
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
                  
                  const highlightTerm = messageSearchTerm.trim();
                  const isMatch = highlightTerm && message.content?.toLowerCase().includes(highlightTerm.toLowerCase());

                  return (
                    <div key={message.id} ref={(el) => { if (el) messageRefs.current.set(message.id, el); }}>
                      {/* Date separator */}
                      {shouldShowDateSeparator(message, index) && (
                        <div className="flex items-center justify-center py-4">
                          <div className="bg-muted/50 border border-border rounded-full px-3 py-1">
                            <span className="text-xs text-muted-foreground">
                              {format(message.timestamp, 'MMMM d, yyyy')}
                            </span>
                          </div>
                        </div>
                      )}

                      {/* Message bubble */}
                      <MessageBubble
                        message={message}
                        sender={senderForBubble}
                        currentUser={currentUser}
                        isGroupChat={conversation.type === 'group'}
                        showAvatar={shouldShowAvatar(message, index)}
                        showTimestamp={shouldShowTimestamp(message, index)}
                        onReply={handleReply}
                        onEdit={handleEditMessage}
                        onDelete={onDeleteMessage}
                        onReact={onReactToMessage}
                        highlightTerm={isMatch ? highlightTerm : undefined}
                      />
                    </div>
                  );
                })}
                
                {/* Typing indicator */}
                {typingUsers.length > 0 && (
                  <div className="flex items-center gap-2 px-4 py-2">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                    <span className="text-sm text-muted-foreground">{getTypingText()}</span>
                  </div>
                )}
                
                {/* Scroll anchor */}
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>
        </ScrollArea>
      </div>

      {/* Message Input - Fixed at bottom */}
      <div className="flex-shrink-0 border-t border-border bg-card/95 backdrop-blur-sm">
        <MessageInput
          onSendMessage={(content) => onSendMessage(content, replyToMessage?.id)}
          onStartTyping={onStartTyping}
          onStopTyping={onStopTyping}
          replyToMessage={replyToMessage}
          onCancelReply={() => setReplyToMessage(null)}
          disabled={isLoading}
          placeholder={`Message ${getConversationTitle()}...`}
        />
      </div>
    </div>
  );
}
import React from 'react';
import { formatDistanceToNow } from 'date-fns';
import {
  Search,
  Plus,
  MessageCircle,
  Users
} from 'lucide-react';
import { Conversation, User } from '@/types/message';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

interface ConversationListProps {
  conversations: Conversation[];
  selectedConversationId?: string;
  currentUser: User;
  onSelectConversation: (conversationId: string) => void;
  onNewConversation: () => void;
  searchTerm: string;
  onSearchChange: (term: string) => void;
}

export function ConversationList({
  conversations,
  selectedConversationId,
  currentUser,
  onSelectConversation,
  onNewConversation,
  searchTerm,
  onSearchChange
}: ConversationListProps) {
  const filteredConversations = React.useMemo(() => {
    if (!searchTerm.trim()) return conversations;

    const term = searchTerm.toLowerCase().trim();

    return conversations.filter(conversation => {
      // Check title or generated title
      let title = conversation.title;
      if (!title) {
        if (conversation.type === 'direct') {
          const otherParticipant = (conversation.participants || []).find(p => p.id !== currentUser.id);
          title = otherParticipant?.name || 'Unknown User';
        } else {
          const otherParticipants = (conversation.participants || []).filter(p => p.id !== currentUser.id);
          title = otherParticipants.map(p => p.name).join(', ');
        }
      }

      if (title && title.toLowerCase().includes(term)) return true;

      // Check participants
      const hasParticipantMatch = (conversation.participants || []).some(p =>
        p.name && p.name.toLowerCase().includes(term)
      );
      if (hasParticipantMatch) return true;

      // Check last message content
      if (conversation.lastMessage?.content && conversation.lastMessage.content.toLowerCase().includes(term)) {
        return true;
      }

      return false;
    });
  }, [conversations, searchTerm, currentUser.id]);

  const getConversationTitle = (conversation: Conversation) => {
    // For direct conversations, always show the counterparty name, ignore stored title
    if (conversation.type === 'direct') {
      const otherParticipant = (conversation.participants || []).find(p => p.id !== currentUser.id);
      return otherParticipant?.name || 'Unknown User';
    }

    // For group conversations, use stored title or generate from participants
    if (conversation.title) return conversation.title;

    const otherParticipants = (conversation.participants || []).filter(p => p.id !== currentUser.id);
    return otherParticipants.map(p => p.name).join(', ');
  };

  const getConversationAvatar = (conversation: Conversation) => {
    if (conversation.type === 'group') {
      return null; // Will show group icon instead
    }

    const otherParticipant = (conversation.participants || []).find(p => p.id !== currentUser.id);
    return otherParticipant?.avatar;
  };

  const getLastMessagePreview = (conversation: Conversation) => {
    if (!conversation.lastMessage) return 'No messages yet';

    const sender = (conversation.participants || []).find(p => p.id === conversation.lastMessage?.senderId);
    const senderName = sender?.id === currentUser.id ? 'You' : sender?.name;

    return `${senderName}: ${conversation.lastMessage.content}`;
  };

  return (
    <div className="flex flex-col h-full bg-card border-r border-notification-border">
      {/* Header */}
      <div className="p-4 border-b border-notification-border">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-foreground">Messages</h2>
          <Button
            size="sm"
            onClick={onNewConversation}
            className="h-8 w-8 p-0"
          >
            <Plus className="w-4 h-4" />
          </Button>
        </div>

        {/* Search */}
        <div className="relative z-10">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground z-20 pointer-events-none" />
          <Input
            placeholder="Search conversations..."
            value={searchTerm}
            onChange={(e) => {
              console.log('🔍 [SEARCH INPUT] Value changed:', e.target.value);
              onSearchChange(e.target.value);
            }}
            className="pl-9 bg-notification border-notification-border relative z-10"
          />
        </div>
      </div>

      {/* Conversations */}
      <ScrollArea className="flex-1">
        <div className="p-2">
          {filteredConversations.length === 0 ? (
            <div className="text-center py-8">
              <MessageCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">
                {searchTerm ? 'No conversations match your search' : 'No conversations yet'}
              </p>
            </div>
          ) : (
            <div className="space-y-1">
              {filteredConversations.map((conversation) => {
                const isSelected = conversation.id === selectedConversationId;
                const otherParticipant = (conversation.participants || []).find(p => p.id !== currentUser.id);

                return (
                  <div
                    key={conversation.id}
                    className={cn(
                      "flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all duration-200",
                      "hover:bg-notification-hover",
                      isSelected && "bg-primary/10 border border-primary/20"
                    )}
                    onClick={() => onSelectConversation(conversation.id)}
                  >
                    {/* Avatar */}
                    <div className="relative flex-shrink-0">
                      {conversation.type === 'group' ? (
                        <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                          <Users className="w-6 h-6 text-primary" />
                        </div>
                      ) : (
                        <Avatar className="w-12 h-12">
                          <AvatarImage src={getConversationAvatar(conversation)} />
                          <AvatarFallback>
                            {getConversationTitle(conversation).charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                      )}

                      {/* Online status for direct messages */}
                      {conversation.type === 'direct' && otherParticipant && (
                        <div className={cn(
                          "absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full border-2 border-card",
                          otherParticipant.status === 'online' && "bg-green-500",
                          otherParticipant.status === 'away' && "bg-yellow-500",
                          otherParticipant.status === 'offline' && "bg-gray-400"
                        )} />
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h3 className="font-medium text-foreground truncate">
                          {getConversationTitle(conversation)}
                        </h3>

                        <div className="flex items-center gap-2 flex-shrink-0">
                          {conversation.lastMessage && (
                            <span className="text-xs text-muted-foreground">
                              {formatDistanceToNow(conversation.lastMessage.timestamp, { addSuffix: true })}
                            </span>
                          )}

                          {conversation.unreadCount > 0 && (
                            <Badge
                              variant="default"
                              className="h-5 min-w-5 flex items-center justify-center text-xs px-1.5"
                            >
                              {conversation.unreadCount > 99 ? '99+' : conversation.unreadCount}
                            </Badge>
                          )}
                        </div>
                      </div>

                      <p className="text-sm text-muted-foreground truncate mt-1">
                        {getLastMessagePreview(conversation)}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}

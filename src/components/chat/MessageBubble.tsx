import { useState } from 'react';
import { formatDistanceToNow, format } from 'date-fns';
import { 
  MoreHorizontal, 
  Edit, 
  Trash2, 
  Reply, 
  Copy,
  Check,
  CheckCheck
} from 'lucide-react';
import { Message, User, MessageReaction } from '@/types/message';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

interface MessageBubbleProps {
  message: Message;
  sender: User;
  currentUser: User;
  isGroupChat: boolean;
  showAvatar: boolean;
  showTimestamp: boolean;
  onEdit?: (messageId: string) => void;
  onDelete?: (messageId: string) => void;
  onReply?: (messageId: string) => void;
  onReact?: (messageId: string, emoji: string) => void;
}

export function MessageBubble({
  message,
  sender,
  currentUser,
  isGroupChat,
  showAvatar,
  showTimestamp,
  onEdit,
  onDelete,
  onReply,
  onReact
}: MessageBubbleProps) {
  const [showActions, setShowActions] = useState(false);
  const isOwnMessage = message.senderId === currentUser.id;

  const handleCopyMessage = () => {
    navigator.clipboard.writeText(message.content);
  };

  const commonReactions = ['👍', '❤️', '😂', '😮', '😢', '👏'];

  return (
    <div
      className={cn(
        "group flex gap-3 px-4 py-2 hover:bg-notification-hover/50 transition-colors",
        isOwnMessage && "flex-row-reverse"
      )}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      {/* Avatar */}
      <div className="flex-shrink-0">
        {showAvatar ? (
          <Avatar className="w-8 h-8">
            <AvatarImage src={sender.avatar} />
            <AvatarFallback className="text-xs">
              {sender.name.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
        ) : (
          <div className="w-8 h-8" />
        )}
      </div>

      {/* Message Content */}
      <div className={cn(
        "flex-1 max-w-md",
        isOwnMessage && "flex flex-col items-end"
      )}>
        {/* Sender name (only in group chats and not own messages) */}
        {isGroupChat && !isOwnMessage && showAvatar && (
          <p className="text-xs font-medium text-primary mb-1">
            {sender.name}
          </p>
        )}

        {/* Message bubble */}
        <div className="relative">
          <div className={cn(
            "relative px-4 py-2 rounded-2xl break-words shadow-sm transition-all duration-200",
            isOwnMessage 
              ? "bg-primary text-primary-foreground rounded-br-md transform hover:scale-[1.01]" 
              : "bg-notification border border-notification-border rounded-bl-md hover:bg-notification/80 transform hover:scale-[1.01]"
          )}>
            <p className="text-sm">{message.content}</p>
            
            {message.edited && (
              <span className="text-xs opacity-60 ml-2 italic">(edited)</span>
            )}
          </div>

          {/* Reactions */}
          {message.reactions && message.reactions.length > 0 && (
            <div className="flex gap-1 mt-1">
              {message.reactions.reduce((acc, reaction) => {
                const existing = acc.find(r => r.emoji === reaction.emoji);
                if (existing) {
                  existing.count++;
                  existing.users.push(reaction.userId);
                } else {
                  acc.push({
                    emoji: reaction.emoji,
                    count: 1,
                    users: [reaction.userId]
                  });
                }
                return acc;
              }, [] as { emoji: string; count: number; users: string[] }[]).map((reaction) => (
                <button
                  key={reaction.emoji}
                  className={cn(
                    "px-2 py-1 text-xs rounded-full border transition-all duration-200 shadow-sm transform hover:scale-110",
                    reaction.users.includes(currentUser.id)
                      ? "bg-primary/20 border-primary/30 hover:bg-primary/30"
                      : "bg-notification border-notification-border hover:bg-notification-hover"
                  )}
                  onClick={() => onReact?.(message.id, reaction.emoji)}
                >
                  {reaction.emoji} {reaction.count}
                </button>
              ))}
            </div>
          )}

          {/* Message actions */}
          {showActions && (
            <div className={cn(
              "absolute top-0 flex items-center gap-1",
              isOwnMessage ? "-left-20" : "-right-20"
            )}>
              {/* Quick reactions */}
              <div className="flex items-center bg-card border border-notification-border rounded-lg shadow-md overflow-hidden">
                {commonReactions.slice(0, 3).map((emoji) => (
                  <Button
                    key={emoji}
                    size="sm"
                    variant="ghost"
                    className="h-6 w-6 p-0 hover:bg-primary/10 transition-colors duration-200 transform hover:scale-110"
                    onClick={() => onReact?.(message.id, emoji)}
                  >
                    {emoji}
                  </Button>
                ))}
                
                {/* More actions */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-6 w-6 p-0 hover:bg-primary/10 transition-colors duration-200 rounded-full"
                    >
                      <MoreHorizontal className="w-3 h-3 text-primary" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => onReply?.(message.id)}>
                      <Reply className="w-4 h-4 mr-2" />
                      Reply
                    </DropdownMenuItem>
                    
                    <DropdownMenuItem onClick={handleCopyMessage}>
                      <Copy className="w-4 h-4 mr-2" />
                      Copy
                    </DropdownMenuItem>
                    
                    {/* More reactions */}
                    <DropdownMenuItem>
                      <div className="flex gap-1">
                        {commonReactions.slice(3).map((emoji) => (
                          <button
                            key={emoji}
                            className="hover:bg-notification-hover rounded p-1"
                            onClick={() => onReact?.(message.id, emoji)}
                          >
                            {emoji}
                          </button>
                        ))}
                      </div>
                    </DropdownMenuItem>
                    
                    {isOwnMessage && (
                      <>
                        <DropdownMenuItem onClick={() => onEdit?.(message.id)}>
                          <Edit className="w-4 h-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        
                        <DropdownMenuItem 
                          onClick={() => onDelete?.(message.id)}
                          className="text-destructive"
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          )}
        </div>

        {/* Timestamp */}
        {showTimestamp && (
          <div className={cn(
            "flex items-center gap-1 mt-1",
            isOwnMessage ? "justify-end" : "justify-start"
          )}>
            {message.status === 'sent' && (
              <Check className="w-3 h-3 text-muted-foreground" />
            )}
            {message.status === 'delivered' && (
              <CheckCheck className="w-3 h-3 text-muted-foreground" />
            )}
            {message.status === 'read' && (
              <CheckCheck className="w-3 h-3 text-primary" />
            )}
            <p className="text-xs text-muted-foreground">
              {format(message.timestamp, 'HH:mm')}
              {message.edited && (
                <span className="ml-1 opacity-70 italic">(edited)</span>
              )}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
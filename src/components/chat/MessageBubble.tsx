import { useState } from 'react';
import { formatDistanceToNow, format } from 'date-fns';
import {
  MoreHorizontal,
  Edit,
  Trash2,
  Reply,
  Copy,
  Check,
  CheckCheck,
  FileIcon,
  Mic,
  SmilePlus
} from 'lucide-react';
import EmojiPicker, { EmojiClickData, Theme } from 'emoji-picker-react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
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
  highlightTerm?: string;
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
  onReact,
  highlightTerm
}: MessageBubbleProps) {
  const [showActions, setShowActions] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
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
              {sender.name ? sender.name.charAt(0).toUpperCase() : 'U'}
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
            {sender.name || 'Unknown User'}
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
            {/* Reply Context */}
            {message.replyTo && (
              <div
                className={cn(
                  "mb-2 p-2 rounded-md text-xs border-l-2 cursor-pointer opacity-90",
                  isOwnMessage
                    ? "bg-black/10 border-white/50 text-white"
                    : "bg-black/5 border-primary/50 text-foreground"
                )}
                onClick={(e) => {
                  e.stopPropagation();
                  const el = document.getElementById(`message-${message.replyToMessageId}`);
                  if (el) {
                    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    el.classList.add('bg-primary/5');
                    setTimeout(() => el.classList.remove('bg-primary/5'), 1000);
                  }
                }}
              >
                <div className="flex items-center gap-1 mb-0.5">
                  <div className={cn(
                    "w-1 h-3 rounded-full",
                    isOwnMessage ? "bg-white/50" : "bg-primary/50"
                  )} />
                  <p className="font-semibold">
                    {message.replyTo.sender.id === currentUser.id ? 'You' : message.replyTo.sender.name}
                  </p>
                </div>
                <p className="truncate opacity-80 pl-2 text-[11px] leading-tight">
                  {message.replyTo.content || 'Media message'}
                </p>
              </div>
            )}

            {/* Image/Video/File Rendering */}
            {/* Image/Video/File Rendering */}
            {message.type === 'image' && message.metadata?.url ? (
              <div className="mb-2">
                <img
                  src={message.metadata.url}
                  alt="Shared image"
                  className="rounded-lg w-full h-auto object-cover cursor-pointer hover:opacity-90 transition-opacity"
                  onClick={() => window.open(message.metadata.url, '_blank')}
                  loading="lazy"
                />
              </div>
            ) : message.type === 'video' && message.metadata?.url ? (
              <div className="mb-2">
                <video
                  src={message.metadata.url}
                  controls
                  className="rounded-lg w-full h-auto aspect-video bg-black"
                >
                  Your browser does not support video playback.
                </video>
              </div>
            ) : message.type === 'audio' && message.metadata?.url ? (
              <div className={cn(
                "flex items-center gap-3 p-2 rounded-lg mb-2",
                isOwnMessage ? "bg-primary-foreground/10" : "bg-background/50"
              )}>
                <div className={cn(
                  "p-2 rounded-full flex-shrink-0",
                  isOwnMessage ? "bg-primary-foreground/20" : "bg-primary/10"
                )}>
                  <Mic className="w-4 h-4" />
                </div>
                <audio
                  src={message.metadata.url}
                  controls
                  className="h-8 w-full max-w-[200px] min-w-[150px]"
                />
              </div>
            ) : message.type === 'file' && message.metadata?.url ? (
              <a
                href={message.metadata.url}
                target="_blank"
                rel="noopener noreferrer"
                className={cn(
                  "flex items-center gap-2 p-2 rounded-lg mb-2 transition-colors",
                  isOwnMessage ? "bg-primary-foreground/10 hover:bg-primary-foreground/20" : "bg-background/50 hover:bg-background/70"
                )}
              >
                <div className={cn(
                  "p-2 rounded",
                  isOwnMessage ? "bg-primary-foreground/20" : "bg-background/20"
                )}>
                  <FileIcon className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{message.metadata.fileName || 'Attachment'}</p>
                  {message.metadata.fileSize && (
                    <p className="text-xs opacity-70">{(message.metadata.fileSize / 1024).toFixed(1)} KB</p>
                  )}
                </div>
              </a>
            ) : null}

            {/* Highlighted Content */}
            {!(
              (message.type === 'image' && (message.content === 'Sent an image' || message.content.startsWith('Sent a file:'))) ||
              (message.type === 'video' && (message.content === 'Sent a video' || message.content.startsWith('Sent a file:'))) ||
              (message.type === 'audio' && message.content === 'Sent a voice message') ||
              (message.type === 'file' && message.content.startsWith('Sent a file:'))
            ) && (
                <p className="text-sm">
                  {highlightTerm && message.content ? (
                    message.content.split(new RegExp(`(${highlightTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi')).map((part, i) =>
                      part.toLowerCase() === highlightTerm.toLowerCase() ? (
                        <span key={i} className="bg-yellow-200 text-black px-0.5 rounded animate-pulse">
                          {part}
                        </span>
                      ) : (
                        <span key={i}>{part}</span>
                      )
                    )
                  ) : (
                    message.content
                  )}
                </p>
              )}

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
          {(showActions || isDropdownOpen) && (
            <div className={cn(
              "absolute top-0 flex items-center gap-1",
              isOwnMessage ? "-left-20" : "-right-20"
            )}>
              {/* Quick reactions */}
              <div className="flex items-center gap-0.5 p-1 bg-card/95 backdrop-blur-sm border border-border/50 rounded-full shadow-lg animate-in fade-in zoom-in-95 duration-200">
                {commonReactions.slice(0, 3).map((emoji) => (
                  <Button
                    key={emoji}
                    size="sm"
                    variant="ghost"
                    className="h-8 w-8 p-0 rounded-full hover:bg-accent hover:text-accent-foreground transition-all duration-200 hover:scale-110 active:scale-95"
                    onClick={() => onReact?.(message.id, emoji)}
                  >
                    <span className="text-lg leading-none">{emoji}</span>
                  </Button>
                ))}

                {/* Emoji Picker Popover */}
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-8 w-8 p-0 rounded-full hover:bg-accent hover:text-accent-foreground transition-all duration-200 hover:scale-110 active:scale-95"
                    >
                      <SmilePlus className="w-4 h-4 text-muted-foreground" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 border-none bg-transparent shadow-none" side="top" align="center" sideOffset={5}>
                    <div className="shadow-xl rounded-lg overflow-hidden border border-border">
                      <EmojiPicker
                        onEmojiClick={(emojiData) => {
                          onReact?.(message.id, emojiData.emoji);
                          setShowActions(false);
                        }}
                        theme={Theme.AUTO}
                        lazyLoadEmojis={true}
                        searchDisabled={false}
                        width={300}
                        height={400}
                        previewConfig={{ showPreview: false }}
                      />
                    </div>
                  </PopoverContent>
                </Popover>

                {/* More actions */}
                <DropdownMenu onOpenChange={setIsDropdownOpen}>
                  <DropdownMenuTrigger asChild>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-8 w-8 p-0 rounded-full hover:bg-accent hover:text-accent-foreground transition-all duration-200 data-[state=open]:bg-accent"
                    >
                      <MoreHorizontal className="w-4 h-4 text-muted-foreground" />
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
import React from 'react';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';
import { Archive, Trash2, User as UserIcon, Reply as ReplyIcon } from 'lucide-react';

export interface Message {
  id: string;
  senderId: string;
  receiverId: string; // Add this line
  senderName: string;
  senderAvatarUrl?: string;
  content: string;
  createdAt: Date;
  read: boolean;
  replyToId?: string; // id of the message this is replying to
}

interface MessageListProps {
  messages: Message[];
  currentUserId: string;
  onMessageClick?: (message: Message) => void;
  onReply?: (message: Message) => void;
  onArchive?: (message: Message) => void;
  onDelete?: (message: Message) => void;
  onJumpToMessage?: (id: string) => void;
}

function getInitials(name: string) {
  if (!name) return '';
  const parts = name.split(' ');
  if (parts.length === 1) return parts[0][0]?.toUpperCase() || '';
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

const MessageList: React.FC<MessageListProps> = ({ messages, currentUserId, onMessageClick, onReply, onArchive, onDelete, onJumpToMessage }) => {
  // For quick lookup of messages by id (for reply preview)
  const messageMap = React.useMemo(() => {
    const map: Record<string, Message> = {};
    messages.forEach(m => { map[m.id] = m; });
    return map;
  }, [messages]);

  if (!messages || messages.length === 0) {
    return (
      <div className="text-center text-gray-500 py-8">No messages yet.</div>
    );
  }

  return (
    <ul className="divide-y divide-gray-200 dark:divide-gray-800">
      {messages.map((msg, idx) => {
        const isOwn = msg.senderId === currentUserId;
        const isUnread = !msg.read;
        return (
          <li
            key={msg.id}
            className={cn(
              "flex items-center gap-3 px-4 py-3 cursor-pointer group transition bg-white dark:bg-gray-900 hover:bg-blue-50 dark:hover:bg-blue-950 relative",
              isUnread && "bg-blue-50 dark:bg-blue-950"
            )}
            onClick={e => {
              // Prevent row click if clicking on a quick action or reply
              if ((e.target as HTMLElement).closest('.msg-action-btn')) return;
              onMessageClick?.(msg);
            }}
          >
            {/* Avatar + unread dot */}
            <div className="relative">
              {msg.senderAvatarUrl ? (
                <img src={msg.senderAvatarUrl} alt={msg.senderName} className="w-10 h-10 rounded-full object-cover border-2 border-blue-200 dark:border-blue-700" />
              ) : (
                <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-800 flex items-center justify-center font-bold text-blue-700 dark:text-blue-100 text-lg">
                  {msg.senderName?.[0] || '?'}
                </div>
              )}
              {isUnread && (
                <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-blue-500 border-2 border-white dark:border-gray-900" />
              )}
            </div>
            {/* Main content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className={cn("truncate font-medium text-base", isUnread && "font-bold text-blue-900 dark:text-blue-100")}>{msg.senderName}</span>
                <span className="ml-auto text-xs text-gray-400 dark:text-gray-500">{formatDistanceToNow(msg.createdAt, { addSuffix: true })}</span>
              </div>
              {/* Quoted reply preview */}
              {msg.replyToId && onJumpToMessage && (
                <div className="text-xs text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-900 rounded px-2 py-1 mt-1 cursor-pointer inline-block max-w-xs truncate" title="Jump to original" onClick={e => { e.stopPropagation(); onJumpToMessage(msg.replyToId); }}>
                  Replying to message
                </div>
              )}
              <div className="text-sm text-gray-700 dark:text-gray-300 truncate max-w-xs" title={msg.content.length > 80 ? msg.content : undefined}>
                {msg.content.length > 80 ? msg.content.slice(0, 80) + '…' : msg.content}
              </div>
            </div>
            {/* Quick actions (always visible) */}
            <div className="flex gap-2 items-center ml-2 transition-opacity">
              <button
                className="msg-action-btn p-1 rounded hover:bg-blue-100 dark:hover:bg-blue-800 opacity-90 hover:opacity-100"
                title="Archive"
                aria-label="Archive"
                onClick={e => { e.stopPropagation(); onArchive?.(msg); }}
              >
                <Archive className="w-4 h-4 text-blue-500" />
              </button>
              <button
                className="msg-action-btn p-1 rounded hover:bg-red-100 dark:hover:bg-red-800 opacity-90 hover:opacity-100"
                title="Delete"
                aria-label="Delete"
                onClick={e => { e.stopPropagation(); onDelete?.(msg); }}
              >
                <Trash2 className="w-4 h-4 text-red-500" />
              </button>
              <button
                className="msg-action-btn p-1 rounded hover:bg-blue-100 dark:hover:bg-blue-800 opacity-90 hover:opacity-100"
                title="Reply"
                aria-label="Reply"
                onClick={e => { e.stopPropagation(); onReply?.(msg); }}
              >
                <ReplyIcon className="w-4 h-4 text-blue-500" />
              </button>
            </div>
          </li>
        );
      })}
    </ul>
  );
};

export default MessageList; 
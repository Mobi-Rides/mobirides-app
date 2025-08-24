import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import type { Message } from "@/types/message";
import { useState } from "react";
import { Reply, Share2, Trash2, Star, MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";

const QUICK_RESPONSES = ["Thanks!", "I'll get back to you", "On my way", "👍", "Got it!"];

interface ChatMessagesProps {
  messages: Message[];
  currentUserId: string;
  onReply?: (message: Message) => void;
}

export const ChatMessages = ({ messages, currentUserId, onReply }: ChatMessagesProps) => {
  const [importantIds, setImportantIds] = useState<string[]>([]);
  const [localMessages, setLocalMessages] = useState(messages);
  const [showQuickReplies, setShowQuickReplies] = useState<string | null>(null);
  const [forwardingId, setForwardingId] = useState<string | null>(null);

  const handleDelete = (id: string) => {
    setLocalMessages((msgs) => msgs.filter((m) => m.id !== id));
  };
  const handleToggleImportant = (id: string) => {
    setImportantIds((ids) => ids.includes(id) ? ids.filter(i => i !== id) : [...ids, id]);
  };
  const handleQuickReply = (msgId: string, text: string) => {
    setShowQuickReplies(null);
    // Optionally, trigger a send callback here
  };
  return (
    <ScrollArea className="flex-1 p-4">
      <div className="space-y-6">
        {localMessages.length === 0 && (
          <div className="text-muted-foreground text-center py-8">No messages yet</div>
        )}
        {localMessages.map((message) => {
          const isImportant = importantIds.includes(message.id);
          return (
            <div key={message.id} className={cn("border-b border-muted pb-4 group relative", isImportant && "ring-2 ring-yellow-400")}> 
              <div className="font-semibold flex items-center gap-2">
                {message.sender?.id ? 'User' : message.sender_id}
                <span className="text-xs text-muted-foreground">{new Date(message.created_at).toLocaleDateString()}</span>
              </div>
              <div className="mt-1 text-base text-muted-foreground">
                {message.content}
              </div>
              {/* Quick Actions */}
              <div className="flex gap-1 absolute top-2 right-2 opacity-100">
                <Button variant="ghost" size="icon" className="h-6 w-6 p-0" title="Reply" onClick={() => onReply?.(message)}>
                  <Reply className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" className="h-6 w-6 p-0" title="Forward" onClick={() => setForwardingId(message.id)}>
                  <Share2 className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" className="h-6 w-6 p-0" title="Delete" onClick={() => handleDelete(message.id)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" className={cn("h-6 w-6 p-0", isImportant && "text-yellow-500")}
                  title="Mark as Important" onClick={() => handleToggleImportant(message.id)}>
                  <Star className="h-4 w-4" fill={isImportant ? "#facc15" : "none"} />
                </Button>
                <div className="relative">
                  <Button variant="ghost" size="icon" className="h-6 w-6 p-0" title="Quick Responses" onClick={() => setShowQuickReplies(showQuickReplies === message.id ? null : message.id)}>
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                  {showQuickReplies === message.id && (
                    <div className="absolute right-0 mt-2 z-10 bg-white border rounded shadow-lg min-w-[120px]">
                      {QUICK_RESPONSES.map((resp) => (
                        <button
                          key={resp}
                          className="block w-full text-left px-3 py-1 hover:bg-muted text-sm"
                          onClick={() => handleQuickReply(message.id, resp)}
                        >
                          {resp}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              {/* Forward Modal (UI only) */}
              {forwardingId === message.id && (
                <div className="absolute top-8 right-0 z-20 bg-white border rounded shadow-lg p-4 w-64">
                  <div className="font-semibold mb-2">Forward message</div>
                  <div className="text-xs mb-2">(UI only demo)</div>
                  <input className="w-full border rounded px-2 py-1 mb-2" placeholder="Recipient..." />
                  <div className="flex gap-2 justify-end">
                    <Button size="sm" variant="outline" onClick={() => setForwardingId(null)}>Cancel</Button>
                    <Button size="sm" onClick={() => setForwardingId(null)}>Send</Button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </ScrollArea>
  );
};
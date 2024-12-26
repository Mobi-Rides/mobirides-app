import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import type { Message } from "@/types/message";

interface MessageListProps {
  messages: Message[];
  onMessageClick: (senderId: string, senderName: string | null) => void;
}

export const MessageList = ({ messages, onMessageClick }: MessageListProps) => {
  if (!messages?.length) {
    return (
      <p className="text-center text-muted-foreground">No messages yet</p>
    );
  }

  return (
    <ScrollArea className="h-[300px] rounded-md border p-4">
      {messages.map((message) => (
        <div 
          key={message.id} 
          className="mb-4 cursor-pointer hover:bg-muted p-2 rounded-md transition-colors"
          onClick={() => onMessageClick(message.sender_id, message.sender.full_name)}
        >
          <div className="flex items-center gap-2">
            <span className="font-medium">{message.sender.full_name || 'Unknown User'}</span>
            <span className="text-sm text-muted-foreground">
              {new Date(message.created_at).toLocaleDateString()}
            </span>
          </div>
          <p className="text-sm text-muted-foreground">{message.content}</p>
          <Separator className="my-2" />
        </div>
      ))}
    </ScrollArea>
  );
};
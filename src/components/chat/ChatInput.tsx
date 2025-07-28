import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send } from "lucide-react";

interface ChatInputProps {
  newMessage: string;
  onChange: (value: string) => void;
  onSend: () => void;
  sending: boolean;
  replyingTo?: {
    id: string;
    content: string;
    senderName: string;
  };
  onCancelReply?: () => void;
  hideSendButton?: boolean;
}

export const ChatInput = ({
  newMessage,
  onChange,
  onSend,
  sending,
  replyingTo,
  onCancelReply,
  hideSendButton = false,
}: ChatInputProps) => {
  return (
    <div className="p-4 border-t">
      {replyingTo && (
        <div className="bg-muted p-2 rounded mb-2 flex items-center justify-between">
          <div>
            <span className="text-xs text-muted-foreground">Replying to: </span>
            <span className="font-semibold">{replyingTo.senderName}</span>
            <span className="ml-2 text-xs text-muted-foreground">{replyingTo.content}</span>
          </div>
          <button className="ml-2 text-xs text-primary underline" onClick={onCancelReply}>Cancel</button>
        </div>
      )}
      <div className="flex gap-2">
        <Textarea
          value={newMessage}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Type a message..."
          className="resize-none"
        />
        {!hideSendButton && (
          <Button 
            onClick={onSend}
            disabled={sending || !newMessage.trim()}
            size="icon"
          >
            <Send className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
};
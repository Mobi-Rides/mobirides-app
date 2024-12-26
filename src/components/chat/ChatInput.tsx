import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send } from "lucide-react";

interface ChatInputProps {
  newMessage: string;
  onChange: (value: string) => void;
  onSend: () => void;
  sending: boolean;
}

export const ChatInput = ({
  newMessage,
  onChange,
  onSend,
  sending,
}: ChatInputProps) => {
  return (
    <div className="p-4 border-t">
      <div className="flex gap-2">
        <Textarea
          value={newMessage}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Type a message..."
          className="resize-none"
        />
        <Button 
          onClick={onSend}
          disabled={sending || !newMessage.trim()}
          size="icon"
        >
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};
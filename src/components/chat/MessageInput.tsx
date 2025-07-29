import { useState, useRef, KeyboardEvent } from 'react';
import { 
  Send, 
  Paperclip, 
  Smile, 
  Image, 
  X,
  Mic
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';

interface MessageInputProps {
  placeholder?: string;
  onSendMessage: (content: string) => void;
  onStartTyping?: () => void;
  onStopTyping?: () => void;
  disabled?: boolean;
  replyToMessage?: {
    id: string;
    content: string;
    senderName: string;
  };
  onCancelReply?: () => void;
}

export function MessageInput({
  placeholder = "Type a message...",
  onSendMessage,
  onStartTyping,
  onStopTyping,
  disabled = false,
  replyToMessage,
  onCancelReply
}: MessageInputProps) {
  const [message, setMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout>();

  const handleSend = () => {
    if (message.trim() && !disabled) {
      onSendMessage(message.trim());
      setMessage('');
      handleStopTyping();
      
      // Reset textarea height
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleInputChange = (value: string) => {
    setMessage(value);
    
    // Auto-resize textarea
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }

    // Handle typing indicators
    if (value.trim() && !isTyping) {
      handleStartTyping();
    } else if (!value.trim() && isTyping) {
      handleStopTyping();
    }

    // Reset typing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    if (value.trim()) {
      typingTimeoutRef.current = setTimeout(() => {
        handleStopTyping();
      }, 2000);
    }
  };

  const handleStartTyping = () => {
    if (!isTyping) {
      setIsTyping(true);
      onStartTyping?.();
    }
  };

  const handleStopTyping = () => {
    if (isTyping) {
      setIsTyping(false);
      onStopTyping?.();
    }
    
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
  };

  return (
    <div className="border-t border-notification-border bg-card">
      {/* Reply indicator */}
      {replyToMessage && (
        <div className="flex items-center justify-between p-3 border-b border-notification-border bg-primary/5 rounded-t-lg shadow-sm transition-all duration-200">
          <div className="flex-1 min-w-0 border-l-2 border-primary pl-2">
            <p className="text-xs text-muted-foreground">
              Replying to <span className="font-medium text-primary">{replyToMessage.senderName}</span>
            </p>
            <p className="text-sm text-foreground truncate">
              {replyToMessage.content}
            </p>
          </div>
          <Button
            size="sm"
            variant="ghost"
            onClick={onCancelReply}
            className="h-6 w-6 p-0 ml-2 rounded-full hover:bg-primary/10 transition-colors duration-200"
          >
            <X className="w-4 h-4 text-primary" />
          </Button>
        </div>
      )}

      {/* Input area */}
      <div className="p-4">
        <div className="flex items-end gap-2">
          {/* Attachment button */}
          <Button
            size="sm"
            variant="ghost"
            className="h-9 w-9 p-0 flex-shrink-0 rounded-full hover:bg-primary/10 transition-colors duration-200"
            disabled={disabled}
            onClick={() => {
              const input = document.createElement('input');
              input.type = 'file';
              input.accept = '*/*';
              input.onchange = (e) => {
                const file = (e.target as HTMLInputElement).files?.[0];
                if (file) {
                  console.log('Selected file:', file.name);
                  // TODO: Implement file upload
                }
              };
              input.click();
            }}
          >
            <Paperclip className="w-4 h-4 text-primary" />
          </Button>

          {/* Message input */}
          <div className="flex-1 relative">
            <Textarea
              ref={textareaRef}
              value={message}
              onChange={(e) => handleInputChange(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={placeholder}
              disabled={disabled}
              className={cn(
                "min-h-9 max-h-32 resize-none bg-notification border-notification-border rounded-2xl",
                "focus:ring-1 focus:ring-primary focus:border-primary shadow-sm",
                "pr-20 transition-all duration-200" // Space for emoji and image buttons
              )}
              rows={1}
            />
            
            {/* Input actions */}
            <div className="absolute right-2 bottom-2 flex items-center gap-1">
              <Button
                size="sm"
                variant="ghost"
                className="h-6 w-6 p-0 rounded-full hover:bg-primary/10 transition-colors duration-200"
                disabled={disabled}
                onClick={() => {
                  const input = document.createElement('input');
                  input.type = 'file';
                  input.accept = 'image/*';
                  input.onchange = (e) => {
                    const file = (e.target as HTMLInputElement).files?.[0];
                    if (file) {
                      console.log('Selected image:', file.name);
                      // TODO: Implement image upload
                    }
                  };
                  input.click();
                }}
              >
                <Image className="w-4 h-4 text-primary" />
              </Button>
              
              <Button
                size="sm"
                variant="ghost"
                className="h-6 w-6 p-0 rounded-full hover:bg-primary/10 transition-colors duration-200"
                disabled={disabled}
                onClick={() => {
                  console.log('Emoji picker clicked');
                  // TODO: Implement emoji picker
                }}
              >
                <Smile className="w-4 h-4 text-primary" />
              </Button>
            </div>
          </div>

          {/* Send/Voice button */}
          {message.trim() ? (
            <Button
              size="sm"
              onClick={handleSend}
              disabled={disabled || !message.trim()}
              className="h-9 w-9 p-0 flex-shrink-0 bg-primary hover:bg-primary/90 rounded-full shadow-md transition-all duration-200 ease-in-out transform hover:scale-105"
            >
              <Send className="w-4 h-4" />
            </Button>
          ) : (
            <Button
              size="sm"
              variant="ghost"
              className="h-9 w-9 p-0 flex-shrink-0 rounded-full hover:bg-primary/10 transition-colors duration-200"
              disabled={disabled}
              onClick={() => {
                console.log('Voice recording clicked');
                // TODO: Implement voice recording
              }}
            >
              <Mic className="w-4 h-4 text-primary" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
import { useState } from 'react';
import { X, Minus, Maximize2, MessageCircle } from 'lucide-react';
import { MessagingInterface } from './MessagingInterface';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface ChatPopupProps {
  isOpen: boolean;
  onClose: () => void;
  onMinimize: () => void;
  onMaximize: () => void;
  recipientId?: string;
  recipientName?: string;
  className?: string;
}

export function ChatPopup({
  isOpen,
  onClose,
  onMinimize,
  onMaximize,
  recipientId,
  recipientName,
  className
}: ChatPopupProps) {
  const [isMinimized, setIsMinimized] = useState(false);

  const handleMinimize = () => {
    setIsMinimized(true);
    onMinimize();
  };

  const handleRestore = () => {
    setIsMinimized(false);
  };

  if (!isOpen) return null;

  return (
    <div
      className={cn(
        "fixed bottom-4 right-4 bg-card border border-notification-border rounded-lg shadow-2xl z-50 transition-all duration-300",
        isMinimized 
          ? "w-80 h-12" 
          : "w-96 h-[500px]",
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-notification-border bg-primary/5 rounded-t-lg">
        <div className="flex items-center gap-2">
          <MessageCircle className="w-5 h-5 text-primary" />
          <h3 className="font-medium text-foreground">
            {isMinimized ? 'Chat' : (recipientName || 'Messages')}
          </h3>
        </div>
        
        <div className="flex items-center gap-1">
          <Button
            size="sm"
            variant="ghost"
            onClick={isMinimized ? handleRestore : handleMinimize}
            className="h-6 w-6 p-0 hover:bg-primary/10 rounded-full"
          >
            <Minus className="w-3 h-3" />
          </Button>
          
          <Button
            size="sm"
            variant="ghost"
            onClick={onMaximize}
            className="h-6 w-6 p-0 hover:bg-primary/10 rounded-full"
          >
            <Maximize2 className="w-3 h-3" />
          </Button>
          
          <Button
            size="sm"
            variant="ghost"
            onClick={onClose}
            className="h-6 w-6 p-0 hover:bg-destructive/10 rounded-full"
          >
            <X className="w-3 h-3" />
          </Button>
        </div>
      </div>

      {/* Content */}
      {!isMinimized && (
        <div className="h-[calc(100%-49px)] flex flex-col">
          <MessagingInterface
            className="flex-1 border-0"
            recipientId={recipientId}
            recipientName={recipientName}
          />
        </div>
      )}
    </div>
  );
}
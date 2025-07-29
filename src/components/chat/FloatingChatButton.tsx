import { useState } from 'react';
import { MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface FloatingChatButtonProps {
  onClick: () => void;
  unreadCount?: number;
  className?: string;
}

export function FloatingChatButton({
  onClick,
  unreadCount = 0,
  className
}: FloatingChatButtonProps) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div className={cn("fixed bottom-6 right-6 z-40", className)}>
      <Button
        size="lg"
        onClick={onClick}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className={cn(
          "h-14 w-14 rounded-full shadow-lg hover:shadow-xl transition-all duration-300",
          "bg-primary hover:bg-primary/90 relative transform hover:scale-110",
          isHovered && "animate-pulse"
        )}
      >
        <MessageCircle className="w-6 h-6" />
        
        {unreadCount > 0 && (
          <Badge 
            variant="destructive"
            className="absolute -top-2 -right-2 h-6 min-w-6 flex items-center justify-center text-xs px-1.5 animate-bounce"
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </Badge>
        )}
      </Button>
    </div>
  );
}
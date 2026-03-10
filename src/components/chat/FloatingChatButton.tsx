import { useState } from 'react';
import { MessageCircle, GraduationCap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

interface FloatingChatButtonProps {
  onClick: () => void;
  unreadCount?: number;
  className?: string;
  onStartTutorial?: () => void;
}

export function FloatingChatButton({
  onClick,
  unreadCount = 0,
  className,
  onStartTutorial,
}: FloatingChatButtonProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [open, setOpen] = useState(false);

  const handleChatClick = () => {
    setOpen(false);
    onClick();
  };

  const handleTutorialClick = () => {
    setOpen(false);
    onStartTutorial?.();
  };

  return (
    <div className={cn('fixed bottom-[25vh] right-6 z-40', className)}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            size="lg"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            className={cn(
              'h-14 w-14 rounded-full shadow-lg hover:shadow-xl transition-all duration-300',
              'bg-primary hover:bg-primary/90 relative transform hover:scale-110',
              isHovered && 'animate-pulse'
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
        </PopoverTrigger>
        <PopoverContent
          side="top"
          align="end"
          className="w-48 p-1.5"
        >
          <button
            onClick={handleChatClick}
            className="flex items-center gap-2 w-full rounded-md px-3 py-2 text-sm hover:bg-accent transition-colors"
          >
            <MessageCircle className="h-4 w-4" />
            Messages
          </button>
          {onStartTutorial && (
            <button
              onClick={handleTutorialClick}
              className="flex items-center gap-2 w-full rounded-md px-3 py-2 text-sm hover:bg-accent transition-colors"
            >
              <GraduationCap className="h-4 w-4" />
              Start Tutorial
            </button>
          )}
        </PopoverContent>
      </Popover>
    </div>
  );
}

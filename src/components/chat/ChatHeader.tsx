import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { DrawerTitle } from "@/components/ui/drawer";
import { ChevronLeft, ChevronRight, X } from "lucide-react";

interface ChatHeaderProps {
  receiverName: string;
  receiverAvatar: string | null;
  onClose: () => void;
  onPrevious?: () => void;
  onNext?: () => void;
  isOnline?: boolean;
}

export const ChatHeader = ({
  receiverName,
  receiverAvatar,
  onClose,
  onPrevious,
  onNext,
  isOnline,
}: ChatHeaderProps) => {
  return (
    <div className="flex items-center justify-between p-4">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
        <div className="flex items-center gap-3">
          <div className="flex flex-col">
            <DrawerTitle className="flex items-center gap-2">
              {receiverName}
              {isOnline && (
                <span className="flex h-2 w-2 rounded-full bg-green-500 ring-2 ring-white dark:ring-gray-900" title="Active now" />
              )}
            </DrawerTitle>
            {isOnline && (
              <span className="text-xs text-green-600 font-medium">Active now</span>
            )}
          </div>
          <div className="relative">
            <Avatar className="h-8 w-8">
              <AvatarImage src={receiverAvatar || undefined} alt={receiverName} />
              <AvatarFallback>
                {receiverName.split(' ').map(n => n[0]).join('')}
              </AvatarFallback>
            </Avatar>
            {isOnline && (
              <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-green-500 ring-2 ring-white dark:ring-gray-900" />
            )}
          </div>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" onClick={onPrevious}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" onClick={onNext}>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};
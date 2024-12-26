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
}

export const ChatHeader = ({
  receiverName,
  receiverAvatar,
  onClose,
  onPrevious,
  onNext,
}: ChatHeaderProps) => {
  return (
    <div className="flex items-center justify-between p-4">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
        <div className="flex items-center gap-3">
          <DrawerTitle>{receiverName}</DrawerTitle>
          <Avatar className="h-8 w-8">
            <AvatarImage src={receiverAvatar || undefined} alt={receiverName} />
            <AvatarFallback>
              {receiverName.split(' ').map(n => n[0]).join('')}
            </AvatarFallback>
          </Avatar>
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
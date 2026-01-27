import { Button } from "@/components/ui/button";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { X } from "lucide-react";

interface QuickReplySuggestionsProps {
  onSelect: (text: string) => void;
  onClose: () => void;
  userRole: 'host' | 'renter' | 'admin' | 'super_admin';
  isVisible: boolean;
}

export const QuickReplySuggestions = ({ onSelect, onClose, userRole, isVisible }: QuickReplySuggestionsProps) => {
  if (!isVisible) return null;

  const renterReplies = [
    "Is this car still available?",
    "What's the pickup location?",
    "Can I extend my booking?",
    "What documents do I need?",
    "I'm running a bit late.",
  ];

  const hostReplies = [
    "Yes, it's available! When would you like to book?",
    "The pickup location is at...",
    "Sure, I can extend your booking.",
    "Please have your valid ID and driver's license ready.",
    "No problem, thanks for letting me know.",
  ];

  // Admins and hosts get host-style replies (answering questions)
  const replies = (userRole === 'host' || userRole === 'admin' || userRole === 'super_admin') ? hostReplies : renterReplies;

  return (
    <div className="w-full border-t border-border/50 bg-background/50 backdrop-blur-sm py-2 relative group">
      <div className="absolute right-2 top-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 rounded-full bg-background/80 hover:bg-background shadow-sm"
          onClick={onClose}
        >
          <X className="h-3 w-3" />
        </Button>
      </div>
      <ScrollArea className="w-full whitespace-nowrap">
        <div className="flex w-max space-x-2 px-4 pr-10">
          {replies.map((reply, index) => (
            <Button
              key={index}
              variant="secondary"
              size="sm"
              className="rounded-full bg-primary/5 hover:bg-primary/10 text-xs h-7 px-3 border border-primary/10"
              onClick={() => onSelect(reply)}
            >
              {reply}
            </Button>
          ))}
        </div>
        <ScrollBar orientation="horizontal" className="invisible" />
      </ScrollArea>
    </div>
  );
};

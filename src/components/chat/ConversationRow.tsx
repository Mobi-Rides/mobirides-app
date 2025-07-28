import React from "react";
import { Avatar } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";

interface ConversationRowProps {
  name: string;
  avatar?: string | null;
  lastMessage: string;
  lastDate: string;
  unread?: boolean;
  active?: boolean;
  onClick?: () => void;
}

function getInitials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase();
}

export const ConversationRow: React.FC<ConversationRowProps> = ({
  name,
  avatar,
  lastMessage,
  lastDate,
  unread,
  active,
  onClick,
}) => {
  return (
    <div
      className={cn(
        "flex items-center gap-3 p-3 rounded-lg cursor-pointer transition hover:bg-blue-50 dark:hover:bg-blue-900",
        unread && "font-bold bg-blue-50 dark:bg-blue-950",
        active && "ring-2 ring-blue-400 bg-blue-100 dark:bg-blue-900"
      )}
      onClick={onClick}
      tabIndex={0}
      role="button"
      aria-label={`Open conversation with ${name}`}
    >
      <div className="w-10 h-10">
        {avatar ? (
          <Avatar className="w-10 h-10">
            <img src={avatar} alt={name} />
          </Avatar>
        ) : (
          <div className="w-10 h-10 rounded-full bg-blue-200 flex items-center justify-center font-bold text-blue-700 text-lg">
            {getInitials(name)}
          </div>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <span className="truncate font-semibold text-base text-gray-900 dark:text-gray-100">{name}</span>
          <span className="text-xs text-gray-400 ml-2 whitespace-nowrap">
            {formatDistanceToNow(new Date(lastDate), { addSuffix: true })}
          </span>
        </div>
        <div className="text-sm text-gray-600 dark:text-gray-300 truncate max-w-xs">
          {lastMessage}
        </div>
      </div>
      {unread && <span className="w-2 h-2 bg-blue-500 rounded-full ml-2" />}
    </div>
  );
};

export default ConversationRow; 
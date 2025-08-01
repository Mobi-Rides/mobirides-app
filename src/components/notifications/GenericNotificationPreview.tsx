import React from "react";
import { Database } from "@/integrations/supabase/types";

type Notification = Database["public"]["Tables"]["notifications"]["Row"];

export function GenericNotificationPreview({ notification, confidence }: { notification: Notification; confidence?: number }) {
  let badgeColor = "bg-green-500";
  if (typeof confidence === 'number') {
    if (confidence < 70) badgeColor = "bg-red-500";
    else if (confidence < 90) badgeColor = "bg-yellow-400 text-black";
  }
  return (
    <div>
      {/* ...existing generic preview content... */}
      <div>{notification.content}</div>
      {typeof confidence === 'number' && (
        <div className="flex items-center gap-2 mt-1">
          <span
            className={`inline-block px-2 py-0.5 rounded text-xs font-semibold text-white ${badgeColor}`}
            title="Confidence: How certain the system is about this classification."
          >
            {confidence}%
          </span>
          <span className="text-xs text-muted-foreground">Confidence</span>
        </div>
      )}
    </div>
  );
} 
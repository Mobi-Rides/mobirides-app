import React from "react";
import { Database } from "@/integrations/supabase/types";
import { Car, MapPin, Clock } from "lucide-react";

type Notification = Database["public"]["Tables"]["notifications"]["Row"];

export function HandoverNotificationPreview({ notification, confidence }: { notification: Notification; confidence?: number }) {
  let badgeColor = "bg-green-500";
  if (typeof confidence === 'number') {
    if (confidence < 70) badgeColor = "bg-red-500";
    else if (confidence < 90) badgeColor = "bg-yellow-400 text-black";
  }

  const isPickup = notification.type?.includes('pickup');
  const isReturn = notification.type?.includes('return');
  const isHandover = notification.type?.includes('handover');

  const getIcon = () => {
    if (isPickup) return <Car className="h-4 w-4 text-blue-500" />;
    if (isReturn) return <MapPin className="h-4 w-4 text-orange-500" />;
    return <Clock className="h-4 w-4 text-purple-500" />;
  };

  const getTypeLabel = () => {
    if (isPickup) return "Pickup";
    if (isReturn) return "Return";
    if (isHandover) return "Handover";
    return "Location";
  };

  return (
    <div className="flex items-start gap-3">
      <div className="flex-shrink-0 mt-1">
        {getIcon()}
      </div>
      <div className="flex-1">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            {getTypeLabel()}
          </span>
        </div>
        <div>
          <h4 className="text-sm font-medium">{notification.title}</h4>
          <p className="text-xs text-muted-foreground mt-1">{notification.description}</p>
        </div>
        {typeof confidence === 'number' && (
          <div className="flex items-center gap-2 mt-2">
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
    </div>
  );
}
import { Star, User } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Host } from "@/services/hostService";

interface HostPopupProps {
  host: Host;
  onViewCars: (hostId: string) => void;
}

export const HostPopup = ({ host, onViewCars }: HostPopupProps) => {
  const getAvatarUrl = () => {
    if (!host.avatar_url) return "/placeholder.svg";
    return supabase.storage
      .from("avatars")
      .getPublicUrl(host.avatar_url).data.publicUrl;
  };

  return (
    <div className="bg-background border rounded-lg shadow-lg p-3 min-w-[200px] cursor-pointer hover:bg-muted/50 transition-colors"
         onClick={() => onViewCars(host.id)}>
      <div className="flex items-center gap-3">
        {host.avatar_url ? (
          <img 
            src={getAvatarUrl()} 
            alt={host.full_name || "Host"} 
            className="w-12 h-12 rounded-full object-cover"
          />
        ) : (
          <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
            <User className="w-6 h-6 text-muted-foreground" />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-sm truncate">
            {host.full_name || "Host"}
          </h4>
          <div className="flex items-center gap-1 mt-1">
            <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
            <span className="text-xs text-muted-foreground">4.8 (32)</span>
          </div>
          <p className="text-xs text-primary mt-1">View available cars →</p>
        </div>
      </div>
    </div>
  );
};
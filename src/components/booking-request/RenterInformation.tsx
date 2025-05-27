
import { Star } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface RenterInformationProps {
  renter: {
    full_name: string;
    avatar_url?: string;
  };
  renterRating?: number | null;
}

export const RenterInformation = ({ renter, renterRating }: RenterInformationProps) => {
  return (
    <div className="bg-card rounded-lg p-4 border">
      <h2 className="text-lg font-semibold mb-4 flex items-center">
        <span className="p-1.5 rounded-full bg-primary/10 dark:bg-primary/20 mr-2">
          <Star className="h-4 w-4 text-primary" />
        </span>
        Renter Information
      </h2>
      <div className="flex items-center gap-4">
        <img 
          src={renter.avatar_url ? supabase.storage.from('avatars').getPublicUrl(renter.avatar_url).data.publicUrl : "/placeholder.svg"} 
          alt={renter.full_name} 
          className="w-16 h-16 rounded-full object-cover border-2 border-primary/20"
        />
        <div>
          <p className="font-medium text-foreground">{renter.full_name}</p>
          {typeof renterRating === 'number' && (
            <div className="flex items-center gap-1 text-yellow-500 mt-1">
              <Star className="h-4 w-4 fill-current" />
              <span>{renterRating.toFixed(1)}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

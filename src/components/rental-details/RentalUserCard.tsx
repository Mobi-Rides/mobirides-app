
import { User } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";

interface RentalUserCardProps {
  user: {
    full_name: string | null;
    avatar_url: string | null;
  };
  role: "Renter" | "Host";
}

export const RentalUserCard = ({ user, role }: RentalUserCardProps) => {
  return (
    <Card className="dark:bg-gray-800 dark:border-gray-700">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center gap-2 dark:text-white">
          <User className="h-5 w-5 text-primary dark:text-primary-foreground" />
          {role}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-3">
          <img
            src={
              user.avatar_url
                ? supabase.storage
                    .from("avatars")
                    .getPublicUrl(user.avatar_url).data
                    .publicUrl
                : "/placeholder.svg"
            }
            alt={user.full_name || role}
            className="w-12 h-12 rounded-full object-cover bg-muted"
          />
          <div>
            <p className="font-semibold">{user.full_name || role}</p>
            <p className="text-sm text-muted-foreground">Vehicle {role}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

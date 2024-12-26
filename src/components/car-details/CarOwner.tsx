import { Button } from "@/components/ui/button";
import { MessageCircle } from "lucide-react";

interface CarOwnerProps {
  ownerName: string;
  avatarUrl: string;
}

export const CarOwner = ({ ownerName, avatarUrl }: CarOwnerProps) => {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <img
          src={avatarUrl}
          alt={ownerName || "Car Owner"}
          className="w-12 h-12 rounded-full object-cover bg-muted"
        />
        <div>
          <p className="font-semibold">{ownerName || "Car Owner"}</p>
          <p className="text-sm text-muted-foreground">Car Owner</p>
        </div>
      </div>
      <Button className="gap-2">
        <MessageCircle className="h-4 w-4" />
        Contact Owner
      </Button>
    </div>
  );
};
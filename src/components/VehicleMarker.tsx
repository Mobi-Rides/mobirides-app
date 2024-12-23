import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { Car } from "lucide-react";

interface VehicleMarkerProps {
  price: number;
  brand: string;
  model: string;
  type: string;
  rating: number;
  distance: string;
}

export const VehicleMarker = ({ price, brand, model, type, rating, distance }: VehicleMarkerProps) => {
  return (
    <HoverCard>
      <HoverCardTrigger asChild>
        <div className="bg-primary text-white px-2 py-1 rounded-full cursor-pointer flex items-center gap-1">
          <Car className="h-4 w-4" />
          <span>BWP {price}</span>
        </div>
      </HoverCardTrigger>
      <HoverCardContent className="w-80">
        <div className="space-y-2">
          <h4 className="text-sm font-semibold">{brand} {model}</h4>
          <div className="text-sm text-muted-foreground">
            <div className="flex justify-between">
              <span>{type}</span>
              <span>{distance}</span>
            </div>
            <div className="flex items-center mt-1">
              <span className="text-yellow-400">★</span>
              <span className="ml-1">{rating.toFixed(1)}</span>
            </div>
          </div>
        </div>
      </HoverCardContent>
    </HoverCard>
  );
};
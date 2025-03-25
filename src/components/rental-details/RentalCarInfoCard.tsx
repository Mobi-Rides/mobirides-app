
import { Car, KeyRound, MapPin } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface RentalCarInfoCardProps {
  car: {
    id: string;
    brand: string;
    model: string;
    year: number;
    price_per_day: number;
    location: string;
    image_url: string | null;
  };
}

export const RentalCarInfoCard = ({ car }: RentalCarInfoCardProps) => {
  const navigate = useNavigate();

  return (
    <Card className="overflow-hidden border-border shadow-sm">
      <CardHeader className="p-4 bg-muted/30">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Car className="h-5 w-5 text-primary" />
          Vehicle Information
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <img
            src={car.image_url || "/placeholder.svg"}
            alt={`${car.brand} ${car.model}`}
            className="w-full sm:w-32 h-32 sm:h-24 object-cover rounded-lg"
          />
          <div className="flex flex-col justify-between">
            <div>
              <h3 className="font-semibold text-lg">
                {car.brand} {car.model} ({car.year})
              </h3>
              <div className="flex items-center gap-1 text-muted-foreground mt-1">
                <MapPin className="h-4 w-4" />
                <span>{car.location}</span>
              </div>
            </div>
            <p className="text-lg font-medium mt-2">BWP {car.price_per_day} per day</p>
          </div>
        </div>
      </CardContent>
      <CardFooter className="p-4 bg-muted/10 border-t">
        <Button 
          variant="outline"
          size="sm"
          onClick={() => navigate(`/car/${car.id}`)} 
          className="text-xs"
        >
          View Vehicle Details
        </Button>
      </CardFooter>
    </Card>
  );
};

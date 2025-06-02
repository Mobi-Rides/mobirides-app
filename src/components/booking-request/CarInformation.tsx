
import { Car, MapPin, CreditCard } from "lucide-react";

interface CarInformationProps {
  car: {
    brand: string;
    model: string;
    image_url?: string;
    location: string;
    price_per_day: number;
  };
}

export const CarInformation = ({ car }: CarInformationProps) => {
  return (
    <div className="bg-card rounded-lg p-4 border">
      <h2 className="text-lg font-semibold mb-4 flex items-center">
        <span className="p-1.5 rounded-full bg-primary/10 dark:bg-primary/20 mr-2">
          <Car className="h-4 w-4 text-primary" />
        </span>
        Requested Car
      </h2>
      <div className="flex flex-col md:flex-row gap-4">
        <img 
          src={car.image_url || "/placeholder.svg"} 
          alt={`${car.brand} ${car.model}`} 
          className="w-full md:w-48 h-32 object-cover rounded-lg"
        />
        <div className="space-y-2">
          <p className="font-medium text-lg text-foreground">{car.brand} {car.model}</p>
          <p className="text-sm text-muted-foreground flex items-center">
            <MapPin className="h-4 w-4 mr-1" />
            {car.location}
          </p>
          <p className="text-sm font-medium flex items-center">
            <CreditCard className="h-4 w-4 mr-1 text-primary" />
            BWP {car.price_per_day} per day
          </p>
        </div>
      </div>
    </div>
  );
};

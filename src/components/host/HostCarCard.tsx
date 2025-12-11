import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Eye, Edit, Calendar } from "lucide-react";
import type { SafeCar } from "@/types/car";

interface HostCar extends SafeCar {
  view_count?: number;
}

interface HostCarCardProps {
  car: HostCar;
}

export const HostCarCard = ({ car }: HostCarCardProps) => {
  const navigate = useNavigate();

  return (
    <Card className="overflow-hidden flex flex-col h-full hover:shadow-md transition-shadow">
      <div className="relative h-48 w-full">
        <img
          src={car.image_url}
          alt={`${car.brand} ${car.model}`}
          className="w-full h-full object-cover"
          onError={(e) => {
            (e.target as HTMLImageElement).src = '/placeholder-car.jpg';
          }}
        />
        <div className="absolute top-2 right-2 bg-black/70 text-white px-2 py-1 rounded-full text-xs flex items-center gap-1">
          <Eye className="w-3 h-3" />
          <span>{car.view_count || 0} views</span>
        </div>
      </div>
      
      <div className="p-4 flex flex-col flex-1">
        <div className="flex justify-between items-start mb-2">
          <h3 className="font-semibold text-lg line-clamp-1">
            {car.brand} {car.model}
          </h3>
          <div className="text-right">
            <p className="font-bold text-primary">
              P{car.price_per_day}
            </p>
            <p className="text-xs text-muted-foreground">/day</p>
          </div>
        </div>
        
        <p className="text-sm text-muted-foreground mb-4 line-clamp-2 flex-1">
          {car.location}
        </p>

        <div className="flex gap-2 mt-auto">
          <Button 
            variant="outline" 
            className="flex-1"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              navigate(`/edit-car/${car.id}`);
            }}
          >
            <Edit className="w-4 h-4 mr-2" />
            Edit
          </Button>
          <Button 
            className="flex-1"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              navigate(`/cars/${car.id}`);
            }}
          >
            <Calendar className="w-4 h-4 mr-2" />
            View
          </Button>
        </div>
      </div>
    </Card>
  );
};

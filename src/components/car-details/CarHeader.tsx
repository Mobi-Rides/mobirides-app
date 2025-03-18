
import { Link } from "react-router-dom";
import { CalendarDays, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useParams } from "react-router-dom";

interface CarHeaderProps {
  brand: string;
  model: string;
  year: number;
  location: string;
}

export const CarHeader = ({ brand, model, year, location }: CarHeaderProps) => {
  const { id } = useParams<{ id: string }>();
  
  return (
    <>
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-semibold">{brand} {model}</h1>
          <p className="text-muted-foreground">{year} • {location}</p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm"
            asChild
            className="rounded-full bg-white/90 backdrop-blur-sm shadow-lg hover:bg-white transition-colors"
          >
            <Link to={`/cars/${id}`}>
              <Info className="h-5 w-5 text-primary" />
              <span className="sr-only">View Car Details</span>
            </Link>
          </Button>
          <Link 
            to="/bookings" 
            className="bg-white/90 backdrop-blur-sm p-2 rounded-full shadow-lg hover:bg-white transition-colors"
          >
            <CalendarDays className="h-5 w-5 text-primary" />
          </Link>
        </div>
      </div>
    </>
  );
};

import { Link } from "react-router-dom";
import { CalendarDays } from "lucide-react";

interface CarHeaderProps {
  brand: string;
  model: string;
  year: number;
  location: string;
}

export const CarHeader = ({ brand, model, year, location }: CarHeaderProps) => {
  return (
    <>
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-semibold">{brand} {model}</h1>
          <p className="text-muted-foreground">{year} • {location}</p>
        </div>
        <Link 
          to="/bookings" 
          className="bg-white/90 backdrop-blur-sm p-2 rounded-full shadow-lg hover:bg-white transition-colors"
        >
          <CalendarDays className="h-5 w-5 text-primary" />
        </Link>
      </div>
    </>
  );
};
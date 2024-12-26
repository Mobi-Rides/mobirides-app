import { Link } from "react-router-dom";
import { CalendarDays } from "lucide-react";

interface CarHeaderProps {
  brand: string;
  model: string;
  year: number;
  location: string;
  imageUrl: string;
}

export const CarHeader = ({ brand, model, year, location, imageUrl }: CarHeaderProps) => {
  return (
    <>
      <div className="relative">
        <img
          src={imageUrl || "/placeholder.svg"}
          alt={`${brand} ${model}`}
          className="w-full h-64 object-cover rounded-lg"
        />
        <Link 
          to="/bookings" 
          className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm p-2 rounded-full shadow-lg hover:bg-white transition-colors"
        >
          <CalendarDays className="h-5 w-5 text-primary" />
        </Link>
      </div>

      <div>
        <h1 className="text-2xl font-semibold">{brand} {model}</h1>
        <p className="text-muted-foreground">{year} • {location}</p>
      </div>
    </>
  );
};
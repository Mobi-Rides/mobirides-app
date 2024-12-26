import { Heart, Car, MapPin, Calendar } from "lucide-react";
import { useState } from "react";
import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { useNavigate } from "react-router-dom";

interface CarCardProps {
  brand: string;
  model: string;
  price: number;
  image: string;
  rating: number;
  transmission: string;
  fuel: string;
  seats: number;
  location: string;
  year: number;
  id: string;
}

export const CarCard = ({
  brand,
  model,
  price,
  image,
  rating,
  transmission,
  fuel,
  seats,
  location,
  year,
  id,
}: CarCardProps) => {
  const [isFavorite, setIsFavorite] = useState(false);
  const navigate = useNavigate();

  const handleViewDetails = () => {
    navigate(`/cars/${id}`);
  };

  const handleBookNow = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigate(`/book/${id}`);
  };

  return (
    <Card className="overflow-hidden group cursor-pointer transition-all duration-300 hover:shadow-lg">
      <div className="relative">
        <img
          src={image}
          alt={`${brand} ${model}`}
          className="w-full h-48 object-cover"
        />
        <button
          onClick={(e) => {
            e.stopPropagation();
            setIsFavorite(!isFavorite);
          }}
          className="absolute top-3 right-3 p-2 rounded-full bg-white/80 hover:bg-white transition-colors"
        >
          <Heart
            className={`w-5 h-5 ${
              isFavorite ? "fill-red-500 text-red-500" : "text-gray-600"
            }`}
          />
        </button>
      </div>
      <div className="p-4">
        <div className="flex justify-between items-start mb-2">
          <div>
            <h3 className="font-semibold text-lg">{`${brand} ${model}`}</h3>
            <div className="flex items-center gap-1">
              <span className="text-yellow-400">★</span>
              <span className="text-sm text-gray-600">{rating.toFixed(1)}</span>
            </div>
          </div>
          <div className="text-right">
            <p className="text-primary font-bold">BWP {price}/day</p>
            <p className="text-sm text-gray-500">{year}</p>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <MapPin className="w-4 h-4" />
            <span className="truncate">{location}</span>
          </div>

          <div className="grid grid-cols-3 gap-2 text-sm text-gray-600">
            <span className="flex items-center gap-1">
              <Car className="w-4 h-4" />
              {transmission}
            </span>
            <span className="flex items-center gap-1">
              <i className="w-4 h-4">⛽</i>
              {fuel}
            </span>
            <span className="flex items-center gap-1">
              <i className="w-4 h-4">👥</i>
              {seats} Seats
            </span>
          </div>
        </div>

        <div className="mt-4 flex gap-2">
          <Button
            variant="outline"
            className="flex-1"
            onClick={(e) => {
              e.stopPropagation();
              handleViewDetails();
            }}
          >
            View Details
          </Button>
          <Button className="flex-1" onClick={handleBookNow}>
            Book Now
          </Button>
        </div>
      </div>
    </Card>
  );
};
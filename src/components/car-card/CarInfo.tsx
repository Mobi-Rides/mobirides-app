import { MapPin } from "lucide-react";

interface CarInfoProps {
  brand: string;
  model: string;
  rating: number;
  price: number;
  year: number;
  location: string;
}

export const CarInfo = ({
  brand,
  model,
  rating,
  price,
  year,
  location,
}: CarInfoProps) => {
  return (
    <div>
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

      <div className="flex items-center gap-2 text-sm text-gray-600">
        <MapPin className="w-4 h-4" />
        <span className="truncate">{location}</span>
      </div>
    </div>
  );
};
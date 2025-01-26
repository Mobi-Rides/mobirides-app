import { Car } from "lucide-react";

interface CarSpecsProps {
  transmission: string;
  fuel: string;
  seats: number;
}

export const CarSpecs = ({ transmission, fuel, seats }: CarSpecsProps) => {
  return (
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
  );
};
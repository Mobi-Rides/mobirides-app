import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Fuel, GaugeCircle, Users, Heart } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { saveCar, unsaveCar } from "@/services/savedCarService";
import type { SafeCar } from "@/types/car";
import { Separator } from "./ui/separator";

interface CarCardProps {
  car: SafeCar;
}

export const CarCard = ({ car }: CarCardProps) => {
  const [isSaved, setIsSaved] = useState(car.isSaved ?? false);
  const [isSaving, setIsSaving] = useState(false);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const handleCardClick = () => {
    navigate(`/cars/${car.id}`);
  };

  const handleSaveClick = async (e: React.MouseEvent) => {
    e.stopPropagation();

    if (isSaving) return;

    setIsSaving(true);
    try {
      if (isSaved) {
        const success = await unsaveCar(car.id);
        if (success) {
          setIsSaved(false);
          queryClient.invalidateQueries({ queryKey: ["saved-cars-full"] });
          queryClient.invalidateQueries({ queryKey: ["saved-car-ids"] });
        }
      } else {
        const success = await saveCar(car.id);
        if (success) {
          setIsSaved(true);
          queryClient.invalidateQueries({ queryKey: ["saved-cars-full"] });
          queryClient.invalidateQueries({ queryKey: ["saved-car-ids"] });
        }
      }
    } finally {
      setIsSaving(false);
    }
  };

  const getCarType = (seats: number) => {
    if (seats <= 2) return "Sports";
    if (seats <= 5) return "Sedan";
    if (seats <= 7) return "SUV";
    return "Van";
  };

  return (
    <Card
      className="overflow-hidden cursor-pointer transition-transform hover:scale-[1.02] h-auto min-h-[20rem] sm:h-[24rem] dark:bg-gray-800 dark:border-gray-700"
      onClick={handleCardClick}
    >
      <div className="relative h-40 sm:h-48">
        <img
          src={car.image_url}
          alt={`${car.brand} ${car.model}`}
          className="w-full h-full object-cover"
          onError={(e) => {
            (e.target as HTMLImageElement).src = '/placeholder-car.jpg';
          }}
        />
        <button
          onClick={handleSaveClick}
          className="absolute top-2 right-2 p-2 bg-white dark:bg-gray-800 rounded-full shadow-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          disabled={isSaving}
        >
          <Heart
            className={`w-5 h-5 ${
              isSaving
                ? "text-gray-400"
                : isSaved
                  ? "fill-red-500 text-red-500"
                  : "text-gray-600"
            }`}
          />
        </button>
      </div>
      <div className="p-3 sm:p-4 flex flex-col flex-1">
        <span className="px-3 py-1 rounded-md text-xs md:text-sm bg-[#F1F0FB] dark:bg-[#352a63] text-[#7C3AED] dark:text-[#a87df8] w-fit mb-2">
          {getCarType(car.seats)}
        </span>
        <div className="flex justify-between items-start mb-2 min-h-[3rem]">
          <div className="flex-1">
            <h3 className="font-semibold text-left break-words line-clamp-2 text-sm md:text-base dark:text-white">
              {car.brand} {car.model}
            </h3>
          </div>
          <div className="text-right ml-2">
            <div className="flex items-center gap-1 justify-end">
              <p className="font-semibold whitespace-nowrap text-primary dark:text-primary-foreground">
                BWP {car.price_per_day}
              </p>
              <p className="text-xs text-gray-400 dark:text-gray-500">/day</p>
            </div>
          </div>
        </div>
        <Separator className="w-full my-2 sm:my-3 dark:bg-gray-700" />
        <div className="grid grid-cols-3 gap-1 sm:gap-2 mb-3 sm:mb-4 text-[0.7rem] sm:text-sm">
          <div className="flex items-center justify-left gap-1 text-sm text-gray-400 dark:text-gray-300">
            <GaugeCircle className="w-4 h-4 text-primary dark:text-primary-foreground" />
            {car.transmission}
          </div>
          <div className="flex items-center justify-left gap-1 text-sm text-gray-400 dark:text-gray-300">
            <Fuel className="w-4 h-4 text-primary dark:text-primary-foreground" />
            {car.fuel}
          </div>
          <div className="flex items-center justify-left gap-1 text-sm text-gray-400 dark:text-gray-300">
            <Users className="w-4 h-4 text-primary dark:text-primary-foreground" />
            {car.seats} Seats
          </div>
        </div>
      </div>
    </Card>
  );
};

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Fuel, GaugeCircle, Users, Heart, Star, Loader2 } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { saveCar, unsaveCar } from "@/services/savedCarService";
import type { SafeCar } from "@/types/car";
import { Separator } from "./ui/separator";
import { cn } from "@/lib/utils";
import { TouchTarget } from "@/components/ui/TouchTarget";
import { getCarImagePublicUrl } from "@/utils/carImageUtils";

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

  const renderStars = (rating: number) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;

    for (let i = 0; i < 5; i++) {
      if (i < fullStars) {
        stars.push(
          <Star key={i} className="w-3 h-3 fill-yellow-400 text-yellow-400" aria-hidden="true" />
        );
      } else if (i === fullStars && hasHalfStar) {
        stars.push(
          <Star key={i} className="w-3 h-3 fill-yellow-400/50 text-yellow-400" aria-hidden="true" />
        );
      } else {
        stars.push(
          <Star key={i} className="w-3 h-3 text-gray-300 dark:text-gray-600" aria-hidden="true" />
        );
      }
    }
    return stars;
  };

  const isNewListing = (car.rating === 4.0 || car.rating === 4) && (car.reviewCount === 0 || !car.reviewCount);

  return (
    <Card
      className="overflow-hidden cursor-pointer transition-all duration-200 hover:scale-[1.02] hover:shadow-lg h-auto min-h-[20rem] sm:h-[24rem] dark:bg-gray-800 dark:border-gray-700 active:scale-[0.98] touch-manipulation"
      onClick={handleCardClick}
      role="article"
      aria-label={`${car.brand} ${car.model} - P${car.price_per_day} per day`}
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleCardClick();
        }
      }}
    >
      <div className="relative h-40 sm:h-48">
        <img
          src={car.image_url || '/placeholder.svg'}
          alt={`${car.brand} ${car.model}`}
          className="w-full h-full object-cover"
          loading="lazy"
          onError={(e) => {
            (e.target as HTMLImageElement).src = '/placeholder.svg';
          }}
        />
        {/* Save button with proper touch target */}
        <TouchTarget
          className="absolute top-2 right-2"
          minWidth={44}
          minHeight={44}
          activeFeedback={false}
        >
          <button
            onClick={handleSaveClick}
            className={cn(
              "p-2.5 bg-white/95 dark:bg-gray-800/95 rounded-full shadow-md",
              "hover:bg-gray-100 dark:hover:bg-gray-700",
              "active:scale-90 transition-all duration-150",
              "disabled:opacity-50 disabled:cursor-not-allowed",
              "flex items-center justify-center w-10 h-10"
            )}
            disabled={isSaving}
            aria-label={isSaved ? "Remove from saved cars" : "Save this car"}
            aria-pressed={isSaved}
          >
            {isSaving ? (
              <Loader2 className="w-5 h-5 animate-spin text-gray-400" aria-hidden="true" />
            ) : (
              <Heart
                className={cn(
                  "w-5 h-5 transition-colors duration-200",
                  isSaved
                    ? "fill-red-500 text-red-500"
                    : "text-gray-600 dark:text-gray-300"
                )}
                aria-hidden="true"
              />
            )}
          </button>
        </TouchTarget>
      </div>

      <div className="p-3 sm:p-4 flex flex-col flex-1">
        {/* Type and Rating */}
        <div className="flex items-center justify-between mb-2">
          <span className="px-3 py-1.5 rounded-md text-xs md:text-sm bg-[#F1F0FB] dark:bg-[#352a63] text-[#7C3AED] dark:text-[#a87df8] w-fit font-medium">
            {getCarType(car.seats)}
          </span>
          <div className="flex items-center gap-1" aria-label={`Rating: ${(car.rating || 0).toFixed(1)} out of 5 stars`}>
            <div className="flex items-center" role="img" aria-hidden="true">
              {renderStars(car.rating || 0)}
            </div>
            <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">
              {(car.rating || 0).toFixed(1)}
            </span>
            {isNewListing && (
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 font-medium ml-1">
                New
              </span>
            )}
          </div>
        </div>

        {/* Title and Price */}
        <div className="flex justify-between items-start mb-2 min-h-[3rem]">
          <div className="flex-1 pr-2">
            <h3 className="font-semibold text-left break-words line-clamp-2 text-sm md:text-base dark:text-white leading-tight">
              {car.brand} {car.model}
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              {car.location}
            </p>
          </div>
          <div className="text-right flex-shrink-0">
            <p className="font-bold text-lg text-primary dark:text-primary-foreground">
              P{car.price_per_day}
            </p>
            <p className="text-xs text-gray-400 dark:text-gray-500">/day</p>
          </div>
        </div>

        <Separator className="w-full my-2 sm:my-3 dark:bg-gray-700" />

        {/* Specs */}
        <div
          className="grid grid-cols-3 gap-1 sm:gap-2 mb-3 sm:mb-4 text-[0.7rem] sm:text-sm"
          aria-label="Car specifications"
        >
          <div className="flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400">
            <GaugeCircle className="w-4 h-4 text-primary dark:text-primary-foreground flex-shrink-0" aria-hidden="true" />
            <span className="truncate">{car.transmission}</span>
          </div>
          <div className="flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400">
            <Fuel className="w-4 h-4 text-primary dark:text-primary-foreground flex-shrink-0" aria-hidden="true" />
            <span className="truncate">{car.fuel}</span>
          </div>
          <div className="flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400">
            <Users className="w-4 h-4 text-primary dark:text-primary-foreground flex-shrink-0" aria-hidden="true" />
            <span>{car.seats} Seats</span>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default CarCard;

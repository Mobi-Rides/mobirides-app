
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Fuel, GaugeCircle, Users } from "lucide-react";
import { BookingDialog } from "@/components/booking/BookingDialog";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Car } from "@/types/car";

interface CarCardProps {
  id: string;
  brand: string;
  model: string;
  price_per_day: number;
  image_url: string;
  transmission: string;
  fuel: string;
  seats: number;
  location: string;
  year: number;
  onSaveToggle?: () => void;
  isSaved?: boolean;
}

export const CarCard = ({
  id,
  brand,
  model,
  price_per_day,
  image_url,
  transmission,
  fuel,
  seats,
  location,
  year,
  onSaveToggle,
  isSaved,
}: CarCardProps) => {
  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const navigate = useNavigate();

  const { data: carDetails } = useQuery({
    queryKey: ['car', id],
    queryFn: async () => {
      console.log("Fetching complete car details for booking");
      const { data, error } = await supabase
        .from('cars')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        console.error("Error fetching car details:", error);
        throw error;
      }

      console.log("Car details fetched:", data);
      return data as Car;
    },
    enabled: isBookingOpen
  });

  const handleCardClick = () => {
    navigate(`/cars/${id}`);
  };

  const handleBookNow = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsBookingOpen(true);
  };

  const handleSaveClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSaveToggle?.();
  };

  // Determine car type based on seats
  const getCarType = (seats: number) => {
    if (seats <= 2) return "Sports";
    if (seats <= 5) return "Sedan";
    if (seats <= 7) return "SUV";
    return "Van";
  };

  return (
    <>
      <Card
        className="overflow-hidden cursor-pointer transition-transform hover:scale-[1.02] h-[28rem]"
        onClick={handleCardClick}
      >
        <div className="relative h-48">
          <img
            src={image_url}
            alt={`${brand} ${model}`}
            className="w-full h-full object-cover"
          />
          {onSaveToggle && (
            <button
              onClick={handleSaveClick}
              className="absolute top-2 right-2 p-2 bg-white rounded-full shadow-md hover:bg-gray-100"
            >
              {isSaved ? "❤️" : "🤍"}
            </button>
          )}
        </div>
        <div className="p-4 flex flex-col h-[calc(28rem-12rem)]">
          <span className="px-3 py-1 rounded-full text-sm bg-[#F1F0FB] text-[#7C3AED] w-fit mb-2">
            {getCarType(seats)}
          </span>
          <div className="flex justify-between items-start mb-2">
            <div className="flex-1">
              <h3 className="font-semibold text-left break-words line-clamp-2">{brand} {model}</h3>
              <p className="text-sm text-gray-500 text-left">{year}</p>
            </div>
            <div className="text-right ml-2">
              <div className="flex items-center gap-1 justify-end">
                <p className="font-semibold whitespace-nowrap text-primary">BWP {price_per_day}</p>
                <p className="text-xs text-gray-500">/day</p>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2 mb-4">
            <div className="flex items-center justify-center gap-1 text-sm text-gray-600">
              <GaugeCircle className="w-4 h-4 text-primary" />
              {transmission}
            </div>
            <div className="flex items-center justify-center gap-1 text-sm text-gray-600">
              <Fuel className="w-4 h-4 text-primary" />
              {fuel}
            </div>
            <div className="flex items-center justify-center gap-1 text-sm text-gray-600">
              <Users className="w-4 h-4 text-primary" />
              {seats}
            </div>
          </div>
          <div className="mt-auto flex justify-between items-center">
            <Badge variant="secondary" className="truncate max-w-[150px]">{location}</Badge>
            <Button onClick={handleBookNow}>Book now</Button>
          </div>
        </div>
      </Card>

      {isBookingOpen && carDetails && (
        <BookingDialog
          car={carDetails}
          isOpen={isBookingOpen}
          onClose={() => setIsBookingOpen(false)}
        />
      )}
    </>
  );
};

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
      console.log("Fetching complete car details for booking, car ID:", id);
      
      // Validate UUID format before making the request
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(id)) {
        console.error("Invalid car ID format:", id);
        throw new Error("Invalid car ID format");
      }

      const { data, error } = await supabase
        .from('cars')
        .select(`
          *,
          owner:profiles!owner_id (
            full_name,
            avatar_url
          )
        `)
        .eq('id', id)
        .single();

      if (error) {
        console.error("Error fetching car details:", error);
        throw error;
      }

      console.log("Car details fetched:", data);
      return data as Car;
    },
    enabled: isBookingOpen // Only fetch when dialog is about to open
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

  return (
    <>
      <Card
        className="overflow-hidden cursor-pointer transition-transform hover:scale-[1.02]"
        onClick={handleCardClick}
      >
        <div className="relative">
          <img
            src={image_url}
            alt={`${brand} ${model}`}
            className="w-full h-48 object-cover"
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
        <div className="p-4">
          <div className="flex justify-between items-start mb-2">
            <div>
              <h3 className="font-semibold">{brand} {model}</h3>
              <p className="text-sm text-gray-500">{year}</p>
            </div>
            <div className="text-right">
              <p className="font-semibold">BWP {price_per_day}</p>
              <p className="text-xs text-gray-500">per day</p>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2 mb-4">
            <div className="flex items-center gap-1 text-sm text-gray-600">
              <GaugeCircle className="w-4 h-4" />
              {transmission}
            </div>
            <div className="flex items-center gap-1 text-sm text-gray-600">
              <Fuel className="w-4 h-4" />
              {fuel}
            </div>
            <div className="flex items-center gap-1 text-sm text-gray-600">
              <Users className="w-4 h-4" />
              {seats}
            </div>
          </div>
          <div className="flex justify-between items-center">
            <Badge variant="secondary">{location}</Badge>
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
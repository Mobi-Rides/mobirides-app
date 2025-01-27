import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card } from "./ui/card";
import { CarImage } from "./car-card/CarImage";
import { CarInfo } from "./car-card/CarInfo";
import { CarSpecs } from "./car-card/CarSpecs";
import { CarActions } from "./car-card/CarActions";
import { BookingDialog } from "./booking/BookingDialog";

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
  isSaved?: boolean;
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
  isSaved = false,
}: CarCardProps) => {
  const [isFavorite, setIsFavorite] = useState(isSaved);
  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  useEffect(() => {
    setIsFavorite(isSaved);
  }, [isSaved]);

  const handleViewDetails = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigate(`/cars/${id}`);
  };

  const handleBookNow = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsBookingOpen(true);
  };

  const handleFavoriteClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.user) {
        toast({
          title: "Authentication required",
          description: "Please log in to save cars",
          variant: "destructive",
        });
        return;
      }

      if (isFavorite) {
        // Remove from saved cars
        const { error } = await supabase
          .from('saved_cars')
          .delete()
          .eq('car_id', id)
          .eq('user_id', session.user.id);

        if (error) throw error;

        toast({
          title: "Car removed",
          description: "Car removed from your saved list",
        });
      } else {
        // Add to saved cars
        const { error } = await supabase
          .from('saved_cars')
          .insert({
            car_id: id,
            user_id: session.user.id
          });

        if (error) throw error;

        toast({
          title: "Car saved",
          description: "Car added to your saved list",
        });
      }

      setIsFavorite(!isFavorite);
      // Invalidate saved cars query to trigger a refetch
      queryClient.invalidateQueries({ queryKey: ["saved-cars"] });
      
    } catch (error) {
      console.error('Error toggling saved state:', error);
      toast({
        title: "Error",
        description: "Failed to update saved cars",
        variant: "destructive",
      });
    }
  };

  return (
    <>
      <Card className="overflow-hidden group cursor-pointer transition-all duration-300 hover:shadow-lg">
        <CarImage
          image={image}
          brand={brand}
          model={model}
          isFavorite={isFavorite}
          onFavoriteClick={handleFavoriteClick}
        />
        <div className="p-4">
          <CarInfo
            brand={brand}
            model={model}
            rating={rating}
            price={price}
            year={year}
            location={location}
          />
          <div className="space-y-2 mt-2">
            <CarSpecs
              transmission={transmission}
              fuel={fuel}
              seats={seats}
            />
          </div>
          <CarActions
            onViewDetails={handleViewDetails}
            onBookNow={handleBookNow}
          />
        </div>
      </Card>

      <BookingDialog
        car={{
          id,
          brand,
          model,
          price_per_day: price,
          image_url: image,
          transmission,
          fuel,
          seats,
          location,
          year,
          // Adding required properties with default values
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          description: null,
          is_available: true,
          latitude: null,
          longitude: null,
          owner_id: "", // This should ideally come from the car data
          vehicle_type: "Standard",
          registration_url: null,
          insurance_url: null,
          additional_docs_urls: null
        }}
        isOpen={isBookingOpen}
        onClose={() => setIsBookingOpen(false)}
      />
    </>
  );
};
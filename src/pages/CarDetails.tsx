
import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { Navigation } from "@/components/Navigation";
import { CarActions } from "@/components/car-details/CarActions";
import { CarHeader } from "@/components/car-details/CarHeader";
import { CarSpecs } from "@/components/car-details/CarSpecs";
import { CarOwner } from "@/components/car-details/CarOwner";
import { CarDescription } from "@/components/car-details/CarDescription";
import { CarImageCarousel } from "@/components/car-details/CarImageCarousel";
import { CarReviews } from "@/components/car-details/CarReviews";
import { CarLocation } from "@/components/car-details/CarLocation";
import { BarLoader } from "react-spinners";
import type { Car } from "@/types/car";
import { useTheme } from "@/contexts/ThemeContext";

const CarDetails = () => {
  const { id } = useParams();
  const { theme } = useTheme();

  const { data: car, isLoading, error } = useQuery({
    queryKey: ["car", id],
    queryFn: async () => {
      console.log("Fetching car details for ID:", id);
      
      // Update coordinates for this specific car
      if (id === "af67919d-012e-418a-a183-0d390caeef1f") {
        const { error: updateError } = await supabase
          .from("cars")
          .update({
            latitude: -24.6527,
            longitude: 25.9088
          })
          .eq("id", id);

        if (updateError) {
          console.error("Error updating car coordinates:", updateError);
        }
      }

      const { data, error } = await supabase
        .from("cars")
        .select(`
          *,
          profiles:owner_id (
            full_name,
            avatar_url
          )
        `)
        .eq("id", id)
        .maybeSingle();

      if (error) {
        console.error("Error fetching car:", error);
        throw error;
      }

      console.log("Car details fetched:", data);
      return data as Car & { profiles: { full_name: string; avatar_url: string | null } };
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background dark:bg-gray-900">
        <div className="flex flex-col items-center justify-center min-h-[200px] w-full p-4">
          <p className="text-sm text-muted-foreground dark:text-gray-400 mb-3">
            Loading car details...
          </p>
          <BarLoader color="#7c3aed" width={100} />
        </div>
        
        {/* Keep some skeleton UI to show page structure */}
        <div className="space-y-4 p-4 mt-4">
          <Skeleton className="h-64 w-full bg-gray-200 dark:bg-gray-700" />
          <Skeleton className="h-8 w-3/4 bg-gray-200 dark:bg-gray-700" />
          <Skeleton className="h-4 w-1/2 bg-gray-200 dark:bg-gray-700" />
          <div className="grid grid-cols-3 gap-4">
            <Skeleton className="h-20 bg-gray-200 dark:bg-gray-700" />
            <Skeleton className="h-20 bg-gray-200 dark:bg-gray-700" />
            <Skeleton className="h-20 bg-gray-200 dark:bg-gray-700" />
          </div>
        </div>
        <Navigation />
      </div>
    );
  }

  if (error || !car) {
    return (
      <div className="min-h-screen bg-background dark:bg-gray-900">
        <div className="p-4 text-center">
          <h2 className="text-xl font-semibold text-red-500">Error loading car details</h2>
          <p className="text-muted-foreground dark:text-gray-400">Please try again later</p>
        </div>
        <Navigation />
      </div>
    );
  }

  // Safely handle avatar URL
  const avatarUrl = car.profiles?.avatar_url 
    ? supabase.storage.from('avatars').getPublicUrl(car.profiles.avatar_url).data.publicUrl
    : "/placeholder.svg";

  return (
    <div className="min-h-screen bg-background dark:bg-gray-900 pb-20">
      <div className="space-y-4 p-4">
        <CarImageCarousel carId={car.id} mainImageUrl={car.image_url} />
        <CarHeader
          brand={car.brand}
          model={car.model}
          year={car.year}
          location={car.location}
        />
        <CarSpecs
          pricePerDay={car.price_per_day}
          transmission={car.transmission}
          seats={car.seats}
        />
        <CarDescription description={car.description} />
        <CarLocation 
          latitude={car.latitude} 
          longitude={car.longitude}
          location={car.location}
          mapStyle={theme === "dark" ? "mapbox://styles/mapbox/dark-v11" : "mapbox://styles/mapbox/light-v11"}
        />
        <CarOwner
          ownerName={car.profiles?.full_name || "Car Owner"}
          avatarUrl={avatarUrl}
          ownerId={car.owner_id}
          carId={car.id}
        />
        <CarReviews car={car} />
        <CarActions car={car} />
      </div>
      <Navigation />
    </div>
  );
};

export default CarDetails;

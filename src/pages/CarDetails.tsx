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
import { useUser } from "@supabase/auth-helpers-react";
import type { Car } from "@/types/car";
import { useTheme } from "@/contexts/ThemeContext";
import { AlertTriangle } from "lucide-react";

const CarDetails = () => {
  const { carId } = useParams();
  const { theme } = useTheme();
  const user = useUser();

  const { data: car, isLoading, error } = useQuery({
    queryKey: ["car", carId],
    queryFn: async () => {
      console.log("Fetching car details for ID:", carId);
      
      const { data, error } = await supabase
        .from("cars")
        .select(`
          *,
          profiles:owner_id (
            full_name,
            avatar_url
          )
        `)
        .eq("id", carId)
        .maybeSingle();

      if (error) {
        console.error("Error fetching car:", error);
        throw error;
      }

      console.log("Car details fetched:", data);
      
      // Debug ownership
      if (user) {
        console.log("Current user ID:", user.id);
        console.log("Car owner ID:", data.owner_id);
        console.log("Is owner check:", user.id === data.owner_id);
      }
      
      return data as Car & { profiles: { full_name: string; avatar_url: string | null } };
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background dark:bg-gray-900">
        <div className="container mx-auto">
          <div className="flex flex-col items-center justify-center min-h-[200px] w-full p-4">
            <p className="text-sm text-muted-foreground dark:text-gray-400 mb-3">
              Loading vehicle details...
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
        </div>
        <Navigation />
      </div>
    );
  }

  if (error || !car) {
    return (
      <div className="min-h-screen bg-background dark:bg-gray-900">
        <div className="container mx-auto">
          <div className="p-4 text-center space-y-4">
            <AlertTriangle className="h-12 w-12 text-red-500 mx-auto" />
            <h2 className="text-xl font-semibold text-red-500">Error loading vehicle details</h2>
            <p className="text-muted-foreground dark:text-gray-400">Please try again later</p>
          </div>
        </div>
        <Navigation />
      </div>
    );
  }

  // Pass the raw avatar_url to CarOwner component
  const avatarUrl = car.profiles?.avatar_url || null;

  return (
    <div className="min-h-screen bg-background dark:bg-gray-900 pb-20">
      <div className="container mx-auto">
        <div className="space-y-4 p-4">
          <CarImageCarousel carId={car.id} mainImageUrl={car.image_url} />
          
          <div className="grid grid-cols-1 gap-4">
            <CarHeader
              brand={car.brand}
              model={car.model}
              year={car.year}
              location={car.location}
              pricePerDay={car.price_per_day}
            />
            
            <CarSpecs
              pricePerDay={car.price_per_day}
              transmission={car.transmission}
              seats={car.seats}
              features={car.features}
            />
            
            {car.description && <CarDescription description={car.description} />}
            
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
            />
            
            <CarReviews car={car} />
          </div>
          
          <CarActions car={car} />
        </div>
      </div>
      <Navigation />
    </div>
  );
};

export default CarDetails;

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
import type { Car } from "@/types/car";

const CarDetails = () => {
  const { id } = useParams();

  const { data: car, isLoading, error } = useQuery({
    queryKey: ["car", id],
    queryFn: async () => {
      console.log("Fetching car details for ID:", id);
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
      <div className="min-h-screen bg-background">
        <div className="space-y-4 p-4">
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-8 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
          <div className="grid grid-cols-3 gap-4">
            <Skeleton className="h-20" />
            <Skeleton className="h-20" />
            <Skeleton className="h-20" />
          </div>
        </div>
        <Navigation />
      </div>
    );
  }

  if (error || !car) {
    return (
      <div className="min-h-screen bg-background">
        <div className="p-4 text-center">
          <h2 className="text-xl font-semibold text-red-500">Error loading car details</h2>
          <p className="text-muted-foreground">Please try again later</p>
        </div>
        <Navigation />
      </div>
    );
  }

  const avatarUrl = car.profiles.avatar_url
    ? supabase.storage.from('avatars').getPublicUrl(car.profiles.avatar_url).data.publicUrl
    : "/placeholder.svg";

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="space-y-4 p-4">
        <CarHeader
          brand={car.brand}
          model={car.model}
          year={car.year}
          location={car.location}
          imageUrl={car.image_url}
        />
        <CarSpecs
          pricePerDay={car.price_per_day}
          transmission={car.transmission}
          seats={car.seats}
        />
        <CarDescription description={car.description} />
        <CarOwner
          ownerName={car.profiles.full_name}
          avatarUrl={avatarUrl}
        />
        <CarActions car={car} />
      </div>
      <Navigation />
    </div>
  );
};

export default CarDetails;
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { CarGrid } from "@/components/CarGrid";
import { Navigation } from "@/components/Navigation";
import type { Car } from "@/types/car";

const SavedCars = () => {
  const { data: cars, isLoading, error } = useQuery({
    queryKey: ["saved-cars"],
    queryFn: async () => {
      console.log("Fetching saved cars...");
      const { data: savedCars, error: savedCarsError } = await supabase
        .from("saved_cars")
        .select(`
          car_id,
          cars:car_id (
            id,
            owner_id,
            brand,
            model,
            year,
            vehicle_type,
            price_per_day,
            location,
            latitude,
            longitude,
            transmission,
            fuel,
            seats,
            description,
            image_url,
            is_available,
            created_at,
            updated_at
          )
        `);

      if (savedCarsError) {
        console.error("Error fetching saved cars:", savedCarsError);
        throw savedCarsError;
      }

      console.log("Saved cars fetched:", savedCars);
      // Filter out any null cars and map to the car objects
      const validCars = savedCars
        .filter(saved => saved.cars !== null)
        .map(saved => saved.cars) as Car[];
      
      return validCars;
    },
  });

  return (
    <div className="min-h-screen pb-20">
      <header className="bg-white p-4 sticky top-0 z-10 shadow-sm">
        <h1 className="text-xl font-semibold">Saved Cars</h1>
      </header>

      <main className="p-4">
        <CarGrid
          cars={cars || []}
          isLoading={isLoading}
          error={error}
          loadMoreRef={() => {}}
          isFetchingNextPage={false}
        />
      </main>

      <Navigation />
    </div>
  );
};

export default SavedCars;
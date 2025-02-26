
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { CarGrid } from "@/components/CarGrid";
import { Navigation } from "@/components/Navigation";
import type { Car } from "@/types/car";

const SavedCars = () => {
  const { data: cars = [], isLoading, error } = useQuery({
    queryKey: ["saved-cars-full"], // Changed query key to be distinct
    queryFn: async () => {
      console.log("Fetching saved cars...");
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        console.log("No active session found");
        return [];
      }

      // Join saved_cars with cars table to get full car details
      const { data: savedCars, error: savedCarsError } = await supabase
        .from("saved_cars")
        .select(`
          car_id,
          cars:cars(*)
        `)
        .eq('user_id', session.user.id);

      if (savedCarsError) {
        console.error("Error fetching saved cars:", savedCarsError);
        throw savedCarsError;
      }

      console.log("Raw saved cars data:", savedCars);
      
      if (!Array.isArray(savedCars)) {
        console.log("savedCars is not an array, returning empty array");
        return [];
      }
      
      // Map the nested cars data to a flat array and mark them as saved
      const validCars = savedCars
        .filter(saved => saved.cars)
        .map(saved => ({
          ...saved.cars,
          isSaved: true
        })) as Car[];
      
      console.log("Processed cars:", validCars);
      return validCars;
    },
  });

  return (
    <div className="min-h-screen pb-20">
      <header className="bg-white p-4 sticky top-0 z-10 shadow-sm">
        <h1 className="text-xl font-semibold">Saved Cars</h1>
      </header>

      <main className="container mx-auto px-4 py-8">
        <CarGrid
          cars={cars}
          isLoading={isLoading}
          error={error}
          loadMoreRef={() => {}}
          isFetchingNextPage={false}
          isAuthenticated={true}
        />
      </main>

      <Navigation />
    </div>
  );
};

export default SavedCars;

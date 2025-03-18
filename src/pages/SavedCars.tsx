
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { CarGrid } from "@/components/CarGrid";
import { Navigation } from "@/components/Navigation";
import { LoadingView } from "@/components/home/LoadingView";
import { toast } from "sonner";
import type { Car } from "@/types/car";

const SavedCars = () => {
  const { data: cars = [], isLoading, error } = useQuery({
    queryKey: ["saved-cars-full"],
    queryFn: async () => {
      console.log("Fetching saved cars...");
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        console.log("No active session found when fetching saved cars");
        return [];
      }

      console.log("Using user ID for saved cars:", session.user.id);
      
      // Join saved_cars with cars table to get full car details
      const { data: savedCars, error: savedCarsError } = await supabase
        .from("saved_cars")
        .select(`
          car_id,
          cars:car_id(*)
        `)
        .eq('user_id', session.user.id);

      if (savedCarsError) {
        console.error("Error fetching saved cars:", savedCarsError);
        toast.error("Could not load your saved cars. Please try again.");
        throw savedCarsError;
      }

      console.log("Raw saved cars data:", savedCars);
      
      // Map the nested cars data to a flat array
      if (!Array.isArray(savedCars) || savedCars.length === 0) {
        console.log("No saved cars found for user");
        return [];
      }
      
      // Process and convert the nested structure
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
      <header className="bg-white dark:bg-gray-800 p-4 sticky top-0 z-10 shadow-sm">
        <h1 className="text-xl font-semibold dark:text-white">Saved Cars</h1>
      </header>

      <main className="container mx-auto px-4 py-8">
        {isLoading ? (
          <LoadingView />
        ) : (
          <CarGrid
            cars={cars}
            isLoading={isLoading}
            error={error}
            loadMoreRef={() => {}}
            isFetchingNextPage={false}
            isAuthenticated={true}
          />
        )}
      </main>

      <Navigation />
    </div>
  );
};

export default SavedCars;

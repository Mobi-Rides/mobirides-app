
import { useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { CarGrid } from "@/components/CarGrid";
import { Navigation } from "@/components/Navigation";
import { LoadingView } from "@/components/home/LoadingView";
import { toast } from "sonner";
import type { Car } from "@/types/car";

import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

const SavedCars = () => {
  const navigate = useNavigate();
  const loadMoreRef = useRef<HTMLDivElement>(null);

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

  const handleLoadMore = () => {
    // This function would be used if pagination was implemented
    console.log("Load more triggered in SavedCars");
  };

  return (
    <div className="min-h-screen px-4 pb-20">
      <div className="px-4 py-4 mb-4 flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-xl md:text-2xl text-left font-semibold">Profile</h1>
      </div>

      <main className="px-4 py-6">
        {isLoading ? (
          <LoadingView />
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <p className="text-base text-muted-foreground mb-4">
              Unable to load saved cars
            </p>
            <button
              onClick={() => window.location.reload()}
              className="text-sm text-primary hover:underline"
            >
              Try again
            </button>
          </div>
        ) : cars.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <p className="text-base text-muted-foreground">No saved cars yet</p>
          </div>
        ) : (
          <CarGrid
            cars={cars}
            isLoading={isLoading}
            error={error}
            loadMoreRef={loadMoreRef}
            onLoadMore={handleLoadMore}
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

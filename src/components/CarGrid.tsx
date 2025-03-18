
import { useState, useEffect } from "react";
import { CarCard } from "@/components/CarCard";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import type { Car } from "@/types/car";
import { BarLoader } from "react-spinners";
import { AlertCircle } from "lucide-react";

interface CarGridProps {
  cars: Car[];
  isLoading: boolean;
  error: Error | null;
  loadMoreRef: (node?: Element | null) => void;
  isFetchingNextPage: boolean;
  isAuthenticated: boolean;
}

export const CarGrid = ({
  cars = [],
  isLoading,
  error,
  loadMoreRef,
  isFetchingNextPage,
  isAuthenticated,
}: CarGridProps) => {
  const [showAll, setShowAll] = useState(false);
  const { toast } = useToast();
  
  const CarSkeleton = () => (
    <div className="space-y-3">
      <Skeleton className="h-48 w-full bg-gray-200 dark:bg-gray-700" />
      <Skeleton className="h-4 w-3/4 bg-gray-200 dark:bg-gray-700" />
      <Skeleton className="h-4 w-1/2 bg-gray-200 dark:bg-gray-700" />
    </div>
  );

  useEffect(() => {
    if (error) {
      console.error("Error in CarGrid:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Error loading cars. Please try again later.",
      });
    }
  }, [error, toast]);

  useEffect(() => {
    const isIndexPage = window.location.pathname === "/";
    const isSavedCarsPage = window.location.pathname === "/saved-cars";
    
    // Separate login request toast for index page
    if (isIndexPage && !isAuthenticated) {
      toast({
        title: "Welcome to Mobirides",
        description: "Please sign in to view available cars. Click 'Profile' in the navigation bar to sign in.",
      });
      return;
    }

    // Only show no cars found toast if user is authenticated and we have loaded the data
    if (isAuthenticated && !isLoading && Array.isArray(cars) && cars.length === 0) {
      toast({
        title: "No Cars Found",
        description: isSavedCarsPage 
          ? "You haven't saved any cars yet. Browse our collection and click the heart icon to save your favorite cars."
          : "The car/s you are searching for cannot be found",
      });
    }
  }, [cars, isAuthenticated, isLoading, toast]);

  if (isLoading) {
    return (
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <CarSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center bg-gray-50 dark:bg-gray-800 rounded-lg">
        <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">Failed to load cars</h3>
        <p className="text-gray-500 dark:text-gray-400 mt-2">
          There was an error loading the cars. Please try again later.
        </p>
      </div>
    );
  }

  if (!Array.isArray(cars) || cars.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center bg-gray-50 dark:bg-gray-800 rounded-lg">
        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">No cars found</h3>
        <p className="text-gray-500 dark:text-gray-400 mt-2">
          {window.location.pathname === "/saved-cars" 
            ? "You haven't saved any cars yet. Browse our collection and click the heart icon to save your favorites."
            : "No cars match your current criteria. Try adjusting your filters."}
        </p>
      </div>
    );
  }

  const visibleCars = showAll ? cars : cars.slice(0, 6);

  return (
    <div className="space-y-6">
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        {visibleCars.map((car) => (
          <div key={car.id} className="animate-fade-in">
            <CarCard
              id={car.id}
              brand={car.brand}
              model={car.model}
              price_per_day={car.price_per_day}
              image_url={car.image_url || "/placeholder.svg"}
              transmission={car.transmission}
              fuel={car.fuel}
              seats={car.seats}
              location={car.location}
              year={car.year}
              isSaved={car.isSaved}
            />
          </div>
        ))}
      </div>

      {cars.length > 6 && (
        <div className="flex justify-center">
          <Button
            variant="ghost"
            onClick={() => setShowAll(!showAll)}
            className="text-primary dark:text-primary-foreground hover:text-primary/80 dark:hover:text-primary-foreground/80"
          >
            {showAll ? "Show Less" : "See All"}
          </Button>
        </div>
      )}

      <div
        ref={loadMoreRef}
        className="h-10 flex flex-col items-center justify-center mt-4 gap-2"
      >
        {isFetchingNextPage && (
          <>
            <p className="text-sm text-muted-foreground mb-1 dark:text-gray-400">Fetching more cars...</p>
            <BarLoader color="#7c3aed" width={100} />
          </>
        )}
      </div>
    </div>
  );
};

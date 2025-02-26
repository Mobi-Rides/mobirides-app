
import { useState, useEffect } from "react";
import { CarCard } from "@/components/CarCard";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import type { Car } from "@/types/car";

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
      <Skeleton className="h-48 w-full" />
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-4 w-1/2" />
    </div>
  );

  useEffect(() => {
    if (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Error loading cars. Please try again later.",
      });
    }
  }, [error, toast]);

  useEffect(() => {
    const isIndexPage = window.location.pathname === "/";
    
    // Separate login request toast
    if (isIndexPage && !isAuthenticated) {
      toast({
        title: "Welcome to Mobirides",
        description: "Please sign in to view available cars. Click 'Profile' in the navigation bar to sign in.",
      });
      return;
    }

    // Only show no cars found toast if user is authenticated
    if (isAuthenticated && (!Array.isArray(cars) || cars.length === 0)) {
      toast({
        title: "No Cars Found",
        description: isIndexPage 
          ? "The car/s you are searching for cannot be found"
          : "You haven't saved any cars yet. Browse our collection and click the heart icon to save your favorite cars.",
      });
    }
  }, [cars, isAuthenticated, toast]);

  if (isLoading) {
    return (
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <CarSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (!Array.isArray(cars) || cars.length === 0) {
    return null;
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
            className="text-primary hover:text-primary/80"
          >
            {showAll ? "Show Less" : "See All"}
          </Button>
        </div>
      )}

      <div ref={loadMoreRef} className="h-10 flex items-center justify-center mt-4">
        {isFetchingNextPage && (
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
        )}
      </div>
    </div>
  );
};

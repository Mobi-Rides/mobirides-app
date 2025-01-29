import { useState } from "react";
import { CarCard } from "@/components/CarCard";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import type { Car } from "@/types/car";

interface CarGridProps {
  cars: Car[];
  isLoading: boolean;
  error: Error | null;
  loadMoreRef: (node?: Element | null) => void;
  isFetchingNextPage: boolean;
}

export const CarGrid = ({
  cars = [],
  isLoading,
  error,
  loadMoreRef,
  isFetchingNextPage,
}: CarGridProps) => {
  const [showAll, setShowAll] = useState(false);
  
  const CarSkeleton = () => (
    <div className="space-y-3">
      <Skeleton className="h-48 w-full" />
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-4 w-1/2" />
    </div>
  );

  if (error) {
    return (
      <div className="text-center py-8 text-red-500">
        Error loading cars. Please try again later.
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
        {[1, 2, 3, 4].map((i) => (
          <CarSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (!Array.isArray(cars) || cars.length === 0) {
    // Check if we're on the index page (has search functionality)
    const isIndexPage = window.location.pathname === "/";
    
    return (
      <Alert className="my-8">
        <AlertDescription>
          {isIndexPage 
            ? "The car/s you are searching for cannot be found"
            : "You haven't saved any cars yet. Browse our collection and click the heart icon to save your favorite cars."
          }
        </AlertDescription>
      </Alert>
    );
  }

  const visibleCars = showAll ? cars : cars.slice(0, 6);

  return (
    <div className="space-y-6">
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
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
import { CarCard } from "@/components/CarCard";
import { Skeleton } from "@/components/ui/skeleton";
import type { Car } from "@/types/car";

interface CarGridProps {
  cars: Car[];
  isLoading: boolean;
  error: Error | null;
  loadMoreRef: (node?: Element | null) => void;
  isFetchingNextPage: boolean;
}

export const CarGrid = ({
  cars,
  isLoading,
  error,
  loadMoreRef,
  isFetchingNextPage,
}: CarGridProps) => {
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

  if (cars.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No cars found matching your criteria.
      </div>
    );
  }

  return (
    <>
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
        {cars.map((car) => (
          <div key={car.id} className="animate-fade-in">
            <CarCard
              brand={car.brand}
              model={car.model}
              price={car.price_per_day}
              image={car.image_url || "/placeholder.svg"}
              rating={4.5}
              transmission={car.transmission}
              fuel={car.fuel}
              seats={car.seats}
            />
          </div>
        ))}
      </div>
      <div ref={loadMoreRef} className="h-10 flex items-center justify-center mt-4">
        {isFetchingNextPage && (
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
        )}
      </div>
    </>
  );
};
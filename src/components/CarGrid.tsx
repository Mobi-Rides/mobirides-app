
import React from "react";
import { CarCard } from "@/components/CarCard";
import type { Car } from "@/types/car";

export interface CarGridProps {
  cars: Car[];
  hasMoreItems?: boolean;
  isLoading?: boolean;
  error?: Error | null;
  loadMoreRef?: React.RefObject<HTMLDivElement>;
  onLoadMore?: () => void;
  isFetchingNextPage?: boolean;
  isAuthenticated?: boolean;
}

export const CarGrid = ({ cars, hasMoreItems, isLoading, error, loadMoreRef, onLoadMore, isFetchingNextPage, isAuthenticated }: CarGridProps) => {
  if (isLoading) {
    return (
      <div className="text-center mt-8">
        <p className="text-muted-foreground">Loading cars...</p>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="text-center mt-8">
        <p className="text-red-500">Error loading cars: {error.message}</p>
      </div>
    );
  }

  if (cars.length === 0) {
    return (
      <div className="text-center mt-8">
        <p className="text-muted-foreground">No cars found</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {cars.map((car) => (
        <CarCard 
          key={car.id} 
          id={car.id}
          brand={car.brand}
          model={car.model}
          price_per_day={car.price_per_day}
          image_url={car.image_url}
          transmission={car.transmission}
          fuel={car.fuel}
          seats={car.seats}
          location={car.location}
          year={car.year}
          isSaved={car.isSaved}
        />
      ))}
      {loadMoreRef && (
        <div ref={loadMoreRef} className="col-span-full h-10 flex items-center justify-center">
          {isFetchingNextPage && <p className="text-muted-foreground">Loading more...</p>}
        </div>
      )}
    </div>
  );
};

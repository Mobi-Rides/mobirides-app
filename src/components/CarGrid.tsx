
import React from "react";
import { CarCard } from "@/components/CarCard";

export interface CarGridProps {
  cars: any[];
  hasMoreItems?: boolean;
}

export const CarGrid = ({ cars, hasMoreItems }: CarGridProps) => {
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
        <CarCard key={car.id} car={car} />
      ))}
    </div>
  );
};

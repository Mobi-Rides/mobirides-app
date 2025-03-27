
import { Navigation } from "@/components/Navigation";
import { CarGrid } from "@/components/CarGrid";
import { SearchFilters } from "@/components/SearchFilters";
import { useState, useRef } from "react";
import { Car } from "@/types/car";

// Define the proper interface based on what the components expect
interface FilterParams {
  query: string;
  brand: string;
  minPrice: string;
  maxPrice: string;
}

const CarListing = () => {
  const [searchParams, setSearchParams] = useState<FilterParams>({
    query: "",
    brand: "",
    minPrice: "",
    maxPrice: "",
  });
  const [cars, setCars] = useState<Car[]>([]);

  return (
    <div className="min-h-screen bg-background">
      <main className="pb-16">
        <div className="container mx-auto p-4">
          <h1 className="text-2xl font-bold mb-6">Available Cars</h1>
          
          <SearchFilters 
            onFiltersChange={(filters: any) => setSearchParams(filters as FilterParams)}
          />
          
          <div className="mt-6">
            <CarGrid 
              cars={cars} 
              isLoading={false} 
              error={null} 
              loadMoreRef={null}
              hasMoreItems={false}
              onLoadMore={() => {}}
            />
          </div>
        </div>
      </main>
      <Navigation />
    </div>
  );
};

export default CarListing;

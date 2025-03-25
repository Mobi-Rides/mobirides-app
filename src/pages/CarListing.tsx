
import { Navigation } from "@/components/Navigation";
import { CarGrid } from "@/components/CarGrid";
import { SearchFilters } from "@/components/SearchFilters";
import { useState } from "react";
import type { SearchFiltersProps } from "@/components/SearchFilters";
import type { CarGridProps } from "@/components/CarGrid";

const CarListing = () => {
  const [searchParams, setSearchParams] = useState({
    query: "",
    brand: "",
    minPrice: "",
    maxPrice: "",
  });

  return (
    <div className="min-h-screen bg-background">
      <main className="pb-16">
        <div className="container mx-auto p-4">
          <h1 className="text-2xl font-bold mb-6">Available Cars</h1>
          
          <SearchFilters 
            onFilterChange={(filters) => setSearchParams(filters as any)}
            initialFilters={searchParams as any}
          />
          
          <div className="mt-6">
            <CarGrid 
              searchFilters={searchParams as any}
            />
          </div>
        </div>
      </main>
      <Navigation />
    </div>
  );
};

export default CarListing;

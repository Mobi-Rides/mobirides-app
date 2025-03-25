
import { Navigation } from "@/components/Navigation";
import { CarGrid } from "@/components/CarGrid";
import { SearchFilters } from "@/components/SearchFilters";
import { useState } from "react";

// Define the search filters interface based on what SearchFilters component expects
interface SearchParams {
  query: string;
  brand: string;
  minPrice: string;
  maxPrice: string;
}

const CarListing = () => {
  const [searchParams, setSearchParams] = useState<SearchParams>({
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
            onFiltersChange={(filters) => setSearchParams(filters as SearchParams)}
            initialFilters={searchParams}
          />
          
          <div className="mt-6">
            <CarGrid 
              filters={searchParams}
            />
          </div>
        </div>
      </main>
      <Navigation />
    </div>
  );
};

export default CarListing;

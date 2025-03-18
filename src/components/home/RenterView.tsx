
import { useState, useEffect } from "react";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { useInView } from "react-intersection-observer";
import { fetchCars } from "@/utils/carFetching";
import { CarGrid } from "@/components/CarGrid";
import { BrandFilter } from "@/components/BrandFilter";
import { Button } from "@/components/ui/button";
import { ArrowUpAZ, ArrowDownAZ } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import type { SearchFilters as Filters } from "@/components/SearchFilters";

interface RenterViewProps {
  searchQuery: string;
  filters: Filters;
  onFiltersChange: (filters: Filters) => void;
}

export const RenterView = ({ searchQuery, filters, onFiltersChange }: RenterViewProps) => {
  const [selectedBrand, setSelectedBrand] = useState<string | null>(null);
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const { ref: loadMoreRef, inView } = useInView();

  useEffect(() => {
    onFiltersChange({
      ...filters,
      sortOrder: sortOrder
    });
  }, [sortOrder, filters, onFiltersChange]);

  const { 
    data: availableCars,
    isLoading: isLoadingCars,
    error: carsError,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage
  } = useInfiniteQuery({
    queryKey: ['available-cars', selectedBrand, filters, searchQuery],
    queryFn: ({ pageParam = 0 }) => fetchCars({ 
      pageParam, 
      filters,
      searchParams: {
        ...(selectedBrand ? { brand: selectedBrand } : {}),
        ...(searchQuery ? { searchTerm: searchQuery } : {})
      }
    }),
    getNextPageParam: (lastPage) => lastPage.nextPage || undefined,
    initialPageParam: 0
  });

  const { data: savedCarIds } = useQuery({
    queryKey: ['saved-car-ids'],
    queryFn: async () => {
      console.log("Fetching saved car IDs for home page");
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user?.id) return new Set<string>();

      const { data, error } = await supabase
        .from('saved_cars')
        .select('car_id')
        .eq('user_id', session.user.id);

      if (error) {
        console.error('Error fetching saved cars:', error);
        return new Set<string>();
      }

      const savedIds = new Set(data.map(saved => saved.car_id));
      console.log("Saved car IDs for home page:", Array.from(savedIds));
      return savedIds;
    }
  });
  
  const savedCarsSet = savedCarIds || new Set<string>();
  
  const allAvailableCars = availableCars?.pages.flatMap(page => 
    page.data.map(car => ({
      ...car,
      isSaved: savedCarsSet.has(car.id)
    }))
  ) || [];

  useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [inView, hasNextPage, isFetchingNextPage, fetchNextPage]);

  const toggleSortOrder = () => {
    setSortOrder(prev => prev === "asc" ? "desc" : "asc");
  };

  return (
    <div className="space-y-6">
      <div className="text-left flex items-center ">
        <h3 className="font-bold  break-words line-clamp-2 text-sm md:text-base text-gray-500 dark:text-white">
          Cars Available for Rent
        </h3>

        <span className="ml-2 px-3 py-1 rounded-md text-xs md:text-sm font-bold bg-[#F1F0FB] dark:bg-[#352a63] text-[#7C3AED] dark:text-[#a87df8]">
          Renter Mode
        </span>
      </div>

      <BrandFilter
        selectedBrand={selectedBrand}
        onSelectBrand={setSelectedBrand}
        carsCount={allAvailableCars.length}
      />

      <div className="flex justify-end">
        <Button
          variant={sortOrder ? "secondary" : "outline"}
          onClick={toggleSortOrder}
          className={`flex items-center gap-2 transition-colors ${
            sortOrder ? "bg-accent text-accent-foreground" : ""
          }`}
        >
          {sortOrder === "asc" ? (
            <>
              Price: Low to High
              <ArrowUpAZ className="h-4 w-4" />
            </>
          ) : (
            <>
              Price: High to Low
              <ArrowDownAZ className="h-4 w-4" />
            </>
          )}
        </Button>
      </div>

      <CarGrid
        cars={allAvailableCars}
        isLoading={isLoadingCars}
        error={carsError}
        loadMoreRef={loadMoreRef}
        isFetchingNextPage={isFetchingNextPage}
        isAuthenticated={true}
      />
    </div>
  );
};

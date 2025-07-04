import { useState, useEffect, useRef } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import { useInView } from "react-intersection-observer";
import { fetchCars } from "@/utils/carFetching";
import { CarGrid } from "@/components/CarGrid";
import BrandFilter from "@/components/BrandFilter";
import { Button } from "@/components/ui/button";
import { ArrowUpAZ, ArrowDownAZ, LogIn } from "lucide-react";
import { useNavigate } from "react-router-dom";
import type { SearchFilters as Filters } from "@/components/SearchFilters";

interface GuestViewProps {
  searchQuery: string;
  filters: Filters;
  onFiltersChange: (filters: Filters) => void;
}

export const GuestView = ({ searchQuery, filters, onFiltersChange }: GuestViewProps) => {
  const [selectedBrand, setSelectedBrand] = useState<string | null>(null);
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const { ref: inViewRef, inView } = useInView();
  const loadMoreRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  // For combining the inView ref with our loadMoreRef
  const setRefs = (node: HTMLDivElement | null) => {
    if (loadMoreRef.current !== node) {
      loadMoreRef.current = node || null;
    }
    inViewRef(node);
  };

  useEffect(() => {
    onFiltersChange({
      ...filters,
      sortOrder: sortOrder
    });
  }, [sortOrder, filters, onFiltersChange]);

  const handleBrandSelect = (brand: string | null) => {
    setSelectedBrand(brand);
  };

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

  const allAvailableCars = availableCars?.pages.flatMap(page => page.data) || [];

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
      <div className="flex justify-end">
        <Button
          variant={sortOrder ? "secondary" : "outline"}
          onClick={toggleSortOrder}
          className={`flex items-center gap-2 transition-colors ${sortOrder ? "bg-accent text-accent-foreground" : ""}`}
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
      <div className="text-left flex items-center ">
        <h3 className="font-bold break-words line-clamp-2 text-sm md:text-base text-gray-500 dark:text-white">
          Browse Cars as Guest
        </h3>
      </div>
      <CarGrid
        cars={allAvailableCars}
        isLoading={isLoadingCars}
        error={carsError}
        loadMoreRef={loadMoreRef}
        isFetchingNextPage={isFetchingNextPage}
        isAuthenticated={false}
      />
      {hasNextPage && (
        <div ref={setRefs} className="h-10 w-full opacity-0">
          Load more trigger
        </div>
      )}
      <div className="flex justify-center mt-8">
        <Button variant="outline" onClick={() => navigate('/?auth=signin')}>
          <LogIn className="h-4 w-4 mr-2" /> Sign in to book or save cars
        </Button>
      </div>
    </div>
  );
}; 
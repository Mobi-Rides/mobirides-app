import { useState, useEffect, useRef } from "react";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { useInView } from "react-intersection-observer";
import { fetchCars } from "@/utils/carFetching";
import { CarGrid } from "@/components/CarGrid";
import BrandFilter from "@/components/BrandFilter";
import { Button } from "@/components/ui/button";
import { ArrowUpAZ, ArrowDownAZ } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import type { SearchFilters as Filters } from "@/components/SearchFilters";

interface RenterViewProps {
  searchQuery: string;
  filters: Filters;
  onFiltersChange: (filters: Filters) => void;
}

export const RenterView = ({
  searchQuery,
  filters,
  onFiltersChange,
}: RenterViewProps) => {
  const [selectedBrand, setSelectedBrand] = useState<string | null>(null);
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const { ref: inViewRef, inView } = useInView();
  const loadMoreRef = useRef<HTMLDivElement>(null);

  // For combining the inView ref with our loadMoreRef
  const setRefs = (node: HTMLDivElement | null) => {
    // Set the loadMoreRef
    if (loadMoreRef.current !== node) {
      loadMoreRef.current = node || null;
    }

    // Call the inViewRef
    inViewRef(node);
  };

  useEffect(() => {
    onFiltersChange({
      ...filters,
      sortOrder: sortOrder,
    });
  }, [sortOrder, onFiltersChange]);

  // Update filters when brand selection changes
  const handleBrandSelect = (brand: string | null) => {
    console.log("Brand selected:", brand);
    setSelectedBrand(brand);
  };

  const {
    data: availableCars,
    isLoading: isLoadingCars,
    error: carsError,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: ["available-cars", selectedBrand, filters, searchQuery],
    queryFn: ({ pageParam = 0 }) =>
      fetchCars({
        pageParam,
        filters,
        searchParams: {
          ...(selectedBrand ? { brand: selectedBrand } : {}),
          ...(searchQuery ? { searchTerm: searchQuery } : {}),
        },
      }),
    getNextPageParam: (lastPage) => lastPage.nextPage || undefined,
    initialPageParam: 0,
  });

  const { data: savedCarIds } = useQuery({
    queryKey: ["saved-car-ids"],
    queryFn: async () => {
      console.log("Fetching saved car IDs for home page");
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session?.user?.id) return new Set<string>();

      const { data, error } = await supabase
        .from("saved_cars")
        .select("car_id")
        .eq("user_id", session.user.id);

      if (error) {
        console.error("Error fetching saved cars:", error);
        return new Set<string>();
      }

      const savedIds = new Set(data.map((saved) => saved.car_id));
      console.log("Saved car IDs for home page:", Array.from(savedIds));
      return savedIds;
    },
  });

  const savedCarsSet = savedCarIds || new Set<string>();

  const allAvailableCars =
    availableCars?.pages.flatMap((page) =>
      page.data.map((car) => ({
        ...car,
        isSaved: savedCarsSet.has(car.id),
      })),
    ) || [];

  useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [inView, hasNextPage, isFetchingNextPage, fetchNextPage]);

  const toggleSortOrder = () => {
    setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
  };

  return (
    <div className="space-y-6">
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
      <div className="text-left flex items-center ">
        <h3 className="font-bold  break-words line-clamp-2 text-sm md:text-base text-gray-500 dark:text-white">
          Available Cars
        </h3>
      </div>
      <CarGrid
        cars={allAvailableCars}
        isLoading={isLoadingCars}
        error={carsError}
        loadMoreRef={loadMoreRef}
        isFetchingNextPage={isFetchingNextPage}
        isAuthenticated={true}
      />
      {/* This hidden div is used with the intersection observer */}
      {hasNextPage && (
        <div ref={setRefs} className="h-10 w-full opacity-0">
          Load more trigger
        </div>
      )}
    </div>
  );
};

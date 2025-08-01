import { useState, useEffect, useRef } from "react";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { useInView } from "react-intersection-observer";
import { fetchCars } from "@/utils/carFetching";
import { CarGrid } from "@/components/CarGrid";
import BrandFilter from "@/components/BrandFilter";
import { Button } from "@/components/ui/button";
import { ArrowUpAZ, ArrowDownAZ } from "lucide-react";
import { HandoverBanner } from "@/components/handover/HandoverBanner";
import { useHandoverPrompts } from "@/hooks/useHandoverPrompts";
import { useNavigate } from "react-router-dom";
import { createHandoverSession } from "@/services/handoverService";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import type { SearchFilters as Filters } from "@/components/SearchFilters";
import { toSafeCar } from '@/types/car'; // Ensure this import is present

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
  const navigate = useNavigate();
  
  // Get handover prompts for this renter
  const { 
    handoverPrompts, 
    hasHandoverPrompts, 
    hasUrgentPrompts,
    refetch: refetchPrompts 
  } = useHandoverPrompts();

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

  // Remove duplicate import comments and ensure proper car conversion:
  const allAvailableCars =
    availableCars?.pages.flatMap((page) =>
      page.data
        .filter(car => car && typeof car === 'object' && car.id)
        .map((car) => ({
          ...toSafeCar(car),
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

  const handleStartHandover = async (bookingId: string) => {
    try {
      console.log("Starting handover for booking:", bookingId);
      
      // Get booking details to find host and renter IDs
      const { data: booking, error: bookingError } = await supabase
        .from('bookings')
        .select(`
          id,
          renter_id,
          cars!inner(owner_id)
        `)
        .eq('id', bookingId)
        .single();

      if (bookingError) throw bookingError;
      if (!booking) throw new Error('Booking not found');

      const hostId = booking.cars.owner_id;
      const renterId = booking.renter_id;

      // Create handover session
      const session = await createHandoverSession(bookingId, hostId, renterId, 'pickup');
      
      if (session) {
        toast.success("Handover process started");
        // Navigate to map with handover mode
        navigate(`/map?bookingId=${bookingId}&mode=handover&role=renter`);
        refetchPrompts(); // Refresh prompts
      }
    } catch (error) {
      console.error("Error starting handover:", error);
      toast.error("Failed to start handover process");
    }
  };

  return (
    <div className="space-y-6">
      {/* Handover Prompts */}
      {hasHandoverPrompts && (
        <div className="space-y-3">
          {handoverPrompts.map((prompt) => (
            <HandoverBanner
              key={prompt.id}
              prompt={prompt}
              onStartHandover={handleStartHandover}
            />
          ))}
        </div>
      )}
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

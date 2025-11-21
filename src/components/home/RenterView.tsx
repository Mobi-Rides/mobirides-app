import { useState, useEffect, useRef, useMemo } from "react";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { useInView } from "react-intersection-observer";
import { fetchCars } from "@/utils/carFetching";
import { CarGrid } from "@/components/CarGrid";
import BrandFilter from "@/components/BrandFilter";
import { Button } from "@/components/ui/button";
import { ArrowUpAZ, ArrowDownAZ } from "lucide-react";
import { HandoverBanner } from "@/components/handover/HandoverBanner";
import { useHandoverPrompts } from "@/hooks/useHandoverPrompts";
import { useNavigate, useSearchParams } from "react-router-dom";
import { createHandoverSession } from "@/services/handoverService";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import type { SearchFilters as Filters } from "@/components/SearchFilters";
import { toSafeCar, type SafeCar } from '@/types/car'; // Ensure this import is present
import { SuccessPopup } from "@/components/SuccessPopup";

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
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  const { ref: inViewRef, inView } = useInView();
  const loadMoreRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  
  // Get handover prompts for this renter
  const { 
    handoverPrompts, 
    hasHandoverPrompts, 
    hasUrgentPrompts,
    refetch: refetchPrompts 
  } = useHandoverPrompts();

  // Check for verification success parameter
  useEffect(() => {
    const verificationSuccess = searchParams.get('verification_success');
    if (verificationSuccess === 'true') {
      setShowSuccessPopup(true);
      // Clean up the URL parameter
      const newSearchParams = new URLSearchParams(searchParams);
      newSearchParams.delete('verification_success');
      setSearchParams(newSearchParams, { replace: true });
    }
  }, [searchParams, setSearchParams]);

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
  }, [sortOrder, onFiltersChange, filters]);

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

  const savedCarsSet = useMemo(() => {
    return savedCarIds || new Set<string>();
  }, [savedCarIds]);

  // State for cars with ratings
  const [carsWithRatings, setCarsWithRatings] = useState<SafeCar[]>([]);

  // Process cars and fetch ratings
  const allAvailableCars = useMemo(() => {
    return availableCars?.pages.flatMap((page) =>
      page.data
        .filter(car => car && typeof car === 'object' && car.id)
        .map((car) => ({
          ...toSafeCar(car),
          isSaved: savedCarsSet.has(car.id),
        })),
    ) || [];
  }, [availableCars?.pages, savedCarsSet]);

  // Fetch ratings for cars when they change
  useEffect(() => {
    const fetchRatings = async () => {
      if (allAvailableCars.length === 0) {
        setCarsWithRatings([]);
        return;
      }

      console.log(`[RenterView] Fetching ratings for ${allAvailableCars.length} cars`);
      
      const carsWithRatingsPromises = allAvailableCars.map(async (car) => {
        try {
          const { data: rating, error } = await supabase.rpc('calculate_car_rating', {
            car_uuid: car.id
          });
          
          if (error) {
            console.error(`[RenterView] Error fetching rating for car ${car.id}:`, error);
            return { ...car, rating: 0, reviewCount: 0 };
          }
          
          // Fetch review count
          const { count: reviewCount } = await supabase
            .from('reviews')
            .select('*', { count: 'exact', head: true })
            .eq('car_id', car.id)
            .eq('review_type', 'car')
            .eq('status', 'published');
          
          console.log(`[RenterView] Car ${car.brand} ${car.model} (${car.id}) rating:`, rating, 'reviews:', reviewCount);
          return { ...car, rating: rating || 0, reviewCount: reviewCount || 0 };
        } catch (error) {
          console.error(`[RenterView] Exception fetching rating for car ${car.id}:`, error);
          return { ...car, rating: 0, reviewCount: 0 };
        }
      });

      const carsWithRatingsResults = await Promise.all(carsWithRatingsPromises);
      console.log(`[RenterView] Final cars with ratings:`, carsWithRatingsResults.map(c => ({ id: c.id, brand: c.brand, model: c.model, rating: c.rating, reviewCount: c.reviewCount })));
      setCarsWithRatings(carsWithRatingsResults);
    };

    fetchRatings();
  }, [allAvailableCars, availableCars]);

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
      const session = await createHandoverSession(bookingId, 'pickup', hostId, renterId);
      
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
        cars={carsWithRatings}
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
      
      {/* Success Popup */}
      <SuccessPopup
        isVisible={showSuccessPopup}
        onClose={() => setShowSuccessPopup(false)}
        autoCloseDelay={5000}
      />
    </div>
  );
};

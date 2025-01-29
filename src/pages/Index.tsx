import { useState, useEffect } from "react";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { BrandFilter } from "@/components/BrandFilter";
import { Navigation } from "@/components/Navigation";
import { useInView } from "react-intersection-observer";
import { supabase } from "@/integrations/supabase/client";
import type { Car } from "@/types/car";
import type { SearchFilters as Filters } from "@/components/SearchFilters";
import { fetchCars } from "@/utils/carFetching";
import { Header } from "@/components/Header";
import { CarGrid } from "@/components/CarGrid";
import { toast } from "sonner";

const Index = () => {
  const [selectedBrand, setSelectedBrand] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [userRole, setUserRole] = useState<"host" | "renter" | null>(null);
  const [isLoadingRole, setIsLoadingRole] = useState(true);
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [filters, setFilters] = useState<Filters>({
    startDate: undefined,
    endDate: undefined,
    vehicleType: undefined,
    location: "",
    sortBy: "distance",
    sortOrder: "asc",
  });

  const { ref: loadMoreRef, inView } = useInView();

  // Query for all available cars (for renters)
  const { 
    data: availableCars,
    isLoading: isLoadingCars,
    error: carsError,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage
  } = useInfiniteQuery({
    queryKey: ['available-cars', selectedBrand, filters],
    queryFn: ({ pageParam = 0 }) => fetchCars({ 
      pageParam, 
      filters,
      searchParams: selectedBrand ? { model: selectedBrand } : undefined
    }),
    getNextPageParam: (lastPage) => lastPage.nextPage || undefined,
    initialPageParam: 0,
    enabled: userRole === 'renter'
  });

  // Query for host's cars
  const { 
    data: hostCarsData, 
    isLoading: hostCarsLoading,
    error: hostCarsError
  } = useQuery({
    queryKey: ['host-cars'],
    queryFn: async () => {
      console.log("Fetching host cars");
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user?.id) return [];
      
      const { data, error } = await supabase
        .from('cars')
        .select('*')
        .eq('owner_id', session.user.id);

      if (error) throw error;
      console.log("Host cars fetched:", data);
      return data as Car[];
    },
    enabled: userRole === 'host'
  });

  // Query for saved cars - only when viewing saved cars
  const { data: savedCarsData = new Set<string>() } = useQuery({
    queryKey: ['saved-cars'],
    queryFn: async () => {
      console.log("Fetching saved car IDs");
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
      console.log("Saved car IDs:", Array.from(savedIds));
      return savedIds;
    },
    enabled: false // Disable this query on the index page
  });

  const hostCars = hostCarsData || [];
  
  // Flatten available cars from all pages without marking them as saved
  const allAvailableCars = availableCars?.pages.flatMap(page => page.data) || [];

  console.log("Available cars:", allAvailableCars);

  useEffect(() => {
    const fetchUserRole = async () => {
      try {
        setIsLoadingRole(true);
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error("Session error:", sessionError);
          toast.error("Failed to fetch user session. Please try refreshing the page.");
          setUserRole(null);
          return;
        }
        
        if (session?.user) {
          console.log("Fetching role for user ID:", session.user.id);
          const { data: profile, error: profileError } = await supabase
            .from("profiles")
            .select("role")
            .eq("id", session.user.id)
            .single();

          if (profileError) {
            console.error("Profile error:", profileError);
            toast.error("Failed to fetch user profile. Please try refreshing the page.");
            setUserRole(null);
            return;
          }

          if (profile) {
            console.log("User role:", profile.role);
            setUserRole(profile.role);
          }
        }
      } catch (error) {
        console.error("Error fetching user role:", error);
        toast.error("An unexpected error occurred. Please try refreshing the page.");
      } finally {
        setIsLoadingRole(false);
      }
    };

    fetchUserRole();
  }, []);

  // Load more cars when scrolling
  useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [inView, hasNextPage, isFetchingNextPage, fetchNextPage]);

  return (
    <div className="min-h-screen bg-background pb-20">
      <Header 
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onFiltersChange={setFilters}
      />
      <main className="container mx-auto px-4 py-8">
        <div className="space-y-6">
          <BrandFilter
            selectedBrand={selectedBrand}
            onSelectBrand={setSelectedBrand}
          />
          <CarGrid
            cars={userRole === 'host' ? hostCars : allAvailableCars}
            isLoading={userRole === 'host' ? hostCarsLoading : isLoadingCars}
            error={userRole === 'host' ? hostCarsError : carsError}
            loadMoreRef={loadMoreRef}
            isFetchingNextPage={isFetchingNextPage}
          />
        </div>
      </main>
      <Navigation />
    </div>
  );
};

export default Index;
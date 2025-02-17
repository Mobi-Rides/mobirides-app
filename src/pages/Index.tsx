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
import { Button } from "@/components/ui/button";
import { ArrowUpAZ, ArrowDownAZ } from "lucide-react";

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
    sortBy: "price",
    sortOrder: "asc",
  });

  const { ref: loadMoreRef, inView } = useInView();

  useEffect(() => {
    setFilters(prev => ({
      ...prev,
      sortOrder: sortOrder
    }));
  }, [sortOrder]);

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
    initialPageParam: 0,
    enabled: userRole === 'renter'
  });

  const { 
    data: hostCarsData, 
    isLoading: hostCarsLoading,
    error: hostCarsError
  } = useQuery({
    queryKey: ['host-cars', searchQuery, sortOrder],
    queryFn: async () => {
      console.log("Fetching host cars with search:", searchQuery);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user?.id) return [];
      
      let query = supabase
        .from('cars')
        .select('*')
        .eq('owner_id', session.user.id);

      if (searchQuery) {
        query = query.or(`brand.ilike.%${searchQuery}%,model.ilike.%${searchQuery}%`);
      }

      query = query.order('price_per_day', { ascending: sortOrder === 'asc' });

      const { data, error } = await query;

      if (error) throw error;
      console.log("Host cars fetched:", data);
      return data as Car[];
    },
    enabled: userRole === 'host'
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
    },
    enabled: userRole === 'renter'
  });

  const hostCars = hostCarsData || [];
  
  const savedCarsSet = savedCarIds || new Set<string>();
  
  const allAvailableCars = availableCars?.pages.flatMap(page => 
    page.data.map(car => ({
      ...car,
      isSaved: savedCarsSet.has(car.id)
    }))
  ) || [];

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

  useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [inView, hasNextPage, isFetchingNextPage, fetchNextPage]);

  const toggleSortOrder = () => {
    setSortOrder(prev => prev === "asc" ? "desc" : "asc");
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <Header 
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onFiltersChange={setFilters}
      />
      <main className="container mx-auto px-4 py-8">
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <BrandFilter
              selectedBrand={selectedBrand}
              onSelectBrand={setSelectedBrand}
            />
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

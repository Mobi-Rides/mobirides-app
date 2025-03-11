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
import { ArrowUpAZ, ArrowDownAZ, LogIn } from "lucide-react";
import { BarLoader } from "react-spinners";

const Index = () => {
  const [selectedBrand, setSelectedBrand] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [userRole, setUserRole] = useState<"host" | "renter" | null>(null);
  const [isLoadingRole, setIsLoadingRole] = useState(true);
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [filters, setFilters] = useState<Filters>({
    startDate: undefined,
    endDate: undefined,
    vehicleType: undefined,
    location: "",
    sortBy: "price",
    sortOrder: "asc",
  });

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setIsAuthenticated(!!session);
    };
    
    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsAuthenticated(!!session);
    });

    return () => subscription.unsubscribe();
  }, []);

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

  const navigateToSignIn = () => {
    window.location.href = "/login";
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <Header
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onFiltersChange={setFilters}
      />
      <main className="container mx-auto px-4 py-8">
        {isLoadingRole ? (
          <div className="flex flex-col items-center justify-center min-h-[400px] w-full">
            <p className="text-sm text-muted-foreground mb-3">
              Loading your profile...
            </p>
            <BarLoader color="#7c3aed" width={100} />
          </div>
        ) : !isAuthenticated ? (
          <div className="flex flex-col items-center justify-center gap-4 min-h-[400px] text-center max-w-md mx-auto">
            <div className=" p-8 rounded-lg ">
              <h2 className="text-3xl md:text-4xl font-semibold mb-4 text-gray-600">
                Welcome to Mobirides{" "}
              </h2>
              <p className="text-muted-foreground mb-6">
                Please sign in to browse our collection of cars for rent, save
                your favorites, and book your next ride!
              </p>

              <Button
                variant="outline"
                size="icon"
                className="rounded-2xl border-primary md:size-auto md:px-4 md:py-2 md:flex md:items-center md:gap-2 mx-auto"
                onClick={navigateToSignIn}
              >
                {/* <Plus className="h-4 w-4 text-[#581CFA]" /> */}
                <LogIn className="h-4 w-4 text-primary" />

                <span className="hidden md:inline-block">
                  <p className="text-primary text-xs md:text-sm lg:text-base font-semibold">
                    Sign in
                  </p>
                </span>
              </Button>

            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <BrandFilter
              selectedBrand={selectedBrand}
              onSelectBrand={setSelectedBrand}
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
              cars={userRole === "host" ? hostCars : allAvailableCars}
              isLoading={userRole === "host" ? hostCarsLoading : isLoadingCars}
              error={userRole === "host" ? hostCarsError : carsError}
              loadMoreRef={loadMoreRef}
              isFetchingNextPage={isFetchingNextPage}
              isAuthenticated={isAuthenticated}
            />
          </div>
        )}
      </main>
      <Navigation />
    </div>
  );
};

export default Index;

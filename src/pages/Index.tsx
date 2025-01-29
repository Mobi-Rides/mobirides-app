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
import { ArrowUp, ArrowDown } from "lucide-react";
import { toast } from "sonner";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

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

  // New search state
  const [modelSearch, setModelSearch] = useState("");
  const [yearSearch, setYearSearch] = useState<string>("");
  const [minPrice, setMinPrice] = useState<string>("");
  const [maxPrice, setMaxPrice] = useState<string>("");

  const { ref: loadMoreRef, inView } = useInView();

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
            console.error("Error fetching profile:", profileError);
            toast.error("Failed to fetch user profile. Please try refreshing the page.");
            setUserRole(null);
            return;
          }
          
          if (profile) {
            console.log("Profile data received:", profile);
            setUserRole(profile.role);
          }
        } else {
          console.log("No authenticated user found");
          setUserRole(null);
        }
      } catch (error) {
        console.error("Error in fetchUserRole:", error);
        toast.error("An error occurred while fetching user data. Please try refreshing the page.");
        setUserRole(null);
      } finally {
        setIsLoadingRole(false);
      }
    };
    
    fetchUserRole();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_OUT') {
        setUserRole(null);
      } else if (session) {
        fetchUserRole();
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const searchParams = {
    model: modelSearch || undefined,
    year: yearSearch ? parseInt(yearSearch) : undefined,
    minPrice: minPrice ? parseInt(minPrice) : undefined,
    maxPrice: maxPrice ? parseInt(maxPrice) : undefined,
  };

  const {
    data,
    isLoading: allCarsLoading,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage
  } = useInfiniteQuery({
    queryKey: ["cars", filters, searchParams],
    queryFn: ({ pageParam }) => fetchCars({ pageParam, filters, searchParams }),
    getNextPageParam: (lastPage) => lastPage.nextPage,
    initialPageParam: 0,
    enabled: userRole === "renter" || userRole === null
  });

  useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [inView, hasNextPage, isFetchingNextPage, fetchNextPage]);

  const allCars = data?.pages.flatMap(page => page.data) ?? [];

  const filteredCars = (userRole === "host" ? hostCars : allCars)?.filter((car) => {
    if (!car) return false;
    const matchesBrand = !selectedBrand || car.brand === selectedBrand;
    const matchesSearch =
      !searchQuery ||
      car.brand.toLowerCase().includes(searchQuery.toLowerCase()) ||
      car.model.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesBrand && matchesSearch;
  })
  .map(car => ({
    ...car,
    isSaved: savedCarIds ? Array.from(savedCarIds).includes(car.id) : false
  }))
  .sort((a, b) => {
    return sortOrder === "asc" 
      ? a.price_per_day - b.price_per_day 
      : b.price_per_day - a.price_per_day;
  }) ?? [];

  const isLoading = isLoadingRole || (userRole === "host" ? hostCarsLoading : allCarsLoading);

  if (isLoadingRole) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <Header
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onFiltersChange={setFilters}
      />

      <main className="p-4 max-w-2xl mx-auto">
        {userRole === "host" ? (
          <section>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">Your Listed Cars</h2>
              <button className="text-primary text-sm">Manage Listings</button>
            </div>
            
            <CarGrid
              cars={filteredCars}
              isLoading={hostCarsLoading}
              error={hostCarsError}
              loadMoreRef={loadMoreRef}
              isFetchingNextPage={false}
            />
          </section>
        ) : (
          <>
            <section className="mb-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold">Brands</h2>
              </div>
              <BrandFilter
                selectedBrand={selectedBrand}
                onSelectBrand={setSelectedBrand}
              />
            </section>

            <section className="mb-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-white rounded-lg shadow-sm">
                <div>
                  <Label htmlFor="model">Model</Label>
                  <Input
                    id="model"
                    placeholder="Search by model..."
                    value={modelSearch}
                    onChange={(e) => setModelSearch(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="year">Year</Label>
                  <Input
                    id="year"
                    type="number"
                    placeholder="Search by year..."
                    value={yearSearch}
                    onChange={(e) => setYearSearch(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="minPrice">Min Price (BWP)</Label>
                  <Input
                    id="minPrice"
                    type="number"
                    placeholder="Min price..."
                    value={minPrice}
                    onChange={(e) => setMinPrice(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="maxPrice">Max Price (BWP)</Label>
                  <Input
                    id="maxPrice"
                    type="number"
                    placeholder="Max price..."
                    value={maxPrice}
                    onChange={(e) => setMaxPrice(e.target.value)}
                  />
                </div>
              </div>
            </section>

            <section>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold">Available Cars</h2>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button 
                        onClick={() => setSortOrder(prev => prev === "asc" ? "desc" : "asc")}
                        className="flex items-center gap-2 text-primary hover:text-primary/80 p-2"
                      >
                        {sortOrder === "asc" ? (
                          <ArrowUp className="h-5 w-5" />
                        ) : (
                          <ArrowDown className="h-5 w-5" />
                        )}
                      </button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Sort by price: {sortOrder === "asc" ? "Low to High" : "High to Low"}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              
              <CarGrid
                cars={filteredCars}
                isLoading={isLoading}
                error={error}
                loadMoreRef={loadMoreRef}
                isFetchingNextPage={isFetchingNextPage}
              />
            </section>
          </>
        )}
      </main>

      <Navigation />
    </div>
  );
};

export default Index;

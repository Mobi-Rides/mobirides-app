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

const Index = () => {
  const [selectedBrand, setSelectedBrand] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [userRole, setUserRole] = useState<"host" | "renter" | null>(null);
  const [isLoadingRole, setIsLoadingRole] = useState(true);
  const [filters, setFilters] = useState<Filters>({
    startDate: undefined,
    endDate: undefined,
    vehicleType: undefined,
    location: "",
    sortBy: "distance",
    sortOrder: "asc",
  });

  const { ref: loadMoreRef, inView } = useInView();

  // Fetch user role
  useEffect(() => {
    const fetchUserRole = async () => {
      try {
        setIsLoadingRole(true);
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session?.user) {
          const { data: profile } = await supabase
            .from("profiles")
            .select("role")
            .eq("id", session.user.id)
            .single();
          
          if (profile) {
            console.log("User role fetched:", profile.role);
            setUserRole(profile.role);
          }
        } else {
          console.log("No authenticated user found");
          setUserRole(null);
        }
      } catch (error) {
        console.error("Error fetching user role:", error);
        setUserRole(null);
      } finally {
        setIsLoadingRole(false);
      }
    };
    
    fetchUserRole();

    // Set up auth state change listener
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

  // Fetch saved cars
  const { data: savedCarIds } = useQuery({
    queryKey: ["saved-cars"],
    queryFn: async () => {
      const { data: savedCarsData } = await supabase
        .from("saved_cars")
        .select("car_id");
      console.log("Saved car IDs:", savedCarsData);
      return new Set(savedCarsData?.map(saved => saved.car_id) || []);
    },
    enabled: !!userRole // Only fetch if user is authenticated
  });

  // Fetch host's cars if user is a host
  const { data: hostCars, isLoading: hostCarsLoading } = useQuery({
    queryKey: ["host-cars"],
    queryFn: async () => {
      if (userRole !== "host") return null;
      
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) return null;

      const { data, error } = await supabase
        .from("cars")
        .select("*")
        .eq("owner_id", session.user.id);

      if (error) throw error;
      return data;
    },
    enabled: userRole === "host"
  });

  // Fetch all cars for renters
  const {
    data,
    isLoading: allCarsLoading,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage
  } = useInfiniteQuery({
    queryKey: ["cars", filters],
    queryFn: ({ pageParam }) => fetchCars({ pageParam, filters }),
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
  const brands = allCars.length > 0 ? getUniqueBrands(allCars) : [];

  const filteredCars = (userRole === "host" ? hostCars : allCars)?.filter((car) => {
    if (!car) return false;
    const matchesBrand = !selectedBrand || car.brand === selectedBrand;
    const matchesSearch =
      !searchQuery ||
      car.brand.toLowerCase().includes(searchQuery.toLowerCase()) ||
      car.model.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesBrand && matchesSearch;
  }).map(car => ({
    ...car,
    isSaved: savedCarIds ? Array.from(savedCarIds).includes(car.id) : false
  })) ?? [];

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
              isLoading={isLoading}
              error={error}
              loadMoreRef={loadMoreRef}
              isFetchingNextPage={false}
            />
          </section>
        ) : (
          <>
            <section className="mb-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold">Brands</h2>
                <button className="text-primary text-sm">See All</button>
              </div>
              <BrandFilter
                brands={brands}
                selectedBrand={selectedBrand}
                onSelectBrand={setSelectedBrand}
              />
            </section>

            <section>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold">Available Cars</h2>
                <button className="text-primary text-sm">See All</button>
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

const getUniqueBrands = (cars: Car[]) => {
  const brands = [...new Set(cars.map(car => car.brand))];
  return brands.map(name => ({
    name,
    logo: "/placeholder.svg"
  }));
};

export default Index;
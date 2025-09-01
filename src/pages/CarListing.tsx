import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { CarGrid } from "@/components/CarGrid";
import { SearchFilters } from "@/components/SearchFilters";
import type { SearchFilters as Filters } from "@/components/SearchFilters";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

const PAGE_SIZE = 12;

const CarListing = () => {
  const [cars, setCars] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalCars, setTotalCars] = useState(0);
  const [searchParams, setSearchParams] = useSearchParams();
  const [filters, setFilters] = useState<Filters>({
    startDate: undefined,
    endDate: undefined,
    vehicleType: undefined,
    location: "",
    sortBy: "price",
    sortOrder: "asc",
  });
  const [hasMoreItems, setHasMoreItems] = useState(true);

  useEffect(() => {
    const initialLocation = searchParams.get("location") || "";
    setFilters((prevFilters) => ({
      ...prevFilters,
      location: initialLocation,
    }));
  }, [searchParams]);

  useEffect(() => {
    const fetchCars = async () => {
      setLoading(true);
      try {
        let query = supabase
          .from("cars")
          .select("*", { count: "exact" })
          .eq("is_available", true)
          .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1);

        // Apply filters
        if (filters.location) {
          query = query.ilike("location", `%${filters.location}%`);
        }
        if (filters.vehicleType) {
          query = query.eq("vehicle_type", filters.vehicleType);
        }

        // Apply sorting
        const sortColumn = filters.sortBy === 'price' ? 'rental_price' : 'created_at';
        query = query.order(sortColumn, { ascending: filters.sortOrder === 'asc' });

        const { data, error, count } = await query;

        if (error) {
          throw error;
        }

        // Fetch ratings for each car
        console.log('🔍 Fetching ratings for', data?.length || 0, 'cars');
        const carsWithRatings = await Promise.all(
          (data || []).map(async (car) => {
            try {
              const { data: ratingData, error: ratingError } = await supabase
                .rpc('calculate_car_rating', { car_uuid: car.id });
              
              if (ratingError) {
                console.error('Error fetching rating for car:', car.id, ratingError);
                return { ...car, rating: 0 };
              }
              
              console.log(`✅ Car ${car.brand} ${car.model} (${car.id}): Rating ${ratingData || 0}`);
              return { ...car, rating: ratingData || 0 };
            } catch (error) {
              console.error('Error calculating rating for car:', car.id, error);
              return { ...car, rating: 0 };
            }
          })
        );
        
        console.log('🎯 Final cars with ratings:', carsWithRatings.map(car => ({
          id: car.id,
          brand: car.brand,
          model: car.model,
          rating: car.rating
        })));

        setCars((prevCars) => (page === 1 ? carsWithRatings : [...prevCars, ...carsWithRatings]));
        setTotalCars(count || 0);
        setHasMoreItems(data.length === PAGE_SIZE);
      } catch (error) {
        console.error("Error fetching cars:", error);
        toast.error("Failed to fetch cars.");
      } finally {
        setLoading(false);
      }
    };

    fetchCars();
  }, [filters, page]);

  const handleFiltersChange = (newFilters: Filters) => {
    setCars([]);
    setPage(1);
    setFilters(newFilters);
  };

  const loadMore = () => {
    setPage((prevPage) => prevPage + 1);
  };

  const isLoading = loading && cars.length === 0;
  const isFetchingMore = loading && cars.length > 0;

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-semibold mb-4">Car Listings</h1>
      <SearchFilters onFiltersChange={handleFiltersChange} />
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="space-y-3">
              <Skeleton className="h-[150px] w-full rounded-md" />
              <div className="space-y-1.5">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <>
          <CarGrid cars={cars} hasMoreItems={hasMoreItems} />
          {isFetchingMore && (
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="space-y-3">
                  <Skeleton className="h-[150px] w-full rounded-md" />
                  <div className="space-y-1.5">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          )}
          {hasMoreItems && !isFetchingMore && (
            <Button onClick={loadMore} className="w-full mt-4">
              Load More
            </Button>
          )}
          {cars.length === 0 && !loading && (
            <div className="text-center mt-4">No cars found.</div>
          )}
        </>
      )}
    </div>
  );
};

export default CarListing;

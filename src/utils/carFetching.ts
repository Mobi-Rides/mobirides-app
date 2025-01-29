import { supabase } from "@/integrations/supabase/client";
import type { SearchFilters } from "@/components/SearchFilters";
import type { CarQueryResponse } from "@/types/car";

const ITEMS_PER_PAGE = 10;

export const fetchCars = async ({ 
  pageParam = 0, 
  filters,
  searchParams 
}: { 
  pageParam?: number;
  filters?: SearchFilters;
  searchParams?: {
    brand?: string;
    year?: number;
    minPrice?: number;
    maxPrice?: number;
    searchTerm?: string;
  };
}): Promise<CarQueryResponse> => {
  console.log("Fetching cars with filters:", filters);
  console.log("Search params:", searchParams);
  
  let query = supabase
    .from("cars")
    .select("*", { count: "exact" })
    .eq("is_available", true)
    .range(pageParam * ITEMS_PER_PAGE, (pageParam + 1) * ITEMS_PER_PAGE - 1);

  // Apply search term if it exists
  if (searchParams?.searchTerm) {
    query = query.or(`brand.ilike.%${searchParams.searchTerm}%,model.ilike.%${searchParams.searchTerm}%`);
  }

  // Apply brand filter if it exists
  if (searchParams?.brand) {
    query = query.eq("brand", searchParams.brand);
  }

  // Apply filters if they exist
  if (filters?.model) {
    query = query.ilike("model", `%${filters.model}%`);
  }

  if (filters?.year) {
    query = query.eq("year", filters.year);
  }

  if (filters?.minPrice) {
    query = query.gte("price_per_day", filters.minPrice);
  }

  if (filters?.maxPrice) {
    query = query.lte("price_per_day", filters.maxPrice);
  }

  if (filters?.vehicleType) {
    query = query.eq("vehicle_type", filters.vehicleType);
  }

  if (filters?.location) {
    query = query.ilike("location", `%${filters.location}%`);
  }

  if (filters?.sortBy === "price") {
    query = query.order("price_per_day", { ascending: filters.sortOrder === "asc" });
  }

  const { data, error, count } = await query;

  if (error) {
    console.error("Error fetching cars:", error);
    throw error;
  }

  return { 
    data: data || [], 
    nextPage: data && data.length === ITEMS_PER_PAGE ? pageParam + 1 : undefined,
    count 
  };
};
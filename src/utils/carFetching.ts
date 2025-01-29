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
    model?: string;
    year?: number;
    minPrice?: number;
    maxPrice?: number;
  };
}): Promise<CarQueryResponse> => {
  console.log("Fetching cars with filters:", filters, "search params:", searchParams, "page:", pageParam);
  
  let query = supabase
    .from("cars")
    .select("*", { count: "exact" })
    .eq("is_available", true)
    .range(pageParam * ITEMS_PER_PAGE, (pageParam + 1) * ITEMS_PER_PAGE - 1);

  // Apply search filters
  if (searchParams?.model) {
    query = query.ilike("model", `%${searchParams.model}%`);
  }

  if (searchParams?.year) {
    query = query.eq("year", searchParams.year);
  }

  if (searchParams?.minPrice) {
    query = query.gte("price_per_day", searchParams.minPrice);
  }

  if (searchParams?.maxPrice) {
    query = query.lte("price_per_day", searchParams.maxPrice);
  }

  // Apply existing filters
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

  console.log("Cars fetched successfully:", data);
  return { 
    data: data || [], 
    nextPage: data && data.length === ITEMS_PER_PAGE ? pageParam + 1 : undefined,
    count 
  };
};
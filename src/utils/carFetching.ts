import { supabase } from "@/integrations/supabase/client";
import type { SearchFilters } from "@/components/SearchFilters";
import type { CarQueryResponse } from "@/types/car";

const ITEMS_PER_PAGE = 10;

export const fetchCars = async ({ 
  pageParam = 0, 
  filters 
}: { 
  pageParam?: number; 
  filters?: SearchFilters 
}): Promise<CarQueryResponse> => {
  console.log("Fetching cars with filters:", filters, "page:", pageParam);
  let query = supabase
    .from("cars")
    .select("*", { count: "exact" })
    .eq("is_available", true)
    .range(pageParam * ITEMS_PER_PAGE, (pageParam + 1) * ITEMS_PER_PAGE - 1);

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
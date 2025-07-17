
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const useCommissionRate = () => {
  return useQuery({
    queryKey: ["commission-rate"],
    queryFn: async (): Promise<number> => {
      const { data, error } = await supabase
        .from("commission_rates")
        .select("rate")
        .is("effective_until", null)
        .order("effective_from", { ascending: false })
        .limit(1)
        .single();

      if (error) {
        console.warn("Failed to fetch commission rate, using default:", error);
        return 0.15; // Default fallback
      }

      return data.rate;
    },
    staleTime: 1000 * 60 * 60, // Cache for 1 hour
    gcTime: 1000 * 60 * 60 * 24, // Keep in cache for 24 hours (replaces cacheTime)
  });
};

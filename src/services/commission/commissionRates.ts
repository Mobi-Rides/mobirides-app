
import { supabase } from "@/integrations/supabase/client";

export interface CommissionRate {
  id: string;
  rate: number;
  effective_from: string;
  effective_until?: string;
}

export const getCurrentCommissionRate = async (): Promise<number> => {
  try {
    console.log("CommissionRates: Fetching current commission rate");
    
    const { data, error } = await supabase
      .from("commission_rates")
      .select("rate")
      .lte("effective_from", new Date().toISOString())
      .or("effective_until.is.null,effective_until.gt." + new Date().toISOString())
      .order("effective_from", { ascending: false })
      .limit(1)
      .single();

    if (error) {
      console.error("CommissionRates: Error fetching commission rate:", error);
      return 0.15; // Default 15% fallback
    }

    console.log("CommissionRates: Commission rate fetched:", data.rate);
    return data.rate;
  } catch (error) {
    console.error("CommissionRates: Unexpected error fetching commission rate:", error);
    return 0.15; // Default 15% fallback
  }
};

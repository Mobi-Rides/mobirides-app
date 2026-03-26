
import { supabase } from "@/integrations/supabase/client";

export interface CommissionRate {
  id: string;
  rate: number;
  effective_from: string;
  effective_until?: string;
}

const getDefaultCommissionRate = async (): Promise<number> => {
  try {
    const { data, error } = await supabase
      .from("platform_settings")
      .select("setting_value")
      .eq("setting_key", "commission_rate_default")
      .single();

    if (error || !data) return 0.15;
    return Number(data.setting_value) || 0.15;
  } catch (e) {
    return 0.15;
  }
};

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
      return await getDefaultCommissionRate();
    }

    console.log("CommissionRates: Commission rate fetched:", data.rate);
    return data.rate;
  } catch (error) {
    console.error("CommissionRates: Unexpected error fetching commission rate:", error);
    return await getDefaultCommissionRate();
  }
};

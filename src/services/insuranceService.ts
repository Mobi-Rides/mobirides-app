import { supabase } from "@/integrations/supabase/client";

type InsurancePlan = {
  id: string;
  name: string;
  description?: string;
  base_rate: number;
  coverage_percentage: number;
  is_active: boolean;
};

export const listActivePlans = async (): Promise<InsurancePlan[]> => {
  const { data, error } = await supabase
    .from("insurance_plans")
    .select("id,name,description,base_rate,coverage_percentage,is_active")
    .eq("is_active", true);
  if (error) return [];
  return (data ?? []) as InsurancePlan[];
};

export const calculatePremium = async (basePrice: number, plan: InsurancePlan) => {
  const { data, error } = await supabase.functions.invoke("calculate-insurance", {
    body: { basePrice, plan },
  });
  if (error) return null;
  return data?.premium as number;
};


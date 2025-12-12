import { supabase } from "@/integrations/supabase/client";

export async function incrementCarViewCount(carId: string): Promise<void> {
  const { error } = await supabase.rpc('increment_car_view_count', { car_id: carId });
  if (error) {
    console.error('Error incrementing view count:', error);
  }
}

export async function getCarViewCount(carId: string): Promise<number> {
  const { data, error } = await supabase
    .from('cars')
    .select('view_count')
    .eq('id', carId)
    .single();

  if (error) {
    console.error('Error fetching view count:', error);
    return 0;
  }

  return data?.view_count || 0;
}

import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const updateCarLocation = async (
  carId: string,
  latitude: number,
  longitude: number
): Promise<boolean> => {
  console.log("Attempting to update car location:", { carId, latitude, longitude });

  try {
    const { data, error } = await supabase
      .from('cars')
      .update({ 
        latitude, 
        longitude,
        updated_at: new Date().toISOString()
      })
      .eq('id', carId)
      .select()
      .maybeSingle();

    if (error) {
      console.error("Error updating car location:", error);
      toast.error("Failed to update location");
      return false;
    }

    console.log("Location update response:", data);
    toast.success("Location updated successfully");
    return true;
  } catch (error) {
    console.error("Unexpected error updating location:", error);
    toast.error("Failed to update location");
    return false;
  }
};
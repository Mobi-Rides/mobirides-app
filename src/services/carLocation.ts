import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const updateCarLocation = async (
  carId: string,
  latitude: number,
  longitude: number
): Promise<boolean> => {
  console.log("Updating car location:", { carId, latitude, longitude });

  const { error } = await supabase
    .from('cars')
    .update({
      latitude,
      longitude
    })
    .eq('id', carId);

  if (error) {
    console.error("Error updating car location:", error);
    toast.error("Failed to save new location");
    return false;
  }

  toast.success("Location updated successfully");
  return true;
};

import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

/**
 * Save a car to the user's favorites
 */
export const saveCar = async (carId: string): Promise<boolean> => {
  try {
    console.log("Saving car:", carId);
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session?.user) {
      console.log("No active session found when trying to save car");
      toast.error("Please sign in to save cars");
      return false;
    }

    // Check if car is already saved
    const { data: existingSaved } = await supabase
      .from("saved_cars")
      .select("id")
      .eq("user_id", session.user.id)
      .eq("car_id", carId)
      .maybeSingle();

    if (existingSaved) {
      console.log("Car already saved:", carId);
      return true;
    }

    // Save the car
    const { error } = await supabase
      .from("saved_cars")
      .insert({
        user_id: session.user.id,
        car_id: carId
      });

    if (error) {
      console.error("Error saving car:", error);
      toast.error("Failed to save car. Please try again.");
      return false;
    }

    toast.success("Car saved to your favorites");
    return true;
  } catch (error) {
    console.error("Error in saveCar:", error);
    toast.error("An error occurred while saving the car");
    return false;
  }
};

/**
 * Remove a car from the user's favorites
 */
export const unsaveCar = async (carId: string): Promise<boolean> => {
  try {
    console.log("Unsaving car:", carId);
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session?.user) {
      console.log("No active session found when trying to unsave car");
      toast.error("Please sign in to manage saved cars");
      return false;
    }

    const { error } = await supabase
      .from("saved_cars")
      .delete()
      .eq("user_id", session.user.id)
      .eq("car_id", carId);

    if (error) {
      console.error("Error unsaving car:", error);
      toast.error("Failed to remove car from favorites. Please try again.");
      return false;
    }

    toast.success("Car removed from your favorites");
    return true;
  } catch (error) {
    console.error("Error in unsaveCar:", error);
    toast.error("An error occurred while removing the car from favorites");
    return false;
  }
};

/**
 * Check if a car is saved for the current user
 */
export const isCarSaved = async (carId: string): Promise<boolean> => {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session?.user) {
      return false;
    }

    const { data } = await supabase
      .from("saved_cars")
      .select("id")
      .eq("user_id", session.user.id)
      .eq("car_id", carId)
      .maybeSingle();

    return !!data;
  } catch (error) {
    console.error("Error checking if car is saved:", error);
    return false;
  }
};

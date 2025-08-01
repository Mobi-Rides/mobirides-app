import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { createLocationUpdatePayload } from "@/utils/profileTypes";

export type updateUserLocationProps = {
  userId: string;
  lat: number;
  long: number;
};

export const updateUserLocation = async ({
  userId,
  lat,
  long,
}: updateUserLocationProps): Promise<boolean> => {
  try {
    // Check if browser supports geolocation
    if (!navigator.geolocation) {
      console.error("Geolocation not supported");
      toast.error("Your browser doesn't support geolocation");
      return false;
    }

    return new Promise((resolve) => {
      (async () => {
        try {
          console.log("Got coordinates:", lat, long);
          const payload = createLocationUpdatePayload(true, {
            latitude: lat,
            longitude: long,
          });

          const { error } = await supabase
            .from("profiles")
            .update(payload)
            .eq("id", userId);

          if (error) {
            console.error("Error updating location:", error);
            toast.error("Could not update your location in the database");
            resolve(false);
            return;
          }

          console.log("Location coordinates updated successfully");
          toast.success("Location updated successfully");
          resolve(true);
        } catch (error) {
          console.error("Error updating location:", error);
          toast.error("Could not update your location");
          resolve(false);
        }
      })();
    });
  } catch (error) {
    console.error("Error in updateUserLocation:", error);
    toast.error("An unexpected error occurred while updating your location");
    return false;
  }
};

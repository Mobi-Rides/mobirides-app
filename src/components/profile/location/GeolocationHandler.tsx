import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { createLocationUpdatePayload } from "@/utils/profileTypes";

export const updateUserLocation = async (userId: string): Promise<boolean> => {
  try {
    // Check if browser supports geolocation
    if (!navigator.geolocation) {
      console.error("Geolocation not supported");
      toast.error("Your browser doesn't support geolocation");
      return false;
    }

    // Check permission state if possible
    try {
      const permission = await navigator.permissions.query({
        name: "geolocation",
      });
      console.log("Geolocation permission status:", permission.state);
      if (permission.state === "denied") {
        toast.error(
          "Location permission denied. Please check your browser settings."
        );
        return false;
      }
    } catch (permError) {
      console.log("Could not check permission status:", permError);
      // Continue anyway, as the next step will trigger permission prompt
    }

    return new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          try {
            console.log("Got coordinates:", latitude, longitude);
            const payload = createLocationUpdatePayload(true, {
              latitude,
              longitude,
            });

            const { error } = await supabase
              .from("profiles")
              .update(payload)
              .eq("id", userId);

            if (error) {
              console.error("Error updating location:", error);
              throw error;
            }

            console.log("Location coordinates updated successfully");
            resolve(true);
          } catch (error) {
            console.error("Error updating location:", error);
            toast.error("Could not update your location");
            resolve(false);
          }
        },
        (error) => {
          console.error("Geolocation error:", error);
          let errorMsg = "Could not get your location. ";

          switch (error.code) {
            case error.PERMISSION_DENIED:
              errorMsg +=
                "Permission denied. Please check your browser permissions.";
              break;
            case error.POSITION_UNAVAILABLE:
              errorMsg += "Location information unavailable.";
              break;
            case error.TIMEOUT:
              errorMsg +=
                "Request timed out. Please try again or move to an area with better GPS signal.";
              break;
            default:
              errorMsg += "Unknown error occurred.";
          }

          toast.error(errorMsg);
          resolve(false);
        },
        {
          enableHighAccuracy: true,
          timeout: 30000, // Increased timeout value to 30 seconds
          maximumAge: 0,
        }
      );
    });
  } catch (error) {
    console.error("Error in updateUserLocation:", error);
    return false;
  }
};

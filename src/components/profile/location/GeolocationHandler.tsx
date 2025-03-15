
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
      // Create a timeout handler to avoid hanging indefinitely
      const timeoutId = setTimeout(() => {
        console.warn("Geolocation request timed out manually");
        toast.error("Location request timed out. Please try again later.");
        resolve(false);
      }, 20000); // 20 second backup timeout

      navigator.geolocation.getCurrentPosition(
        async (position) => {
          // Clear the backup timeout
          clearTimeout(timeoutId);
          
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
        },
        (error) => {
          // Clear the backup timeout
          clearTimeout(timeoutId);
          
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
                "Request timed out. Please try again or check your device location settings.";
              break;
            default:
              errorMsg += "Unknown error occurred.";
          }

          toast.error(errorMsg);
          resolve(false);
        },
        {
          enableHighAccuracy: false, // Set to false for faster less accurate results
          timeout: 15000, // Reduced timeout value to 15 seconds
          maximumAge: 60000, // Allow cached positions up to 1 minute old
        }
      );
    });
  } catch (error) {
    console.error("Error in updateUserLocation:", error);
    toast.error("An unexpected error occurred while updating your location");
    return false;
  }
};

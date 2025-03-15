
import { useState, useEffect } from "react";
import { useUser } from "@supabase/auth-helpers-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { hasLocationFields, ExtendedProfile } from "@/utils/profileTypes";

export const useLocationSharing = () => {
  const user = useUser();
  const [isSharingLocation, setIsSharingLocation] = useState(false);
  const [sharingScope, setSharingScope] = useState<string>("all");
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      console.log("No user found");
      setIsLoading(false);
      return;
    }

    const fetchUserStatus = async () => {
      setIsLoading(true);
      try {
        console.log("Fetching user profile for location status...");
        // Check if the location columns exist in the profiles table
        const { data: columnCheck, error: columnCheckError } = await supabase
          .from("profiles")
          .select("is_sharing_location, location_sharing_scope, latitude, longitude")
          .limit(1);
        
        if (columnCheckError) {
          console.error("Error checking for columns:", columnCheckError);
          setErrorMessage("Could not verify location columns");
          setIsLoading(false);
          return;
        }
        
        // Verify columns exist
        const columnsExist = columnCheck && 
          columnCheck.length > 0 &&
          'is_sharing_location' in columnCheck[0] &&
          'location_sharing_scope' in columnCheck[0];
          
        if (!columnsExist) {
          console.error("Required location columns don't exist in the profiles table");
          setErrorMessage("Location sharing is not supported");
          setIsLoading(false);
          return;
        }

        // Get the profile for the current user
        const { data, error } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .single();

        if (error) {
          console.error("Error fetching profile:", error);
          setErrorMessage("Could not fetch profile");
          throw error;
        }

        console.log("Profile data received:", data);

        // Cast to our extended profile type
        const profile = data as ExtendedProfile;

        // Check if location fields exist using our utility
        if (hasLocationFields(profile)) {
          console.log("Location fields exist, setting state based on profile");
          setIsSharingLocation(profile.is_sharing_location ?? false);
          setSharingScope(profile.location_sharing_scope ?? "all");
          setErrorMessage(null);
        } else {
          console.warn("Location sharing fields may not exist in profiles table");
          setErrorMessage("Location sharing fields not available");
          setIsSharingLocation(false);
          setSharingScope("all");
        }
      } catch (error) {
        console.error("Error fetching user status:", error);
        toast.error("Could not load location sharing status");
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserStatus();
  }, [user]);

  return {
    isSharingLocation,
    sharingScope,
    isLoading,
    errorMessage,
    setIsSharingLocation
  };
};

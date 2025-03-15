
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { hasLocationFields, ExtendedProfile } from "@/utils/profileTypes";

export const useLocationSharing = () => {
  const [userId, setUserId] = useState<string | null>(null);
  const [isSharingLocation, setIsSharingLocation] = useState(false);
  const [sharingScope, setSharingScope] = useState<string>("all");
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    console.log("useLocationSharing: Initializing hook");
    checkUserSession();

    // Subscribe to auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log("Location sharing auth state changed:", event);
      if (event === 'SIGNED_IN' && session) {
        console.log("User signed in, fetching location status");
        setUserId(session.user.id);
        fetchUserStatus(session.user.id);
      } else if (event === 'SIGNED_OUT') {
        console.log("User signed out, resetting location sharing state");
        setUserId(null);
        setIsSharingLocation(false);
        setSharingScope("all");
        setIsLoading(false);
      }
    });

    return () => {
      console.log("useLocationSharing: Cleaning up subscription");
      subscription.unsubscribe();
    };
  }, []);

  const checkUserSession = async () => {
    try {
      console.log("useLocationSharing: Checking user session");
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error("Error checking session:", error);
        setErrorMessage("Session check failed");
        setIsLoading(false);
        return;
      }
      
      if (!session) {
        console.log("No active session found");
        setUserId(null);
        setIsLoading(false);
        return;
      }
      
      console.log("Active session found, user ID:", session.user.id);
      setUserId(session.user.id);
      fetchUserStatus(session.user.id);
    } catch (error) {
      console.error("Error in checkUserSession:", error);
      setErrorMessage("Session check error");
      setIsLoading(false);
    }
  };

  const fetchUserStatus = async (uid: string) => {
    if (!uid) {
      console.log("No user ID provided to fetchUserStatus");
      setIsLoading(false);
      return;
    }

    try {
      console.log("Fetching user profile for location status...");
      setIsLoading(true);
      setErrorMessage(null);
      
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
        .eq("id", uid)
        .single();

      if (error) {
        console.error("Error fetching profile:", error);
        setErrorMessage("Could not fetch profile");
        setIsLoading(false);
        return;
      }

      console.log("Profile data received:", data);

      // Cast to our extended profile type
      const profile = data as ExtendedProfile;

      // Check if location fields exist using our utility
      if (hasLocationFields(profile)) {
        console.log("Location fields exist, setting state based on profile:", {
          is_sharing_location: profile.is_sharing_location,
          location_sharing_scope: profile.location_sharing_scope
        });
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

  return {
    userId,
    isSharingLocation,
    sharingScope,
    isLoading,
    errorMessage,
    setIsSharingLocation,
    fetchUserStatus: userId ? () => fetchUserStatus(userId) : null
  };
};

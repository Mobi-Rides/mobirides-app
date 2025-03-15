
import { useState, useEffect } from "react";
import { Switch } from "@/components/ui/switch";
import { useUser } from "@supabase/auth-helpers-react";
import { supabase } from "@/integrations/supabase/client";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { ExtendedProfile, hasLocationFields, createLocationUpdatePayload } from "@/utils/profileTypes";

export const OnlineStatusToggle = () => {
  const user = useUser();
  const [isSharingLocation, setIsSharingLocation] = useState(false);
  const [sharingScope, setSharingScope] = useState<string>("all");
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      // Removed the "Please log in to use location sharing" message
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

  const handleToggle = async (checked: boolean) => {
    if (!user) return;

    setIsLoading(true);
    try {
      console.log("Attempting to toggle location sharing to:", checked);
      
      // First check if fields exist in the table
      const { data: columnExists, error: columnError } = await supabase
        .from("profiles")
        .select("is_sharing_location")
        .limit(1);

      if (columnError) {
        console.error("Error checking columns:", columnError);
        toast.error("Could not verify table structure");
        throw columnError;
      }

      console.log("Column check result:", columnExists);
      
      if (!hasLocationFields(columnExists?.[0])) {
        console.error("Location fields not found in database");
        toast.error("Location sharing is not supported in this database");
        setErrorMessage("Location sharing is not supported in this database");
        return;
      }

      // Update sharing status
      const { error } = await supabase
        .from("profiles")
        .update({
          is_sharing_location: checked,
          updated_at: new Date().toISOString()
        })
        .eq("id", user.id);

      if (error) {
        console.error("Error updating location sharing:", error);
        throw error;
      }

      setIsSharingLocation(checked);
      toast.success(checked ? "Location sharing enabled" : "Location sharing disabled");
      setErrorMessage(null);

      // If enabling, also update user's coordinates
      if (checked) {
        // Check if browser supports geolocation
        if (!navigator.geolocation) {
          console.error("Geolocation not supported");
          toast.error("Your browser doesn't support geolocation");
          return;
        }

        // Check permission state if possible
        try {
          const permission = await navigator.permissions.query({ name: 'geolocation' });
          console.log("Geolocation permission status:", permission.state);
          if (permission.state === 'denied') {
            toast.error("Location permission denied. Please check your browser settings.");
            return;
          }
        } catch (permError) {
          console.log("Could not check permission status:", permError);
          // Continue anyway, as the next step will trigger permission prompt
        }

        navigator.geolocation.getCurrentPosition(
          async (position) => {
            const { latitude, longitude } = position.coords;
            try {
              console.log("Got coordinates:", latitude, longitude);
              const payload = createLocationUpdatePayload(true, { latitude, longitude });
              
              const { error } = await supabase
                .from("profiles")
                .update(payload)
                .eq("id", user.id);

              if (error) {
                console.error("Error updating location:", error);
                throw error;
              }
              
              console.log("Location coordinates updated successfully");
            } catch (error) {
              console.error("Error updating location:", error);
              toast.error("Could not update your location");
            }
          },
          (error) => {
            console.error("Geolocation error:", error);
            let errorMsg = "Could not get your location. ";
            
            switch (error.code) {
              case error.PERMISSION_DENIED:
                errorMsg += "Permission denied. Please check your browser permissions.";
                break;
              case error.POSITION_UNAVAILABLE:
                errorMsg += "Location information unavailable.";
                break;
              case error.TIMEOUT:
                errorMsg += "Request timed out.";
                break;
              default:
                errorMsg += "Unknown error occurred.";
            }
            
            toast.error(errorMsg);
            setErrorMessage(errorMsg);
          },
          { 
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 0
          }
        );
      }
    } catch (error) {
      console.error("Error toggling location sharing:", error);
      toast.error("Could not update location sharing status");
    } finally {
      setIsLoading(false);
    }
  };

  const handleScopeChange = async (value: string) => {
    if (!user) return;

    setIsLoading(true);
    try {
      // Check if the location_sharing_scope column exists
      const { data: columnExists } = await supabase
        .from("profiles")
        .select("*")
        .limit(1);

      if (!hasLocationFields(columnExists?.[0])) {
        toast.error("Location sharing scope is not supported in this database");
        return;
      }

      // Update the profile with the new scope value
      const { error } = await supabase
        .from("profiles")
        .update({
          location_sharing_scope: value,
          updated_at: new Date().toISOString()
        })
        .eq("id", user.id);

      if (error) throw error;

      setSharingScope(value);
      toast.success(`Location sharing scope set to ${value}`);
    } catch (error) {
      console.error("Error updating sharing scope:", error);
      toast.error("Could not update sharing scope");
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center space-x-2 opacity-50">
        <Switch disabled />
        <Label className="text-sm whitespace-nowrap">Share Location</Label>
      </div>
    );
  }

  return (
    <div className="flex flex-row items-center justify-between w-full gap-2">
      <div className="flex items-center space-x-2">
        <Switch
          checked={isSharingLocation}
          onCheckedChange={handleToggle}
          disabled={isLoading || !!errorMessage}
          className="data-[state=checked]:bg-primary"
        />
        <Label className="text-sm whitespace-nowrap font-medium">
          Share Location
          {errorMessage && (
            <span className="ml-2 text-xs text-red-500">{errorMessage}</span>
          )}
        </Label>
      </div>

      {isSharingLocation && (
        <div className="flex items-center gap-1.5">
          <Label className="text-xs text-muted-foreground whitespace-nowrap">To:</Label>
          <Select 
            value={sharingScope} 
            onValueChange={handleScopeChange} 
            disabled={isLoading}
          >
            <SelectTrigger className="h-7 w-[100px] text-xs">
              <SelectValue placeholder="Who can see you" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Everyone</SelectItem>
              <SelectItem value="hosts">Hosts Only</SelectItem>
              <SelectItem value="renters">Renters Only</SelectItem>
              <SelectItem value="none">No One</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}
    </div>
  );
};

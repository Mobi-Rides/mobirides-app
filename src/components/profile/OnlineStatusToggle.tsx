
import { useState, useEffect } from "react";
import { Switch } from "@/components/ui/switch";
import { useUser } from "@supabase/auth-helpers-react";
import { supabase } from "@/integrations/supabase/client";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";

export const OnlineStatusToggle = () => {
  const user = useUser();
  const [isSharingLocation, setIsSharingLocation] = useState(false);
  const [sharingScope, setSharingScope] = useState<string>("all");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const fetchUserStatus = async () => {
      setIsLoading(true);
      try {
        // Get the profile for the current user
        const { data, error } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .single();

        if (error) throw error;

        // Check if the is_sharing_location column exists
        const { data: columnExists } = await supabase
          .from("profiles")
          .select("*")
          .limit(1);

        // Verify if the column exists in the returned data
        const hasLocationFields = columnExists && 
          columnExists.length > 0 && 
          'is_sharing_location' in columnExists[0] &&
          'location_sharing_scope' in columnExists[0];

        if (hasLocationFields && data) {
          // Use optional chaining and nullish coalescing to avoid errors
          setIsSharingLocation(data.is_sharing_location ?? false);
          setSharingScope(data.location_sharing_scope ?? "all");
        } else {
          console.warn("Location sharing fields may not exist in profiles table");
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
      // Check if the is_sharing_location column exists
      const { data: columnExists } = await supabase
        .from("profiles")
        .select("*")
        .limit(1);

      // Verify if the column exists in the returned data
      const hasLocationField = columnExists && 
        columnExists.length > 0 && 
        'is_sharing_location' in columnExists[0];

      if (!hasLocationField) {
        toast.error("Location sharing is not supported in this database");
        return;
      }

      // Update the profile with the new is_sharing_location value
      const { error } = await supabase
        .from("profiles")
        .update({
          is_sharing_location: checked,
          updated_at: new Date()
        })
        .eq("id", user.id);

      if (error) throw error;

      setIsSharingLocation(checked);
      toast.success(checked ? "Location sharing enabled" : "Location sharing disabled");

      // If enabling, also update user's coordinates
      if (checked) {
        navigator.geolocation.getCurrentPosition(
          async (position) => {
            const { latitude, longitude } = position.coords;
            try {
              const { error } = await supabase
                .from("profiles")
                .update({
                  latitude,
                  longitude,
                  updated_at: new Date()
                })
                .eq("id", user.id);

              if (error) throw error;
            } catch (error) {
              console.error("Error updating location:", error);
              toast.error("Could not update your location");
            }
          },
          (error) => {
            console.error("Geolocation error:", error);
            toast.error("Could not get your location. Please check your browser permissions.");
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

      // Verify if the column exists in the returned data
      const hasScopeField = columnExists && 
        columnExists.length > 0 && 
        'location_sharing_scope' in columnExists[0];

      if (!hasScopeField) {
        toast.error("Location sharing scope is not supported in this database");
        return;
      }

      // Update the profile with the new scope value
      const { error } = await supabase
        .from("profiles")
        .update({
          location_sharing_scope: value,
          updated_at: new Date()
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
    <div className="flex flex-col sm:flex-row sm:items-center justify-between w-full gap-2">
      <div className="flex items-center space-x-2">
        <Switch
          checked={isSharingLocation}
          onCheckedChange={handleToggle}
          disabled={isLoading}
        />
        <Label className="text-sm whitespace-nowrap">Share My Location</Label>
      </div>

      {isSharingLocation && (
        <div className="flex items-center gap-2">
          <Label className="text-xs text-muted-foreground whitespace-nowrap">Visible to:</Label>
          <Select 
            value={sharingScope} 
            onValueChange={handleScopeChange} 
            disabled={isLoading}
          >
            <SelectTrigger className="h-8 w-[130px] text-xs">
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

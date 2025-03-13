
import { useState, useEffect } from "react";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";

type LocationSharingScope = "all" | "renters" | "none";

export function OnlineStatusToggle() {
  const [isSharingLocation, setIsSharingLocation] = useState(false);
  const [locationScope, setLocationScope] = useState<LocationSharingScope>("all");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchUserStatus = async () => {
      try {
        setIsLoading(true);
        const { data: session } = await supabase.auth.getSession();
        if (!session.session) return;

        const { data: profileData, error: profileError } = await supabase
          .from("profiles")
          .select("is_sharing_location, location_sharing_scope")
          .eq("id", session.session.user.id)
          .single();

        if (profileError) {
          console.error("Error fetching location sharing status:", profileError);
          return;
        }

        if (profileData) {
          setIsSharingLocation(profileData.is_sharing_location || false);
          setLocationScope(profileData.location_sharing_scope as LocationSharingScope || "all");
        }
      } catch (error) {
        console.error("Error:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserStatus();
  }, []);

  const updateLocationSharing = async (isSharing: boolean) => {
    try {
      setIsLoading(true);
      const { data: session } = await supabase.auth.getSession();
      if (!session.session) {
        toast.error("You must be logged in to change location sharing settings");
        return;
      }

      const { error } = await supabase
        .from("profiles")
        .update({
          is_sharing_location: isSharing,
          location_sharing_scope: locationScope,
        })
        .eq("id", session.session.user.id);

      if (error) {
        console.error("Error updating location sharing:", error);
        toast.error("Failed to update location sharing settings");
        return;
      }

      setIsSharingLocation(isSharing);
      toast.success(
        isSharing
          ? "Your location is now being shared"
          : "Your location is no longer being shared"
      );
    } catch (error) {
      console.error("Error:", error);
      toast.error("An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const updateSharingScope = async (scope: LocationSharingScope) => {
    try {
      setIsLoading(true);
      const { data: session } = await supabase.auth.getSession();
      if (!session.session) {
        toast.error("You must be logged in to change location sharing settings");
        return;
      }

      const { error } = await supabase
        .from("profiles")
        .update({
          location_sharing_scope: scope,
        })
        .eq("id", session.session.user.id);

      if (error) {
        console.error("Error updating location scope:", error);
        toast.error("Failed to update location sharing scope");
        return;
      }

      setLocationScope(scope);
      toast.success("Location sharing scope updated");
    } catch (error) {
      console.error("Error:", error);
      toast.error("An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="absolute top-4 right-4 z-10">
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant={isSharingLocation ? "default" : "outline"}
            size="sm"
            className="h-9 px-3 bg-white dark:bg-gray-800 shadow-md rounded-md"
          >
            {isSharingLocation ? "Online" : "Offline"}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-64 p-4 bg-white dark:bg-gray-800 shadow-md rounded-md" align="end">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="location-sharing" className="font-medium text-sm">
                Share your location
              </Label>
              <Switch
                id="location-sharing"
                checked={isSharingLocation}
                onCheckedChange={updateLocationSharing}
                disabled={isLoading}
              />
            </div>
            {isSharingLocation && (
              <div className="space-y-2">
                <Label className="font-medium text-sm">Visible to</Label>
                <RadioGroup
                  value={locationScope}
                  onValueChange={(value) => updateSharingScope(value as LocationSharingScope)}
                  className="space-y-1"
                  disabled={isLoading}
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="all" id="all" />
                    <Label htmlFor="all" className="text-sm font-normal">
                      Everyone
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="renters" id="renters" />
                    <Label htmlFor="renters" className="text-sm font-normal">
                      Renters only
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="none" id="none" />
                    <Label htmlFor="none" className="text-sm font-normal">
                      No one
                    </Label>
                  </div>
                </RadioGroup>
              </div>
            )}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}

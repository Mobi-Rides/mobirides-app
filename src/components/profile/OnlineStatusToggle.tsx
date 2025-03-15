
import { useUser } from "@supabase/auth-helpers-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { hasLocationFields } from "@/utils/profileTypes";
import { useLocationSharing } from "@/hooks/useLocationSharing";
import { updateUserLocation } from "@/components/profile/location/GeolocationHandler";
import { SharingScope } from "@/components/profile/location/SharingScope";
import { PermissionStatus } from "@/components/profile/location/PermissionStatus";

export const OnlineStatusToggle = () => {
  const user = useUser();
  const { 
    isSharingLocation, 
    sharingScope, 
    isLoading, 
    errorMessage, 
    setIsSharingLocation 
  } = useLocationSharing();

  const handleToggle = async (checked: boolean) => {
    if (!user) {
      toast.error("You need to be logged in to share your location");
      return;
    }

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

      // If enabling, also update user's coordinates
      if (checked) {
        await updateUserLocation(user.id);
      }
    } catch (error) {
      console.error("Error toggling location sharing:", error);
      toast.error("Could not update location sharing status");
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

  // If no user is found, show disabled toggle with login message
  if (!user) {
    return (
      <div className="flex flex-row items-center justify-between w-full gap-2">
        <div className="flex items-center space-x-2">
          <Switch
            checked={false}
            disabled={true}
            className="data-[state=checked]:bg-primary/50"
          />
          <Label className="text-sm whitespace-nowrap font-medium">
            Share Location
            <span className="ml-2 text-xs text-amber-500">Login required</span>
          </Label>
        </div>
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
          <PermissionStatus errorMessage={errorMessage} />
        </Label>
      </div>

      {isSharingLocation && (
        <SharingScope 
          initialScope={sharingScope}
          isLoading={isLoading}
        />
      )}
    </div>
  );
};

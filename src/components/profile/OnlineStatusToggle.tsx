
import { useState, useEffect } from "react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { locationStateManager, LocationSharingScope } from "@/utils/mapbox/location/LocationStateManager";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export const OnlineStatusToggle = () => {
  const [isOnline, setIsOnline] = useState(false);
  const [sharingScope, setSharingScope] = useState<LocationSharingScope>('none');

  useEffect(() => {
    const loadOnlineStatus = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data: cars } = await supabase
        .from("cars")
        .select("latitude, longitude")
        .eq("owner_id", user.id)
        .not("latitude", "is", null);

      if (cars && cars.length > 0) {
        setIsOnline(true);
        locationStateManager.enableTracking();
      }
      
      // Check if we have any location sharing setting
      const { data: locationSettings } = await supabase
        .from("cars")
        .select("is_sharing_location, location_sharing_scope")
        .eq("owner_id", user.id)
        .single();
        
      if (locationSettings?.is_sharing_location) {
        const scope = locationSettings.location_sharing_scope || 'all';
        setSharingScope(scope as LocationSharingScope);
        locationStateManager.setSharingScope(scope as LocationSharingScope);
      }
    };

    loadOnlineStatus();
  }, []);

  const handleToggle = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const newStatus = !isOnline;

      if (newStatus) {
        const success = await locationStateManager.enableTracking();
        if (success) {
          setIsOnline(true);
        }
      } else {
        locationStateManager.disableTracking();
        locationStateManager.setSharingScope('none');
        setSharingScope('none');

        // Clear location data from cars
        const { data: cars } = await supabase
          .from("cars")
          .select("id")
          .eq("owner_id", user.id);

        if (cars) {
          for (const car of cars) {
            await supabase
              .from("cars")
              .update({
                latitude: null,
                longitude: null,
                is_sharing_location: false,
                location_sharing_scope: 'none',
                updated_at: new Date().toISOString(),
              })
              .eq("id", car.id);
          }
        }
        setIsOnline(false);
      }
    } catch (error) {
      console.error("Error updating online status:", error);
    }
  };

  const handleSharingChange = async (value: string) => {
    try {
      const newScope = value as LocationSharingScope;
      setSharingScope(newScope);
      
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;
      
      // Update cars table with sharing settings
      const { data: cars } = await supabase
        .from("cars")
        .select("id")
        .eq("owner_id", user.id);
        
      if (cars) {
        for (const car of cars) {
          await supabase
            .from("cars")
            .update({
              is_sharing_location: newScope !== 'none',
              location_sharing_scope: newScope,
              updated_at: new Date().toISOString(),
            })
            .eq("id", car.id);
            
          // Set the sharing scope in location state manager
          locationStateManager.setSharingScope(newScope, car.id);
        }
      }
    } catch (error) {
      console.error("Error updating sharing scope:", error);
    }
  };

  return (
    <div className="space-y-4 py-4">
      <div className="flex items-center space-x-4">
        <Switch
          id="online-mode"
          checked={isOnline}
          onCheckedChange={handleToggle}
        />
        <Label htmlFor="online-mode">
          {isOnline
            ? "Online - Location tracking enabled"
            : "Offline - Location tracking disabled"}
        </Label>
      </div>
      
      {isOnline && (
        <div className="border rounded-md p-4 bg-muted/20">
          <div className="mb-2">
            <Label htmlFor="sharing-scope">Location sharing settings</Label>
          </div>
          <Select
            value={sharingScope}
            onValueChange={handleSharingChange}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select sharing settings" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Don't share my location</SelectItem>
              <SelectItem value="trip_only">Share only during trips</SelectItem>
              <SelectItem value="all">Share my location always</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-sm text-muted-foreground mt-2">
            {sharingScope === 'none' 
              ? 'Your location will not be shared with anyone.' 
              : sharingScope === 'trip_only' 
                ? 'Your location will only be shared with renters during active trips.' 
                : 'Your location will be publicly visible to all app users.'}
          </p>
        </div>
      )}
    </div>
  );
};

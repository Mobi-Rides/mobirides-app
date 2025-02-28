import { useState, useEffect } from "react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { locationStateManager } from "@/utils/mapbox/location/LocationStateManager";

export const OnlineStatusToggle = () => {
  const [isOnline, setIsOnline] = useState(true);

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

  return (
    <div className="flex items-center space-x-4 py-4">
      <Switch
        id="online-mode"
        checked={isOnline}
        onCheckedChange={handleToggle}
      />
      <Label htmlFor="online-mode">
        {isOnline
          ? "Online - Location sharing enabled"
          : "Offline - Location sharing disabled"}
      </Label>
    </div>
  );
};


import { useState, useEffect } from "react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { updateCarLocation } from "@/services/carLocation";

export const OnlineStatusToggle = () => {
  const [isOnline, setIsOnline] = useState(false);
  const [watchId, setWatchId] = useState<number | null>(null);

  useEffect(() => {
    const loadOnlineStatus = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: cars } = await supabase
        .from('cars')
        .select('latitude, longitude')
        .eq('owner_id', user.id)
        .not('latitude', 'is', null);

      // Consider user online if they have any cars with location data
      if (cars && cars.length > 0) {
        setIsOnline(true);
        startLocationTracking();
      }
    };

    loadOnlineStatus();
    return () => {
      if (watchId) {
        navigator.geolocation.clearWatch(watchId);
      }
    };
  }, []);

  const startLocationTracking = () => {
    if (!navigator.geolocation) {
      toast.error("Geolocation is not supported by your browser");
      return;
    }

    const id = navigator.geolocation.watchPosition(
      async (position) => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data: cars } = await supabase
          .from('cars')
          .select('id')
          .eq('owner_id', user.id);

        if (cars) {
          for (const car of cars) {
            await updateCarLocation(
              car.id,
              position.coords.latitude,
              position.coords.longitude
            );
          }
        }
      },
      (error) => {
        console.error("Error getting location:", error);
        toast.error("Failed to get your location");
      },
      {
        enableHighAccuracy: true,
        timeout: 5000,
        maximumAge: 0
      }
    );

    setWatchId(id);
  };

  const stopLocationTracking = () => {
    if (watchId) {
      navigator.geolocation.clearWatch(watchId);
      setWatchId(null);
    }
  };

  const handleToggle = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("You must be logged in to change your online status");
        return;
      }

      const newStatus = !isOnline;

      if (newStatus) {
        startLocationTracking();
        toast.success("You are now online and visible to renters");
      } else {
        stopLocationTracking();
        // Clear location data from cars
        const { data: cars } = await supabase
          .from('cars')
          .select('id')
          .eq('owner_id', user.id);

        if (cars) {
          for (const car of cars) {
            await supabase
              .from('cars')
              .update({ 
                latitude: null, 
                longitude: null,
                updated_at: new Date().toISOString()
              })
              .eq('id', car.id);
          }
        }
        toast.success("You are now offline");
      }

      setIsOnline(newStatus);
    } catch (error) {
      console.error("Error updating online status:", error);
      toast.error("Failed to update online status");
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
        {isOnline ? "Online - Location sharing enabled" : "Offline - Location sharing disabled"}
      </Label>
    </div>
  );
};

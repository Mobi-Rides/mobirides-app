
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

      const { data } = await supabase
        .from('profiles')
        .select('is_online')
        .eq('id', user.id)
        .single();

      if (data) {
        setIsOnline(!!data.is_online);
        if (data.is_online) {
          startLocationTracking();
        }
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

      const { error } = await supabase
        .from('profiles')
        .update({ is_online: newStatus })
        .eq('id', user.id);

      if (error) throw error;

      setIsOnline(newStatus);
      
      if (newStatus) {
        startLocationTracking();
        toast.success("You are now online and visible to renters");
      } else {
        stopLocationTracking();
        toast.success("You are now offline");
      }
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

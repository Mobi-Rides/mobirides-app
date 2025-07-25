
import { useState, useEffect } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import mapboxgl from 'mapbox-gl';

export const useHostLocation = (map: mapboxgl.Map | null, mode: string | null, hostId: string | null, bookingId: string | null) => {
  const [hostLocation, setHostLocation] = useState<{ lat: number; lng: number } | null>(null);

  useEffect(() => {
    console.log("Checking conditions for host subscription:", {
      hasMap: !!map,
      mode,
      hostId,
      bookingId
    });

    if (!map || !mode || mode !== 'handover' || !hostId || !bookingId) {
      console.log("Skipping host subscription due to missing requirements");
      return;
    }

    console.log("Setting up location subscription for host:", hostId);

    let channel = supabase.channel('car-location')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'cars',
          filter: `owner_id=eq.${hostId}`
        },
        (payload) => {
          console.log("Received host location update:", payload);
          if (payload.new && 'latitude' in payload.new && 'longitude' in payload.new) {
            const newLocation = {
              lat: payload.new.latitude as number,
              lng: payload.new.longitude as number
            };
            console.log("Setting new host location:", newLocation);
            setHostLocation(newLocation);

            // Center map on host location
            if (map) {
              console.log("Centering map on host location");
              map.flyTo({
                center: [payload.new.longitude as number, payload.new.latitude as number],
                zoom: 14
              });
            }
          } else {
            console.log("Invalid payload structure:", payload);
          }
        }
      )
      .subscribe((status) => {
        console.log("Subscription status:", status);
      });

    return () => {
      console.log("Cleaning up host location subscription");
      if (channel) {
        channel.unsubscribe();
      }
    };
  }, [map, mode, hostId, bookingId]);

  return hostLocation;
};

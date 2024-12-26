import { useEffect, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import { useToast } from '@/components/ui/use-toast';

export const useUserLocation = (mapInstance: mapboxgl.Map | null) => {
  const { toast } = useToast();
  const [watchId, setWatchId] = useState<number | null>(null);

  useEffect(() => {
    if (!mapInstance) {
      console.log("Map instance not available for location tracking");
      return;
    }

    if (!("geolocation" in navigator)) {
      console.log("Geolocation not supported");
      toast({
        title: "Location Error",
        description: "Geolocation is not supported by your browser",
        variant: "destructive",
      });
      return;
    }

    let userMarker: mapboxgl.Marker | null = null;

    const handleSuccess = (position: GeolocationPosition) => {
      const { latitude, longitude, accuracy } = position.coords;
      console.log("User location updated:", { 
        latitude, 
        longitude, 
        accuracyInMeters: accuracy 
      });
      
      try {
        // Remove existing user marker if it exists
        if (userMarker) {
          userMarker.remove();
        }

        // Create a new marker for user's location
        userMarker = new mapboxgl.Marker({
          color: "#FF0000",
          scale: 0.8
        })
          .setLngLat([longitude, latitude])
          .setPopup(new mapboxgl.Popup().setHTML(`
            <div class="p-2">
              <p class="font-semibold">Your Location</p>
              <p class="text-sm">Accuracy: ${Math.round(accuracy)}m</p>
            </div>
          `))
          .addTo(mapInstance);

        // Only fly to location on first fix
        if (!watchId) {
          mapInstance.flyTo({
            center: [longitude, latitude],
            zoom: 15,
            essential: true
          });

          toast({
            title: "Location Found",
            description: `Accuracy: ${Math.round(accuracy)} meters`,
          });
        }
      } catch (error) {
        console.error("Error updating user location:", error);
        toast({
          title: "Location Error",
          description: "Could not update your location on the map",
          variant: "destructive",
        });
      }
    };

    const handleError = (error: GeolocationPositionError) => {
      console.error("Geolocation error:", error.message);
      toast({
        title: "Location Error",
        description: error.message,
        variant: "destructive",
      });
    };

    const options: PositionOptions = {
      enableHighAccuracy: true, // Request highest possible accuracy
      timeout: 10000, // Wait up to 10 seconds for a position
      maximumAge: 5000 // Accept positions up to 5 seconds old
    };

    // Start watching position
    const id = navigator.geolocation.watchPosition(
      handleSuccess,
      handleError,
      options
    );
    
    setWatchId(id);
    console.log("Started watching user location with ID:", id);

    // Cleanup function
    return () => {
      if (watchId) {
        navigator.geolocation.clearWatch(watchId);
        console.log("Stopped watching user location");
      }
      if (userMarker) {
        userMarker.remove();
      }
    };
  }, [mapInstance, toast]);

  return watchId;
};
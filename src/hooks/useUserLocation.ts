import { useEffect } from 'react';
import mapboxgl from 'mapbox-gl';
import { useToast } from '@/components/ui/use-toast';

export const useUserLocation = (mapInstance: mapboxgl.Map | null) => {
  const { toast } = useToast();

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

    const handleSuccess = (position: GeolocationPosition) => {
      const { latitude, longitude } = position.coords;
      console.log("User location:", { latitude, longitude });
      
      try {
        mapInstance.flyTo({
          center: [longitude, latitude],
          zoom: 14,
          essential: true
        });

        // Add a marker for user's location
        new mapboxgl.Marker({ color: "#FF0000" })
          .setLngLat([longitude, latitude])
          .addTo(mapInstance);

        toast({
          title: "Location Found",
          description: "Map centered to your current location",
        });
      } catch (error) {
        console.error("Error flying to user location:", error);
        toast({
          title: "Location Error",
          description: "Could not center map to your location",
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

    const options = {
      enableHighAccuracy: true,
      timeout: 5000,
      maximumAge: 0
    };

    navigator.geolocation.getCurrentPosition(handleSuccess, handleError, options);
  }, [mapInstance, toast]);
};
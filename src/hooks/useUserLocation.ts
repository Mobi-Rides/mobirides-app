import { useEffect } from "react";
import mapboxgl from "mapbox-gl";
import { toast } from "sonner";

export const useUserLocation = (map: mapboxgl.Map | null) => {
  useEffect(() => {
    if (!map) return;

    const handleSuccess = (position: GeolocationPosition) => {
      const { latitude, longitude, accuracy } = position.coords;
      console.log("User location:", { latitude, longitude, accuracy });

      // Create a marker for user location
      const el = document.createElement("div");
      el.className = "w-4 h-4 bg-primary rounded-full border-2 border-white";
      
      new mapboxgl.Marker({ element: el })
        .setLngLat([longitude, latitude])
        .addTo(map);

      map.flyTo({
        center: [longitude, latitude],
        zoom: 15,
        essential: true
      });
    };

    const handleError = (error: GeolocationPositionError) => {
      console.error("Error getting location:", error);
      toast.error("Could not get your location. Please check your settings.");
    };

    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(handleSuccess, handleError, {
        enableHighAccuracy: true,
        timeout: 5000,
        maximumAge: 0
      });
    } else {
      toast.error("Geolocation is not supported by your browser");
    }
  }, [map]);
};
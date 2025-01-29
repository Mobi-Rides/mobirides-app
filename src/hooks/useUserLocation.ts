import { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import { toast } from "sonner";
import { createMarkerElement } from "@/utils/domUtils";

interface UserLocation {
  latitude: number;
  longitude: number;
  accuracy: number;
}

export const useUserLocation = (map: mapboxgl.Map | null) => {
  const [userLocation, setUserLocation] = useState<UserLocation | null>(null);
  const [error, setError] = useState<string | null>(null);
  const markerRef = useRef<mapboxgl.Marker | null>(null);
  const watchIdRef = useRef<number | null>(null);

  useEffect(() => {
    console.log("useUserLocation effect running, map:", !!map);
    
    // Don't proceed if map isn't ready
    if (!map) {
      console.log("Map not ready, skipping location initialization");
      return;
    }

    // Wait for map to be loaded
    if (!map.loaded()) {
      console.log("Map not loaded yet, waiting for load event");
      const onLoad = () => {
        console.log("Map loaded, initializing location tracking");
        initializeLocationTracking();
      };
      map.once('load', onLoad);
      return () => {
        map.off('load', onLoad);
      };
    } else {
      initializeLocationTracking();
    }

    function initializeLocationTracking() {
      if (!navigator.geolocation) {
        console.log("Geolocation not supported");
        setError("Geolocation is not supported by your browser");
        toast.error("Geolocation is not supported by your browser");
        return;
      }

      const handleSuccess = (position: GeolocationPosition) => {
        const { latitude, longitude, accuracy } = position.coords;
        console.log("User location updated:", { latitude, longitude, accuracy });

        setUserLocation({ latitude, longitude, accuracy });

        // Remove existing marker if it exists
        if (markerRef.current) {
          markerRef.current.remove();
        }

        try {
          // Create a marker for user location
          const el = createMarkerElement(accuracy);
          
          markerRef.current = new mapboxgl.Marker({ element: el })
            .setLngLat([longitude, latitude]);

          // Only add to map if map is valid
          if (map && map.loaded()) {
            markerRef.current.addTo(map);
          }

          // Center map on user location
          map?.flyTo({
            center: [longitude, latitude],
            zoom: 14,
          });
        } catch (err) {
          console.error("Error creating location marker:", err);
        }
      };

      const handleError = (error: GeolocationPositionError) => {
        console.error("Geolocation error:", error);
        const errorMessage = "Failed to get your location. Please check your permissions.";
        setError(errorMessage);
        toast.error(errorMessage);
      };

      // Start watching position
      watchIdRef.current = navigator.geolocation.watchPosition(
        handleSuccess,
        handleError,
        {
          enableHighAccuracy: true,
          timeout: 5000,
          maximumAge: 0,
        }
      );
    }

    // Cleanup function
    return () => {
      console.log("Cleaning up user location tracking");
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
      if (markerRef.current) {
        markerRef.current.remove();
        markerRef.current = null;
      }
    };
  }, [map]); // Only re-run if map changes

  return { userLocation, error };
};
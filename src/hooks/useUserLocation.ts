
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
    console.log("[useUserLocation] Starting location tracking", { hasMap: !!map });
    
    function initializeLocationTracking() {
      if (!navigator.geolocation) {
        const errorMsg = "Geolocation is not supported by your browser";
        console.log(errorMsg);
        setError(errorMsg);
        toast.error(errorMsg);
        return;
      }

      // First request permission explicitly
      navigator.permissions.query({ name: 'geolocation' }).then(permissionStatus => {
        if (permissionStatus.state === 'denied') {
          const errorMsg = "Location access was denied. Please enable location services to use this feature.";
          console.log(errorMsg);
          setError(errorMsg);
          toast.error(errorMsg);
          return;
        }

        const handleSuccess = (position: GeolocationPosition) => {
          const { latitude, longitude, accuracy } = position.coords;
          console.log("[useUserLocation] Position updated:", { latitude, longitude, accuracy });

          setUserLocation({ latitude, longitude, accuracy });
          setError(null);

          // Only update marker if map is available
          if (map && map.loaded()) {
            // Remove existing marker if it exists
            if (markerRef.current) {
              markerRef.current.remove();
            }

            try {
              const el = createMarkerElement(accuracy);
              markerRef.current = new mapboxgl.Marker({ element: el })
                .setLngLat([longitude, latitude])
                .addTo(map);
            } catch (err) {
              console.error("[useUserLocation] Error creating location marker:", err);
            }
          }
        };

        const handleError = (error: GeolocationPositionError) => {
          let errorMessage = "Failed to get your location. ";
          
          switch (error.code) {
            case error.PERMISSION_DENIED:
              errorMessage += "Location permission was denied.";
              break;
            case error.POSITION_UNAVAILABLE:
              errorMessage += "Location information is unavailable.";
              break;
            case error.TIMEOUT:
              errorMessage += "Location request timed out.";
              break;
            default:
              errorMessage += "An unknown error occurred.";
          }
          
          console.error("[useUserLocation] Geolocation error:", { 
            code: error.code, 
            message: error.message 
          });
          setError(errorMessage);
          toast.error(errorMessage);
        };

        watchIdRef.current = navigator.geolocation.watchPosition(
          handleSuccess,
          handleError,
          {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 5000
          }
        );
      });
    }

    // Only start tracking if we have a map instance
    if (map) {
      initializeLocationTracking();
    }

    return () => {
      console.log("[useUserLocation] Cleaning up location tracking");
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

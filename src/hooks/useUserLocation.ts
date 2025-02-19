
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
          console.log("User location updated:", { latitude, longitude, accuracy });

          setUserLocation({ latitude, longitude, accuracy });
          setError(null); // Clear any previous errors

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
              
              // Fly to the location with smooth animation
              map.flyTo({
                center: [longitude, latitude],
                zoom: 14,
                essential: true
              });
            }
          } catch (err) {
            console.error("Error creating location marker:", err);
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
          
          console.error("Geolocation error:", { code: error.code, message: error.message });
          setError(errorMessage);
          toast.error(errorMessage);
        };

        // Start watching position with improved options
        watchIdRef.current = navigator.geolocation.watchPosition(
          handleSuccess,
          handleError,
          {
            enableHighAccuracy: true,
            timeout: 10000, // Increased timeout
            maximumAge: 5000 // Allow slightly older positions
          }
        );
      });
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

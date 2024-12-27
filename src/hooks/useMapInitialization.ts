import { useEffect, useRef } from "react";
import mapboxgl from "mapbox-gl";
import { toast } from "sonner";

interface UseMapInitializationProps {
  initialLatitude: number;
  initialLongitude: number;
  mapboxToken: string | null;
}

export const useMapInitialization = ({ 
  initialLatitude, 
  initialLongitude, 
  mapboxToken 
}: UseMapInitializationProps) => {
  const map = useRef<mapboxgl.Map | null>(null);

  useEffect(() => {
    if (!mapboxToken) {
      console.log("Missing Mapbox token");
      return;
    }

    console.log("Initializing map with coordinates:", { 
      latitude: initialLatitude.toFixed(6), 
      longitude: initialLongitude.toFixed(6) 
    });
    
    mapboxgl.accessToken = mapboxToken;
    
    try {
      // Initialize map if it doesn't exist
      if (!map.current) {
        const mapContainer = document.getElementById('map');
        if (!mapContainer) {
          console.error("Map container not found");
          return;
        }

        map.current = new mapboxgl.Map({
          container: mapContainer,
          style: "mapbox://styles/mapbox/streets-v12",
          center: [initialLongitude, initialLatitude],
          zoom: 2, // Start with a zoomed out view
          trackResize: true
        });

        map.current.addControl(new mapboxgl.NavigationControl(), "top-right");
      }

      map.current.on('load', () => {
        console.log("Map loaded successfully at coordinates:", {
          center: map.current?.getCenter(),
          zoom: map.current?.getZoom()
        });
      });

      return () => {
        if (map.current) {
          map.current.remove();
          map.current = null;
        }
      };
    } catch (error) {
      console.error("Error initializing map:", error);
      toast.error("Error initializing map");
    }
  }, [initialLatitude, initialLongitude, mapboxToken]);

  return map;
};
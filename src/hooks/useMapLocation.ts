import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import { toast } from "sonner";

interface UseMapLocationProps {
  initialLatitude: number;
  initialLongitude: number;
  mapboxToken: string | null;
  isAdjusting: boolean;
}

export const useMapLocation = ({
  initialLatitude,
  initialLongitude,
  mapboxToken,
  isAdjusting
}: UseMapLocationProps) => {
  const mapContainer = useRef<HTMLDivElement | null>(null);
  const mapInstance = useRef<mapboxgl.Map | null>(null);
  const [newCoordinates, setNewCoordinates] = useState<{ lat: number; lng: number } | null>(null);
  const [isMapLoaded, setIsMapLoaded] = useState(false);

  useEffect(() => {
    if (!mapboxToken || !mapContainer.current) {
      console.log("Missing map initialization requirements:", {
        hasToken: !!mapboxToken,
        hasContainer: !!mapContainer.current
      });
      return;
    }

    console.log("Initializing map with:", {
      initialLatitude,
      initialLongitude,
      hasToken: !!mapboxToken
    });

    try {
      mapboxgl.accessToken = mapboxToken;

      const newMap = new mapboxgl.Map({
        container: mapContainer.current,
        style: "mapbox://styles/mapbox/streets-v12",
        center: [initialLongitude, initialLatitude],
        zoom: 15,
      });

      mapInstance.current = newMap;

      newMap.on('load', () => {
        console.log("Map loaded successfully");
        setIsMapLoaded(true);
      });

      newMap.on('error', (e) => {
        console.error("Map error:", e);
        toast.error("Error loading map. Please try again.");
      });

      // Add navigation controls
      newMap.addControl(new mapboxgl.NavigationControl(), "top-right");

      // Set up click handler for location adjustment
      if (isAdjusting) {
        newMap.on("click", (e) => {
          console.log("Map clicked:", e.lngLat);
          setNewCoordinates({ lat: e.lngLat.lat, lng: e.lngLat.lng });
        });
      }

    } catch (error) {
      console.error("Error initializing map:", error);
      toast.error("Failed to initialize map. Please check your connection and try again.");
    }

    return () => {
      if (mapInstance.current) {
        console.log("Cleaning up map instance");
        mapInstance.current.remove();
        mapInstance.current = null;
      }
    };
  }, [mapContainer, mapboxToken, initialLatitude, initialLongitude, isAdjusting]);

  return { 
    mapContainer, 
    map: mapInstance, 
    newCoordinates, 
    setNewCoordinates,
    isMapLoaded 
  };
};
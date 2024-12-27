import { useRef, useState } from "react";
import { useMapInitialization } from "./useMapInitialization";

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
  const [newCoordinates, setNewCoordinates] = useState<{ lat: number; lng: number } | null>(null);

  const { map, isMapLoaded } = useMapInitialization({
    container: mapContainer.current!,
    initialLatitude,
    initialLongitude,
    mapboxToken: mapboxToken || '',
    zoom: 15
  });

  // Set up click handler for location adjustment
  if (map && isAdjusting) {
    map.on("click", (e) => {
      console.log("Map clicked:", e.lngLat);
      setNewCoordinates({ lat: e.lngLat.lat, lng: e.lngLat.lng });
    });
  }

  return { 
    mapContainer, 
    map, 
    newCoordinates, 
    setNewCoordinates, 
    isMapLoaded 
  };
};
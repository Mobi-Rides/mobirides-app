import { useRef, useState } from "react";
import { useMapInitialization } from "./useMapInitialization";
import { useMarkerManagement } from "./useMarkerManagement";
import { useMapClickHandler } from "./useMapClickHandler";

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

  // Initialize map
  const mapInstance = useMapInitialization({ 
    initialLatitude, 
    initialLongitude, 
    mapboxToken,
    mapContainer 
  });

  // Manage marker
  const marker = useMarkerManagement({
    map: mapInstance.current,
    initialLatitude,
    initialLongitude,
    isAdjusting,
    onCoordinatesChange: setNewCoordinates
  });

  // Handle map clicks
  useMapClickHandler({
    map: mapInstance.current,
    marker: marker.current,
    isAdjusting,
    onCoordinatesChange: setNewCoordinates
  });

  return {
    mapContainer,
    map: mapInstance.current,
    newCoordinates,
    setNewCoordinates
  };
};
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

  const map = useMapInitialization({ 
    initialLatitude, 
    initialLongitude, 
    mapboxToken 
  });

  const marker = useMarkerManagement({
    map: map.current,
    initialLatitude,
    initialLongitude,
    isAdjusting,
    onCoordinatesChange: setNewCoordinates
  });

  useMapClickHandler({
    map: map.current,
    marker: marker.current,
    isAdjusting,
    onCoordinatesChange: setNewCoordinates
  });

  return {
    mapContainer,
    map: map.current,
    newCoordinates,
    setNewCoordinates
  };
};
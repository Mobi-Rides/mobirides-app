import { useCallback } from "react";
import mapboxgl from "mapbox-gl";

interface UseMapControlsProps {
  map: mapboxgl.Map | null;
  userLocation: { latitude: number; longitude: number };
}

export const useMapControls = ({
  map,
  userLocation
}: UseMapControlsProps) => {
  const onUp = useCallback(() => {
    map?.panBy([0, -100], { duration: 500 });
  }, [map]);

  const onDown = useCallback(() => {
    map?.panBy([0, 100], { duration: 500 });
  }, [map]);

  const onLeft = useCallback(() => {
    map?.panBy([-100, 0], { duration: 500 });
  }, [map]);

  const onRight = useCallback(() => {
    map?.panBy([100, 0], { duration: 500 });
  }, [map]);

  const onReset = useCallback(() => {
    map?.flyTo({
      center: [userLocation.longitude, userLocation.latitude],
      zoom: 18,
      essential: true,
    });
  }, [map, userLocation]);

  return {
    onUp,
    onDown,
    onLeft,
    onRight,
    onReset
  };
};

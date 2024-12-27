import { useEffect } from "react";
import mapboxgl from "mapbox-gl";

interface UseMapClickHandlerProps {
  map: mapboxgl.Map | null;
  marker: mapboxgl.Marker | null;
  isAdjusting: boolean;
  onCoordinatesChange?: (coordinates: { lat: number; lng: number }) => void;
}

export const useMapClickHandler = ({
  map,
  marker,
  isAdjusting,
  onCoordinatesChange
}: UseMapClickHandlerProps) => {
  useEffect(() => {
    if (!map) return;

    const handleMapClick = (e: mapboxgl.MapMouseEvent) => {
      if (isAdjusting && marker) {
        const newLng = e.lngLat.lng;
        const newLat = e.lngLat.lat;
        
        console.log("New marker position from click:", { lat: newLat, lng: newLng });
        marker.setLngLat([newLng, newLat]);
        
        if (onCoordinatesChange) {
          onCoordinatesChange({ lat: newLat, lng: newLng });
        }
      }
    };

    map.on('click', handleMapClick);

    return () => {
      map.off('click', handleMapClick);
    };
  }, [map, marker, isAdjusting, onCoordinatesChange]);
};
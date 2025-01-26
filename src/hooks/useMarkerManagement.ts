import { useEffect, useRef } from "react";
import mapboxgl from "mapbox-gl";

interface UseMarkerManagementProps {
  map: mapboxgl.Map | null;
  initialLatitude: number;
  initialLongitude: number;
  isAdjusting: boolean;
  onCoordinatesChange?: (coordinates: { lat: number; lng: number }) => void;
}

export const useMarkerManagement = ({
  map,
  initialLatitude,
  initialLongitude,
  isAdjusting,
  onCoordinatesChange
}: UseMarkerManagementProps) => {
  const marker = useRef<mapboxgl.Marker | null>(null);

  useEffect(() => {
    if (!map) return;

    // Remove existing marker if it exists
    if (marker.current) {
      marker.current.remove();
    }

    // Create new marker with fixed coordinates
    marker.current = new mapboxgl.Marker({
      color: "#FF0000",
      draggable: isAdjusting,
      anchor: 'center'
    })
      .setLngLat([initialLongitude, initialLatitude])
      .addTo(map);

    // If marker is draggable, update coordinates on dragend
    if (isAdjusting) {
      marker.current.on('dragend', () => {
        const lngLat = marker.current?.getLngLat();
        if (lngLat && onCoordinatesChange) {
          console.log("New marker position from drag:", { lat: lngLat.lat, lng: lngLat.lng });
          onCoordinatesChange({ lat: lngLat.lat, lng: lngLat.lng });
        }
      });
    }

    return () => {
      if (marker.current) {
        marker.current.remove();
        marker.current = null;
      }
    };
  }, [map, initialLatitude, initialLongitude, isAdjusting, onCoordinatesChange]);

  return marker;
};
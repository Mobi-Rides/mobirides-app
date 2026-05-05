import { useState, useEffect, useCallback } from "react";
import mapboxgl from "mapbox-gl";
import { useGeocoding } from "./useGeocoding";

interface UseMapCenterPinProps {
  map: mapboxgl.Map | null;
  enabled: boolean;
}

export const useMapCenterPin = ({ map, enabled }: UseMapCenterPinProps) => {
  const [centerCoords, setCenterCoords] = useState<{ lng: number; lat: number } | null>(null);
  const [centerAddress, setCenterAddress] = useState<string>("");
  const { reverseGeocode } = useGeocoding();

  const updateCenter = useCallback(async () => {
    if (!map || !enabled) return;
    
    const center = map.getCenter();
    setCenterCoords({ lng: center.lng, lat: center.lat });

    try {
      const address = await reverseGeocode(center.lat, center.lng);
      setCenterAddress(address);
    } catch (error) {
      console.error("Failed to geocode center:", error);
    }
  }, [map, enabled, reverseGeocode]);

  useEffect(() => {
    if (!map || !enabled) return;

    map.on("moveend", updateCenter);
    // Initial update
    updateCenter();

    return () => {
      map.off("moveend", updateCenter);
    };
  }, [map, enabled, updateCenter]);

  return {
    centerCoords,
    centerAddress,
    refreshCenter: updateCenter
  };
};

import { useRef, useState, useEffect } from "react";
import mapboxgl from "mapbox-gl";

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
  const map = useRef<mapboxgl.Map | null>(null);
  const [newCoordinates, setNewCoordinates] = useState<{ lat: number; lng: number } | null>(null);

  useEffect(() => {
    if (!mapboxToken || !mapContainer.current) return;

    mapboxgl.accessToken = mapboxToken;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: "mapbox://styles/mapbox/streets-v12",
      center: [initialLongitude, initialLatitude],
      zoom: 15,
    });

    map.current.addControl(new mapboxgl.NavigationControl(), "top-right");

    if (isAdjusting) {
      map.current.on("click", (e) => {
        console.log("Map clicked:", e.lngLat);
        setNewCoordinates({ lat: e.lngLat.lat, lng: e.lngLat.lng });
      });
    }

    return () => {
      map.current?.remove();
    };
  }, [mapboxToken, initialLatitude, initialLongitude, isAdjusting]);

  return { mapContainer, map, newCoordinates, setNewCoordinates };
};
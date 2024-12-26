import { useEffect, useRef } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { useMapboxToken } from "../MapboxConfig";
import { Skeleton } from "../ui/skeleton";

interface CarLocationProps {
  latitude: number | null;
  longitude: number | null;
  location: string;
}

export const CarLocation = ({ latitude, longitude, location }: CarLocationProps) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const marker = useRef<mapboxgl.Marker | null>(null);
  const token = useMapboxToken();

  useEffect(() => {
    if (!token || !mapContainer.current || !latitude || !longitude) return;

    console.log("Initializing map with coordinates:", { latitude, longitude });
    
    mapboxgl.accessToken = token;
    
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: "mapbox://styles/mapbox/streets-v12",
      center: [longitude, latitude],
      zoom: 14,
    });

    marker.current = new mapboxgl.Marker()
      .setLngLat([longitude, latitude])
      .addTo(map.current);

    map.current.addControl(new mapboxgl.NavigationControl(), "top-right");

    return () => {
      map.current?.remove();
    };
  }, [latitude, longitude, token]);

  if (!token) {
    return null;
  }

  if (!latitude || !longitude) {
    return (
      <div>
        <h2 className="font-semibold mb-2">Location</h2>
        <p className="text-muted-foreground">{location}</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <h2 className="font-semibold">Location</h2>
      <p className="text-muted-foreground mb-2">{location}</p>
      <div className="relative w-full h-[300px] rounded-lg overflow-hidden">
        <div ref={mapContainer} className="absolute inset-0" />
      </div>
    </div>
  );
};
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
    if (!token || !mapContainer.current || !latitude || !longitude) {
      console.log("Missing required parameters for map:", { token: !!token, latitude, longitude });
      return;
    }

    console.log("Initializing map with precise coordinates:", { 
      latitude: latitude.toFixed(6), 
      longitude: longitude.toFixed(6) 
    });
    
    mapboxgl.accessToken = token;
    
    // Ensure coordinates are properly converted to numbers
    const lng = Number(longitude);
    const lat = Number(latitude);
    
    try {
      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: "mapbox://styles/mapbox/streets-v12",
        center: [lng, lat],
        zoom: 15, // Increased zoom level for better precision
        pitchWithRotate: false, // Disable pitch with rotate for better accuracy
      });

      // Remove any existing marker
      if (marker.current) {
        marker.current.remove();
      }

      // Add new marker
      marker.current = new mapboxgl.Marker({
        color: "#FF0000",
        draggable: false
      })
        .setLngLat([lng, lat])
        .addTo(map.current);

      // Add navigation controls
      map.current.addControl(new mapboxgl.NavigationControl(), "top-right");

      // Log when map is fully loaded
      map.current.on('load', () => {
        console.log("Map loaded successfully at coordinates:", {
          center: map.current?.getCenter(),
          zoom: map.current?.getZoom()
        });
      });

      return () => {
        console.log("Cleaning up map instance");
        marker.current?.remove();
        map.current?.remove();
      };
    } catch (error) {
      console.error("Error initializing map:", error);
    }
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
      <p className="text-xs text-muted-foreground">
        Coordinates: {latitude.toFixed(6)}, {longitude.toFixed(6)}
      </p>
    </div>
  );
};
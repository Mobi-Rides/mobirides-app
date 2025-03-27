import { useEffect, useRef, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MapPin } from "lucide-react";
import { toast } from "sonner";
import { useMapboxToken } from "@/hooks/useMapboxToken";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";

interface CarLocationProps {
  latitude: number;
  longitude: number;
  location: string;
  mapStyle?: string;
}

export const CarLocation = ({
  latitude,
  longitude,
  location,
  mapStyle = "mapbox://styles/mapbox/streets-v12",
}: CarLocationProps) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const marker = useRef<mapboxgl.Marker | null>(null);
  const mapInitializedRef = useRef<boolean>(false);
  const { token: mapboxToken } = useMapboxToken();

  // Initialize map only once when component mounts
  useEffect(() => {
    if (!mapboxToken || !mapContainer.current || mapInitializedRef.current)
      return;

    // Initialize mapbox
    mapboxgl.accessToken = mapboxToken;

    try {
      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: mapStyle,
        center: [longitude, latitude],
        zoom: 13,
        interactive: false, // Make the map non-interactive
      });

      map.current.on("load", () => {
        // Add marker
        marker.current = new mapboxgl.Marker({ color: "#7C3AED" })
          .setLngLat([longitude, latitude])
          .addTo(map.current!);

        mapInitializedRef.current = true;
      });

      map.current.on("error", (e) => {
        console.error("Map error:", e);
        toast.error("Error loading location map");
      });
    } catch (error) {
      console.error("Error initializing map:", error);
      toast.error("Could not initialize location map");
    }

    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
        marker.current = null;
        mapInitializedRef.current = false;
      }
    };
  }, [latitude, longitude, mapboxToken, mapStyle]);

  // Update map center when coordinates change
  useEffect(() => {
    if (map.current && mapInitializedRef.current && marker.current) {
      map.current.setCenter([longitude, latitude]);
      marker.current.setLngLat([longitude, latitude]);
    }
  }, [latitude, longitude]);

  // Update map style when mapStyle prop changes
  useEffect(() => {
    if (map.current && mapInitializedRef.current) {
      map.current.setStyle(mapStyle);
    }
  }, [mapStyle]);

  return (
    <Card className="dark:bg-gray-800 dark:border-gray-700">
      <CardHeader className="pb-2">
        <CardTitle className="text-base text-left text-muted-foreground dark:text-white font-medium">
          Location
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-2 mb-3">
          <MapPin size={16} className="text-red-500 " />
          <p className="text-xs md:text-sm text-left text-muted-foreground dark:text-gray-300">{location}</p>
        </div>
        <div
          ref={mapContainer}
          className="w-full h-40 rounded-md overflow-hidden border border-muted dark:border-gray-700"
        />
      </CardContent>
    </Card>
  );
};

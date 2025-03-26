import { useEffect, useRef, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MapPin } from "lucide-react";
import { toast } from "sonner";
import { useMapboxToken } from "@/hooks/useMapboxToken";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { getMapboxToken } from "@/utils/mapbox";
import { Skeleton } from "../ui/skeleton";

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
  const [mapboxToken, setMapboxToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchMapboxToken = async () => {
      const token = await getMapboxToken();
      if (!token) {
        toast.error("Failed to get the map token");
        return;
      }
      console.log("Mapbox token:", token);
      setMapboxToken(token);
      setIsLoading(false);
    };
    fetchMapboxToken();
  }, []);

  // Initialize map only once when component mounts
  useEffect(() => {
    if (isLoading) {
      return;
    }

    if (mapboxToken) {
      mapboxgl.accessToken = mapboxToken;
      console.log("Mapbox token set");
    }

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
  }, [latitude, longitude, mapboxToken, mapStyle, isLoading]);

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
        <CardTitle className="text-lg flex items-center gap-2 dark:text-white">
          <MapPin className="h-5 w-5 text-primary dark:text-primary-foreground" />
          Location
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm mb-3 dark:text-gray-300">{location}</p>
        {isLoading ? (
          <div className="w-full h-40 rounded-md overflow-hidden border border-muted dark:border-gray-700">
            <Skeleton className="w-full h-full" />
          </div>
        ) : (
          <div
            ref={mapContainer}
            className="w-full h-40 rounded-md overflow-hidden border border-muted dark:border-gray-700"
          />
        )}
      </CardContent>
    </Card>
  );
};

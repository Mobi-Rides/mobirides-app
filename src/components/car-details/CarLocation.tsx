
import { useEffect, useRef, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MapPin } from "lucide-react";
import { toast } from "sonner";
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
  const fallbackStyle = "mapbox://styles/mapbox/light-v11";

  useEffect(() => {
    const fetchMapboxToken = async () => {
      try {
        const token = await getMapboxToken();
        if (!token) {
          toast.error("Failed to get the map token");
          return;
        }
        setMapboxToken(token);
        setIsLoading(false);
      } catch (error) {
        console.error("Error getting Mapbox token:", error);
        toast.error("Failed to load map configuration");
      }
    };
    fetchMapboxToken();
  }, []);

  // Initialize map only once when component mounts
  useEffect(() => {
    if (isLoading || !mapContainer.current) {
      return;
    }

    // Verify container size
    const container = mapContainer.current;
    if (container.offsetWidth === 0 || container.offsetHeight === 0) {
      console.error("Map container has zero width or height");
      return;
    }

    console.log("Initializing map with coordinates:", { longitude, latitude });

    if (mapboxToken) {
      mapboxgl.accessToken = mapboxToken;
    } else {
      console.error("No Mapbox token available");
      return;
    }

    try {
      // Use the correct coordinate order for mapbox [lng, lat]
      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: mapStyle || fallbackStyle,
        center: [longitude, latitude], // Correct order: [longitude, latitude]
        zoom: 13,
        interactive: false, // Make the map non-interactive
      });

      map.current.on("load", () => {
        console.log("Map loaded successfully");
        
        // Add marker
        marker.current = new mapboxgl.Marker({ color: "#7C3AED" })
          .setLngLat([longitude, latitude])
          .addTo(map.current!);

        mapInitializedRef.current = true;
      });

      map.current.on("style.load", () => {
        console.log("Map style loaded successfully");
      });

      map.current.on("error", (e) => {
        console.error("Map error:", e);
        toast.error("Error loading location map");
        
        // Try to load fallback style if the error was style-related
        if (e.error && e.error.message.includes("style") && mapStyle !== fallbackStyle) {
          console.log("Attempting to load fallback style");
          map.current?.setStyle(fallbackStyle);
        }
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
      map.current.setStyle(mapStyle || fallbackStyle);
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
            style={{ minHeight: "160px" }}
          />
        )}
      </CardContent>
    </Card>
  );
};

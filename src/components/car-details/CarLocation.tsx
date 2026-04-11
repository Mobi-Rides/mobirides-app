
import { useEffect, useRef, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MapPin } from "lucide-react";
import { toast } from "sonner";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { getMapboxToken } from "@/utils/mapbox";

interface CarLocationProps {
  latitude: number;
  longitude: number;
  location: string;
  mapStyle?: string;
}

const isValidCoordinates = (lat: number, lng: number): boolean => {
  return lat !== 0 || lng !== 0;
};

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
  const hasValidCoords = isValidCoordinates(latitude, longitude);

  useEffect(() => {
    if (!hasValidCoords) return;
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
  }, [hasValidCoords]);

  useEffect(() => {
    if (!hasValidCoords || isLoading || !mapContainer.current) return;

    const container = mapContainer.current;
    if (container.offsetWidth === 0 || container.offsetHeight === 0) return;

    if (mapboxToken) {
      mapboxgl.accessToken = mapboxToken;
    } else {
      return;
    }

    try {
      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: mapStyle || fallbackStyle,
        center: [longitude, latitude],
        zoom: 13,
        interactive: false,
      });

      map.current.on("load", () => {
        marker.current = new mapboxgl.Marker({ color: "#7C3AED" })
          .setLngLat([longitude, latitude])
          .addTo(map.current!);
        mapInitializedRef.current = true;
      });

      map.current.on("error", (e) => {
        console.error("Map error:", e);
        if (e.error && e.error.message.includes("style") && mapStyle !== fallbackStyle) {
          map.current?.setStyle(fallbackStyle);
        }
      });
    } catch (error) {
      console.error("Error initializing map:", error);
    }

    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
        marker.current = null;
        mapInitializedRef.current = false;
      }
    };
  }, [latitude, longitude, mapboxToken, mapStyle, isLoading, hasValidCoords]);

  useEffect(() => {
    if (map.current && mapInitializedRef.current && marker.current) {
      map.current.setCenter([longitude, latitude]);
      marker.current.setLngLat([longitude, latitude]);
    }
  }, [latitude, longitude]);

  useEffect(() => {
    if (map.current && mapInitializedRef.current) {
      map.current.setStyle(mapStyle || fallbackStyle);
    }
  }, [mapStyle]);

  // Fallback UI when coordinates are invalid
  if (!hasValidCoords) {
    return (
      <Card className="dark:bg-gray-800 dark:border-gray-700">
        <CardHeader className="pb-2">
          <CardTitle className="text-base text-left text-muted-foreground dark:text-white font-medium">
            Location
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 mb-2">
            <MapPin size={16} className="text-destructive" />
            <p className="text-xs md:text-sm text-left text-muted-foreground">{location}</p>
          </div>
          <p className="text-xs text-muted-foreground mt-2">Exact location unavailable</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="dark:bg-gray-800 dark:border-gray-700">
      <CardHeader className="pb-2">
        <CardTitle className="text-base text-left text-muted-foreground dark:text-white font-medium">
          Location
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-2 mb-3">
          <MapPin size={16} className="text-destructive" />
          <p className="text-xs md:text-sm text-left text-muted-foreground">{location}</p>
        </div>
        <div
          ref={mapContainer}
          className="w-full h-40 rounded-md overflow-hidden border border-muted"
        />
      </CardContent>
    </Card>
  );
};

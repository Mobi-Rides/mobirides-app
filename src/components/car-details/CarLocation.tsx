import { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { useMapboxToken } from "../MapboxConfig";
import { Button } from "../ui/button";
import { toast } from "sonner";

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
  const [isAdjusting, setIsAdjusting] = useState(false);
  const [newCoordinates, setNewCoordinates] = useState<{ lat: number; lng: number } | null>(null);

  useEffect(() => {
    if (!token || !mapContainer.current || !latitude || !longitude) {
      console.log("Missing required parameters for map:", { token: !!token, latitude, longitude });
      return;
    }

    console.log("Initializing map with coordinates:", { 
      latitude: latitude.toFixed(6), 
      longitude: longitude.toFixed(6) 
    });
    
    mapboxgl.accessToken = token;
    
    const lng = Number(longitude);
    const lat = Number(latitude);
    
    try {
      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: "mapbox://styles/mapbox/streets-v12",
        center: [lng, lat],
        zoom: 15,
        pitchWithRotate: false,
      });

      // Remove any existing marker
      if (marker.current) {
        marker.current.remove();
      }

      // Add new marker
      marker.current = new mapboxgl.Marker({
        color: "#FF0000",
        draggable: isAdjusting // Marker is draggable only in adjustment mode
      })
        .setLngLat([lng, lat])
        .addTo(map.current);

      // Add navigation controls
      map.current.addControl(new mapboxgl.NavigationControl(), "top-right");

      // Handle marker drag events when in adjustment mode
      if (isAdjusting && marker.current) {
        marker.current.on('dragend', () => {
          const coordinates = marker.current?.getLngLat();
          if (coordinates) {
            console.log("New marker position:", coordinates);
            setNewCoordinates({ lat: coordinates.lat, lng: coordinates.lng });
          }
        });
      }

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
  }, [latitude, longitude, token, isAdjusting]);

  const handleAdjustLocation = () => {
    setIsAdjusting(true);
    if (marker.current) {
      marker.current.setDraggable(true);
    }
    toast.info("Drag the marker to adjust the location. Click 'Save Location' when done.");
  };

  const handleSaveLocation = () => {
    if (newCoordinates) {
      console.log("Saving new coordinates:", newCoordinates);
      toast.success("New coordinates captured. Please review the console output.");
    }
    setIsAdjusting(false);
    if (marker.current) {
      marker.current.setDraggable(false);
    }
  };

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
      <div className="flex items-center justify-between">
        <h2 className="font-semibold">Location</h2>
        <div className="space-x-2">
          {!isAdjusting ? (
            <Button 
              variant="outline" 
              size="sm"
              onClick={handleAdjustLocation}
            >
              Adjust Location
            </Button>
          ) : (
            <Button 
              variant="default" 
              size="sm"
              onClick={handleSaveLocation}
            >
              Save Location
            </Button>
          )}
        </div>
      </div>
      <p className="text-muted-foreground mb-2">{location}</p>
      <div className="relative w-full h-[300px] rounded-lg overflow-hidden">
        <div ref={mapContainer} className="absolute inset-0" />
      </div>
      <div className="space-y-1 text-xs text-muted-foreground">
        <p>Current coordinates: {latitude.toFixed(6)}, {longitude.toFixed(6)}</p>
        {newCoordinates && (
          <p>New coordinates: {newCoordinates.lat.toFixed(6)}, {newCoordinates.lng.toFixed(6)}</p>
        )}
      </div>
    </div>
  );
};
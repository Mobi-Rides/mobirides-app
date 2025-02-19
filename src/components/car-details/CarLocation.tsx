
import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "../ui/button";
import { toast } from "sonner";
import { useMapLocation } from "@/hooks/useMapLocation";
import { updateCarLocation } from "@/services/carLocation";
import { useUserLocation } from "@/hooks/useUserLocation";
import { useMapboxToken } from "@/hooks/useMapboxToken";
import { Car } from "lucide-react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";

interface CarLocationProps {
  latitude: number | null;
  longitude: number | null;
  location: string;
}

export const CarLocation = ({ latitude, longitude, location }: CarLocationProps) => {
  const [isAdjusting, setIsAdjusting] = useState(false);
  const [hostMarker, setHostMarker] = useState<mapboxgl.Marker | null>(null);
  const { id: carId } = useParams();
  const queryClient = useQueryClient();
  const { token, isLoading: isTokenLoading } = useMapboxToken();

  const { 
    mapContainer, 
    map, 
    newCoordinates, 
    setNewCoordinates,
    isMapLoaded 
  } = useMapLocation({
    initialLatitude: latitude || 0,
    initialLongitude: longitude || 0,
    mapboxToken: token,
    isAdjusting
  });

  // Initialize user location tracking
  const { userLocation } = useUserLocation(map?.current);

  // Update host marker when user location changes
  useEffect(() => {
    if (!map?.current || !userLocation) return;

    // Remove existing host marker if it exists
    if (hostMarker) {
      hostMarker.remove();
    }

    // Create a custom marker element
    const el = document.createElement('div');
    el.className = 'bg-primary text-white p-2 rounded-full';
    el.innerHTML = '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2"/><circle cx="7" cy="17" r="2"/><circle cx="17" cy="17" r="2"/></svg>';

    // Create and add the new marker
    const newMarker = new mapboxgl.Marker({
      element: el,
      anchor: 'center'
    })
      .setLngLat([userLocation.longitude, userLocation.latitude])
      .addTo(map.current);

    setHostMarker(newMarker);

    // Update map bounds to show both car and host locations
    if (latitude && longitude) {
      const bounds = new mapboxgl.LngLatBounds()
        .extend([longitude, latitude])
        .extend([userLocation.longitude, userLocation.latitude]);

      map.current.fitBounds(bounds, {
        padding: 100
      });
    }
  }, [map?.current, userLocation, latitude, longitude]);

  const handleAdjustLocation = () => {
    setIsAdjusting(true);
    toast.info("Click anywhere on the map to adjust the location. Click 'Save Location' when done.");
  };

  const handleSaveLocation = async () => {
    if (!newCoordinates || !carId) {
      console.log("Missing required data for location update:", { newCoordinates, carId });
      toast.error("Please select a new location first");
      return;
    }

    console.log("Saving new location:", newCoordinates);
    
    const success = await updateCarLocation(
      carId,
      newCoordinates.lat,
      newCoordinates.lng
    );

    if (success) {
      console.log("Location update successful, invalidating queries");
      await queryClient.invalidateQueries({ queryKey: ['car', carId] });
      setIsAdjusting(false);
      setNewCoordinates(null);
    }
  };

  // Show loading state while token is being fetched
  if (isTokenLoading) {
    console.log("Loading token state:", { isTokenLoading, token });
    return <div>Loading map configuration...</div>;
  }

  // Don't show MapboxConfig overlay, just show a message if there's no token
  if (!token) {
    console.log("Token state check:", { token, isTokenLoading });
    return <div className="text-muted-foreground">Map configuration required</div>;
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
        {!isMapLoaded && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/80">
            <div className="animate-pulse text-primary">Loading map...</div>
          </div>
        )}
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

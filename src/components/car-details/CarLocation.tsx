import { useState } from "react";
import { useParams } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { MapboxConfig } from "../MapboxConfig";
import { Button } from "../ui/button";
import { toast } from "sonner";
import { useMapLocation } from "@/hooks/useMapLocation";
import { updateCarLocation } from "@/services/carLocation";
import { useUserLocation } from "@/hooks/useUserLocation";
import { useMapboxToken } from "@/hooks/useMapboxToken";
import "mapbox-gl/dist/mapbox-gl.css";

interface CarLocationProps {
  latitude: number | null;
  longitude: number | null;
  location: string;
}

export const CarLocation = ({ latitude, longitude, location }: CarLocationProps) => {
  const [isAdjusting, setIsAdjusting] = useState(false);
  const { id: carId } = useParams();
  const queryClient = useQueryClient();
  const { token, isLoading } = useMapboxToken();

  const { mapContainer, map, newCoordinates, setNewCoordinates } = useMapLocation({
    initialLatitude: latitude || 0,
    initialLongitude: longitude || 0,
    mapboxToken: token,
    isAdjusting
  });

  // Initialize user location tracking
  useUserLocation(map.current);

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

  if (isLoading) {
    return <div>Loading map configuration...</div>;
  }

  if (!token) {
    return <MapboxConfig />;
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
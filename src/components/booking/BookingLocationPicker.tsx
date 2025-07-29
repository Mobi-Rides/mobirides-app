import { useState, useEffect, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Locate } from "lucide-react";
import { toast } from "sonner";
import { ScrollArea } from "@/components/ui/scroll-area";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { Skeleton } from "@/components/ui/skeleton";
import { getMapboxToken } from "@/utils/mapbox";
import { useTheme } from "next-themes";
import CustomMapbox from "../map/CustomMapbox";
import { LocationSelectionMarker } from "./LocationSelectionMarker";

interface BookingLocationPickerProps {
  isOpen: boolean;
  onClose: () => void;
  onLocationSelected: (lat: number, lng: number) => void;
}

export const BookingLocationPicker = ({
  isOpen,
  onClose,
  onLocationSelected,
}: BookingLocationPickerProps) => {
  const [selectedLocation, setSelectedLocation] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const mapContainer = useRef<HTMLDivElement | null>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markerRef = useRef<mapboxgl.Marker | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const mapInitializedRef = useRef<boolean>(false);
  const [mapboxToken, setMapboxToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const initialLocation = { long: 0, lat: 0 };
  const [location, setLocation] = useState(initialLocation);
  const { theme } = useTheme();

  const returnLocation = useCallback((long: number, lat: number) => {
    setLocation({ long, lat });
  }, []);

  // Map style based on theme
  const getMapStyle = () => {
    if (theme === "dark") {
      return "mapbox://styles/mapbox/navigation-night-v1";
    }
    return "mapbox://styles/mapbox/navigation-day-v1";
  };

  useEffect(() => {
    const fetchMapboxToken = async () => {
      try {
        const token = await getMapboxToken();
        if (!token) {
          toast.error("Failed to get the map token");
          return;
        }
        console.log("Mapbox token retrieved successfully");
        setMapboxToken(token);
        setIsLoading(false);
      } catch (error) {
        console.error("Error getting Mapbox token:", error);
        toast.error("Failed to load map configuration");
      }
    };
    fetchMapboxToken();
  }, []);

  const confirmLocation = () => {
    if (selectedLocation) {
      onLocationSelected(selectedLocation.lat, selectedLocation.lng);
      onClose();
    } else if (location.lat !== 0 || location.long !== 0) {
      onLocationSelected(location.lat, location.long);
      onClose();
    } else {
      toast.error("Please select a location first");
    }
  };

  const getUserLocation = () => {
    if (location.lat !== 0 || location.long !== 0) {
      setSelectedLocation({ lat: location.lat, lng: location.long });
    }
  };

  // Update selected location when map location changes
  useEffect(() => {
    if (location.lat !== 0 || location.long !== 0) {
      setSelectedLocation({ lat: location.lat, lng: location.long });
    }
  }, [location]);

  // Reset when dialog opens/closes
  useEffect(() => {
    if (isOpen) {
      setSelectedLocation(null);
      if (markerRef.current) {
        markerRef.current.remove();
        markerRef.current = null;
      }
      mapInitializedRef.current = false; // Reset initialization flag to force reinit
    }
  }, [isOpen]);

  // Resize map when the dialog is open
  useEffect(() => {
    if (isOpen && map.current) {
      console.log("Dialog opened, resizing map");

      // Give time for the dialog to render
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }

      timerRef.current = setTimeout(() => {
        if (map.current) {
          map.current.resize();
          console.log("Map resize triggered");
        }
      }, 500);
    }

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [isOpen]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (markerRef.current) {
        markerRef.current.remove();
        markerRef.current = null;
      }

      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }

      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, []);

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent className="sm:max-w-[600px] h-[80vh] max-h-[800px] flex flex-col overflow-hidden p-0">
        <DialogHeader className="p-6 pb-2">
          <DialogTitle>Select Pickup Location</DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            Click on the map to select a pickup location or use the button to
            get your current location.
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="flex-1 overflow-auto px-6 py-2">
          <div
            className="relative w-full rounded-md overflow-hidden border border-border mb-4"
            style={{ height: "400px", minHeight: "300px" }}
          >
            {(isLoading || !mapboxToken) && (
              <div className="absolute inset-0 bg-background/80 backdrop-blur-sm">
                <Skeleton className="w-full h-full" />
              </div>
            )}
            <CustomMapbox
              mapbox_token={mapboxToken}
              longitude={0}
              latitude={0}
              zoom={14}
              dpad={true}
              returnLocation={returnLocation}
            />
            <LocationSelectionMarker
              map={map.current}
              coordinates={selectedLocation}
              onLocationChange={(coords) => setSelectedLocation(coords)}
            />
            {selectedLocation && (
              <div className="absolute top-2 left-2 bg-background/90 p-2 rounded-md shadow-sm border border-border text-xs">
                <p>Latitude: {selectedLocation.lat.toFixed(6)}</p>
                <p>Longitude: {selectedLocation.lng.toFixed(6)}</p>
              </div>
            )}
            <div className="absolute top-2 right-2">
              <Button
                size="sm"
                variant="secondary"
                className="h-8 shadow-sm"
                onClick={getUserLocation}
                disabled={!mapboxToken || isLoading || !map.current}
              >
                <Locate className="h-4 w-4 mr-1" />
                Use My Location
              </Button>
            </div>
          </div>

          <div className="flex flex-col gap-2 mb-4">
            <p className="text-xs text-muted-foreground">
              {isLoading
                ? "Loading map..."
                : !mapboxToken
                ? "Map configuration not available"
                : selectedLocation
                ? "Location selected. Click confirm to use this location."
                : "Click on the map to select a pickup location, or use the button to get your current location."}
            </p>
          </div>
        </ScrollArea>

        <div className="flex justify-end gap-2 p-4 border-t sticky bottom-0 bg-background">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button 
            onClick={confirmLocation} 
            disabled={!selectedLocation && (location.lat === 0 && location.long === 0)}
          >
            Confirm Location
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

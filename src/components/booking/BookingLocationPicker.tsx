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
import { LocationSelectionMarker } from "./LocationSelectionMarker";
import { LocationSearchInput } from "../location/LocationSearchInput";
import { LocationSearchProvider } from "@/contexts/LocationSearchContext";
import { SearchSuggestion } from "@/services/mapboxSearchService";
import { LocationAwareCustomMapbox } from "./LocationAwareCustomMapbox";

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
  const [selectedAddress, setSelectedAddress] = useState<string>("");
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const geolocateControlRef = useRef<mapboxgl.GeolocateControl | null>(null);
  const [mapboxToken, setMapboxToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const { theme } = useTheme();

  // Fetch address from coordinates
  const fetchAddressFromCoordinates = useCallback(async (lat: number, lng: number) => {
    if (!mapboxToken) return;
    
    try {
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?access_token=${mapboxToken}`
      );
      const data = await response.json();
      
      if (data.features && data.features.length > 0) {
        setSelectedAddress(data.features[0].place_name);
      }
    } catch (error) {
      console.error("Error fetching address:", error);
    }
  }, [mapboxToken, setSelectedAddress]);

  // Handle map click for location selection
  const handleMapClick = useCallback((lng: number, lat: number) => {
    console.log("Map clicked at:", { lat, lng });
    setSelectedLocation({ lat, lng });
    fetchAddressFromCoordinates(lat, lng);
  }, [fetchAddressFromCoordinates]);

  // Handle map reference
  const handleMapRef = useCallback((mapInstance: mapboxgl.Map | null) => {
    mapRef.current = mapInstance;
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
    console.log("Confirm location called with selectedLocation:", selectedLocation);
    if (selectedLocation) {
      console.log("Calling onLocationSelected with:", selectedLocation.lat, selectedLocation.lng);
      onLocationSelected(selectedLocation.lat, selectedLocation.lng);
      console.log("Closing dialog");
      onClose();
    } else {
      console.log("No location selected, showing error");
      toast.error("Please select a location first");
    }
  };

  // Trigger user location using the geolocation control
  const getUserLocation = () => {
    if (geolocateControlRef.current) {
      geolocateControlRef.current.trigger();
    } else {
      toast.error("Geolocation not available");
    }
  };

  // Handle user location update from geolocation
  const handleUserLocationUpdate = useCallback((location: { latitude: number; longitude: number }) => {
    console.log("User location updated:", location);
    setUserLocation({ lat: location.latitude, lng: location.longitude });
    setSelectedLocation({ lat: location.latitude, lng: location.longitude });
    fetchAddressFromCoordinates(location.latitude, location.longitude);
  }, [fetchAddressFromCoordinates]);

  // Handle search location selection
  const handleSearchLocationSelect = (suggestion: SearchSuggestion) => {
    const [lng, lat] = suggestion.coordinates;
    setSelectedLocation({ lat, lng });
    setSelectedAddress(suggestion.full_address);
    
    // Center map on selected location
    if (mapRef.current) {
      mapRef.current.flyTo({
        center: [lng, lat],
        zoom: 16,
        essential: true
      });
    }
  };

  // Reset when dialog opens/closes
  useEffect(() => {
    if (isOpen) {
      setSelectedLocation(null);
      setSelectedAddress("");
      setUserLocation(null);
    }
  }, [isOpen]);

  return (
    <LocationSearchProvider>
      <Dialog
        open={isOpen}
        onOpenChange={(open) => {
          if (!open) onClose();
        }}
      >
        <DialogContent className="sm:max-w-[700px] h-[85vh] max-h-[900px] flex flex-col overflow-hidden p-0">
          <DialogHeader className="p-6 pb-4">
            <DialogTitle>Select Pickup Location</DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground">
              Search for a location, click on the map, or use your current location.
            </DialogDescription>
          </DialogHeader>

          <div className="px-6 pb-4">
            <LocationSearchInput
              placeholder="Search for addresses, landmarks, places..."
              onLocationSelect={handleSearchLocationSelect}
              className="w-full"
            />
          </div>

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
              <LocationAwareCustomMapbox
                mapboxToken={mapboxToken}
                selectedLocation={selectedLocation}
                onMapClick={handleMapClick}
                onMapRef={handleMapRef}
                onGeolocateRef={(control) => (geolocateControlRef.current = control)}
                onUserLocationUpdate={handleUserLocationUpdate}
                mapStyle={getMapStyle()}
              />
              {selectedLocation && (
                <div className="absolute top-2 left-2 bg-background/90 p-2 rounded-md shadow-sm border border-border text-xs max-w-[200px]">
                  <p className="font-medium">Selected Location</p>
                  <p>Lat: {selectedLocation.lat.toFixed(6)}</p>
                  <p>Lng: {selectedLocation.lng.toFixed(6)}</p>
                  {selectedAddress && (
                    <p className="mt-1 text-muted-foreground truncate">{selectedAddress}</p>
                  )}
                </div>
              )}
              <div className="absolute top-2 right-2">
                <Button
                  size="sm"
                  variant="secondary"
                  className="h-8 shadow-sm"
                  onClick={getUserLocation}
                  disabled={!mapboxToken || isLoading}
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
                  ? `Location selected${selectedAddress ? `: ${selectedAddress}` : ". Click confirm to use this location."}`
                  : "Search for a location above, click on the map, or use your current location."}
              </p>
            </div>
          </ScrollArea>

          <div className="flex justify-end gap-2 p-4 border-t sticky bottom-0 bg-background">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button 
              onClick={confirmLocation} 
              disabled={!selectedLocation}
            >
              Confirm Location
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </LocationSearchProvider>
  );
};

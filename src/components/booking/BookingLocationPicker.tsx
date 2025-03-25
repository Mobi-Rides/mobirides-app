
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useMap } from "@/hooks/useMap";
import { useMapboxToken } from "@/contexts/MapboxTokenContext";
import { LocationType } from "@/types/booking";
import { MapPin, Locate } from "lucide-react";
import { toast } from "sonner";

interface BookingLocationPickerProps {
  isOpen: boolean;
  onClose: () => void;
  onLocationSelected: (lat: number, lng: number) => void;
}

export const BookingLocationPicker = ({
  isOpen,
  onClose,
  onLocationSelected
}: BookingLocationPickerProps) => {
  const [selectedLocation, setSelectedLocation] = useState<{ lat: number; lng: number } | null>(null);
  const { token } = useMapboxToken();
  
  const { mapContainer, map, isLoaded } = useMap({
    initialLatitude: -24.6282,
    initialLongitude: 25.9692,
    onMapClick: (lngLat) => {
      setSelectedLocation({ lat: lngLat.lat, lng: lngLat.lng });
    }
  });

  const getUserLocation = () => {
    if (navigator.geolocation) {
      toast.info("Getting your location...");
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setSelectedLocation({ lat: latitude, lng: longitude });
          
          // If map is loaded, pan to user location
          if (map) {
            map.flyTo({
              center: [longitude, latitude],
              zoom: 14
            });
          }
          
          toast.success("Location found!");
        },
        (error) => {
          console.error("Error getting location:", error);
          toast.error("Could not get your location. Please enable location services.");
        }
      );
    } else {
      toast.error("Geolocation is not supported by your browser");
    }
  };

  const confirmLocation = () => {
    if (selectedLocation) {
      onLocationSelected(selectedLocation.lat, selectedLocation.lng);
      onClose();
    } else {
      toast.error("Please select a location first");
    }
  };

  useEffect(() => {
    // Reset selected location when dialog opens
    if (isOpen) {
      setSelectedLocation(null);
    }
  }, [isOpen]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] h-[80vh] max-h-[600px] flex flex-col">
        <DialogHeader>
          <DialogTitle>Select Pickup Location</DialogTitle>
        </DialogHeader>
        
        <div className="flex-1 relative min-h-[400px] rounded-md overflow-hidden border border-border mb-4">
          {!isLoaded && (
            <div className="absolute inset-0 flex items-center justify-center bg-muted/20">
              <p className="text-sm text-muted-foreground">Loading map...</p>
            </div>
          )}
          <div ref={mapContainer} className="w-full h-full" />
          
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
            >
              <Locate className="h-4 w-4 mr-1" />
              Use My Location
            </Button>
          </div>
        </div>
        
        <div className="flex flex-col gap-2 mt-auto">
          <p className="text-xs text-muted-foreground">
            {selectedLocation 
              ? "Location selected. Click confirm to use this location." 
              : "Click on the map to select a pickup location, or use the button to get your current location."}
          </p>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={onClose}>Cancel</Button>
            <Button 
              onClick={confirmLocation}
              disabled={!selectedLocation}
            >
              <MapPin className="h-4 w-4 mr-2" />
              Confirm Location
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

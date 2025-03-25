
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useMap } from "@/hooks/useMap";
import { useMapboxToken } from "@/contexts/MapboxTokenContext";
import { MapPin, Locate } from "lucide-react";
import { toast } from "sonner";
import { ScrollArea } from "@/components/ui/scroll-area";

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

  // Resize map when the dialog is open
  useEffect(() => {
    if (isOpen && map && isLoaded) {
      // Small timeout to ensure the dialog is fully rendered
      const timer = setTimeout(() => {
        map.resize();
      }, 100);
      
      return () => clearTimeout(timer);
    }
  }, [isOpen, map, isLoaded]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] flex flex-col p-0 overflow-hidden">
        <DialogHeader className="p-6 pb-0">
          <DialogTitle>Select Pickup Location</DialogTitle>
        </DialogHeader>
        
        <ScrollArea className="flex-1 max-h-[calc(80vh-120px)]">
          <div className="p-6 pt-2 flex flex-col gap-4">
            <div className="relative min-h-[350px] h-[50vh] rounded-md overflow-hidden border border-border">
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
            
            <div className="flex flex-col gap-2">
              <p className="text-xs text-muted-foreground">
                {selectedLocation 
                  ? "Location selected. Click confirm to use this location." 
                  : "Click on the map to select a pickup location, or use the button to get your current location."}
              </p>
            </div>
          </div>
        </ScrollArea>
        
        <div className="flex justify-end gap-2 p-4 border-t">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button 
            onClick={confirmLocation}
            disabled={!selectedLocation}
          >
            <MapPin className="h-4 w-4 mr-2" />
            Confirm Location
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

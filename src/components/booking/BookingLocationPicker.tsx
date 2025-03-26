
import { useState, useEffect, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useMap } from "@/hooks/useMap";
import { Locate } from "lucide-react";
import { toast } from "sonner";
import { ScrollArea } from "@/components/ui/scroll-area";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";

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
  const markerRef = useRef<mapboxgl.Marker | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  
  const { mapContainer, map, isLoaded, resizeMap } = useMap({
    initialLatitude: -24.6282,
    initialLongitude: 25.9692,
    onMapClick: (lngLat) => {
      setSelectedLocation({ lat: lngLat.lat, lng: lngLat.lng });
      
      // Update marker position
      if (map && markerRef.current) {
        markerRef.current.setLngLat([lngLat.lng, lngLat.lat]);
      } else if (map) {
        // Create a new marker if it doesn't exist
        const newMarker = new mapboxgl.Marker({ color: "#7C3AED" })
          .setLngLat([lngLat.lng, lngLat.lat])
          .addTo(map);
        markerRef.current = newMarker;
      }
    }
  });

  const getUserLocation = useCallback(() => {
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
            
            // Update or create marker
            if (markerRef.current) {
              markerRef.current.setLngLat([longitude, latitude]);
            } else {
              const newMarker = new mapboxgl.Marker({ color: "#7C3AED" })
                .setLngLat([longitude, latitude])
                .addTo(map);
              markerRef.current = newMarker;
            }
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
  }, [map]);

  const confirmLocation = () => {
    if (selectedLocation) {
      onLocationSelected(selectedLocation.lat, selectedLocation.lng);
      onClose();
    } else {
      toast.error("Please select a location first");
    }
  };

  // Reset when dialog opens/closes
  useEffect(() => {
    if (isOpen) {
      setSelectedLocation(null);
      if (markerRef.current) {
        markerRef.current.remove();
        markerRef.current = null;
      }
    }
  }, [isOpen]);

  // Resize map when the dialog is open
  useEffect(() => {
    if (isOpen && isLoaded) {
      console.log('Dialog opened, resizing map');
      
      // Give time for the dialog to render
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
      
      timerRef.current = setTimeout(() => {
        resizeMap();
        console.log('Map resize triggered');
      }, 500);
    }
    
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [isOpen, isLoaded, resizeMap]);

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
    };
  }, []);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      if (!open) onClose();
    }}>
      <DialogContent className="sm:max-w-[600px] h-[80vh] max-h-[800px] flex flex-col overflow-hidden p-0">
        <DialogHeader className="p-6 pb-2">
          <DialogTitle>Select Pickup Location</DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            Click on the map to select a pickup location or use the button to get your current location.
          </DialogDescription>
        </DialogHeader>
        
        <ScrollArea className="flex-1 overflow-auto px-6 py-2">
          <div className="relative w-full rounded-md overflow-hidden border border-border mb-4" 
               style={{ height: "400px", minHeight: "300px" }}>
            {!isLoaded && (
              <div className="absolute inset-0 flex items-center justify-center bg-muted/20 z-10">
                <p className="text-sm text-muted-foreground">Loading map...</p>
              </div>
            )}
            <div 
              ref={mapContainer} 
              className="w-full h-full"
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
              >
                <Locate className="h-4 w-4 mr-1" />
                Use My Location
              </Button>
            </div>
          </div>
          
          <div className="flex flex-col gap-2 mb-4">
            <p className="text-xs text-muted-foreground">
              {selectedLocation 
                ? "Location selected. Click confirm to use this location." 
                : "Click on the map to select a pickup location, or use the button to get your current location."}
            </p>
          </div>
        </ScrollArea>
        
        <div className="flex justify-end gap-2 p-4 border-t sticky bottom-0 bg-background">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button 
            onClick={confirmLocation}
            disabled={!selectedLocation}
          >
            Confirm Location
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

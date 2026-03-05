
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MapPin, Search, Navigation, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { getMapboxToken, reverseGeocode } from "@/utils/mapbox";
import { toast } from "@/utils/toast-utils";

interface LocationSelectionStepProps {
  onComplete: (data: { latitude: number; longitude: number; address: string }) => void;
  isSubmitting: boolean;
}

export const LocationSelectionStep: React.FC<LocationSelectionStepProps> = ({
  onComplete,
  isSubmitting
}) => {
  const [address, setAddress] = useState("");
  const [selectedLocation, setSelectedLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [isLocating, setIsLocating] = useState(false);

  const handleUseCurrentLocation = () => {
    setIsLocating(true);
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          setSelectedLocation({ lat: latitude, lng: longitude });
          try {
            const addr = await reverseGeocode(latitude, longitude);
            setAddress(addr || `Lat: ${latitude.toFixed(4)}, Lng: ${longitude.toFixed(4)}`);
          } catch (err) {
            setAddress(`Lat: ${latitude.toFixed(4)}, Lng: ${longitude.toFixed(4)}`);
          }
          setIsLocating(false);
        },
        (error) => {
          console.error("Error getting location:", error);
          toast.error("Could not get your current location");
          setIsLocating(false);
        }
      );
    } else {
      toast.error("Geolocation is not supported by your browser");
      setIsLocating(false);
    }
  };

  const handleConfirm = () => {
    if (!selectedLocation) {
      toast.error("Please select a location first");
      return;
    }
    onComplete({
      latitude: selectedLocation.lat,
      longitude: selectedLocation.lng,
      address
    });
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="h-5 w-5 text-primary" />
          Select Handover Location
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Choose where you will meet the renter to hand over the keys.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Search for a location..." 
              className="pl-9"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
            />
          </div>
          <Button 
            variant="outline" 
            className="w-full flex items-center gap-2" 
            onClick={handleUseCurrentLocation}
            disabled={isLocating}
          >
            {isLocating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Navigation className="h-4 w-4" />}
            Use My Current Location
          </Button>
        </div>

        {selectedLocation && (
          <div className="bg-primary/5 border border-primary/20 p-4 rounded-lg space-y-2">
            <p className="text-xs font-bold uppercase tracking-wider text-primary">Selected Location</p>
            <p className="text-sm font-medium">{address}</p>
            <p className="text-[10px] text-muted-foreground">
              {selectedLocation.lat.toFixed(6)}, {selectedLocation.lng.toFixed(6)}
            </p>
          </div>
        )}

        <div className="pt-4">
          <Button 
            className="w-full h-12 text-lg" 
            disabled={!selectedLocation || isSubmitting}
            onClick={handleConfirm}
          >
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Confirm Location & Continue
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

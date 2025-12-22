import { useState, useEffect } from "react";
import { Navigation2, Volume2, VolumeX, MapPin, Clock, Timer, Share2, Layers, Eye } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { IntersectionPreview } from "./IntersectionPreview";

interface NavigationStep {
  instruction: string;
  distance: number;
  duration: number;
  maneuver: string;
  road_name?: string;
  geometry?: any;
}

interface NavigationInterfaceProps {
  currentStep: NavigationStep | null;
  totalDistance: number;
  totalDuration: number;
  isNavigating: boolean;
  onToggleVoice: () => void;
  isVoiceEnabled: boolean;
  onStopNavigation: () => void;
  onArrived?: () => void;
  destination: string;
  showArrivedButton?: boolean;
  onShareETA?: (eta: string) => void;
  onToggleTraffic?: () => void;
  showTraffic?: boolean;
}

export const NavigationInterface = ({
  currentStep,
  totalDistance,
  totalDuration,
  isNavigating,
  onToggleVoice,
  isVoiceEnabled,
  onStopNavigation,
  onArrived,
  destination,
  showArrivedButton = false,
  onShareETA,
  onToggleTraffic,
  showTraffic = false
}: NavigationInterfaceProps) => {
  const [eta, setEta] = useState<string>("");
  const [showPreview, setShowPreview] = useState(false);
  const [previewLocation, setPreviewLocation] = useState<{latitude: number, longitude: number} | null>(null);

  useEffect(() => {
    if (totalDuration > 0) {
      const arrivalTime = new Date(Date.now() + totalDuration * 1000);
      setEta(arrivalTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    }
  }, [totalDuration]);

  // Update preview location when step changes
  useEffect(() => {
    if (currentStep?.geometry?.coordinates?.length) {
      // Use the last coordinate of the current step as it usually represents the maneuver point
      // Or first coordinate if it's a point geometry
      const coords = currentStep.geometry.coordinates;
      const point = coords.length > 0 ? coords[coords.length - 1] : coords;
      
      if (Array.isArray(point) && point.length >= 2) {
         // Mapbox uses [lng, lat]
         setPreviewLocation({
           latitude: point[1],
           longitude: point[0]
         });
      }
    }
  }, [currentStep]);

  const formatDistance = (distance: number) => {
    if (distance < 1000) {
      return `${Math.round(distance)}m`;
    }
    return `${(distance / 1000).toFixed(1)}km`;
  };

  const formatDuration = (duration: number) => {
    const minutes = Math.floor(duration / 60);
    if (minutes < 1) {
      return "< 1 min";
    }
    if (minutes < 60) {
      return `${minutes} min`;
    }
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return `${hours}h ${remainingMinutes}m`;
  };

  if (!isNavigating || !currentStep) {
    return null;
  }

  return (
    <>
      <Card className="mx-4 mt-4 shadow-lg border-primary/20">
        <CardContent className="p-4">
          {/* Header with destination and controls */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <MapPin className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium text-muted-foreground truncate max-w-[150px]">
                To {destination}
              </span>
            </div>
            <div className="flex items-center space-x-2">
               {previewLocation && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowPreview(true)}
                  className="h-8 w-8 p-0"
                  title="Preview Intersection"
                >
                  <Eye className="h-4 w-4" />
                </Button>
               )}
               {onToggleTraffic && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onToggleTraffic}
                  className={`h-8 w-8 p-0 ${showTraffic ? 'text-primary bg-primary/10' : ''}`}
                  title="Toggle Traffic"
                >
                  <Layers className="h-4 w-4" />
                </Button>
              )}
             {onShareETA && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onShareETA(eta)}
                className="h-8 w-8 p-0"
                title="Share ETA"
              >
                <Share2 className="h-4 w-4" />
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={onToggleVoice}
              className="h-8 w-8 p-0"
            >
              {isVoiceEnabled ? (
                <Volume2 className="h-4 w-4" />
              ) : (
                <VolumeX className="h-4 w-4" />
              )}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={onStopNavigation}
              className="text-xs"
            >
              Stop
            </Button>
          </div>
        </div>

        {/* Main navigation instruction */}
        <div className="flex items-start space-x-3 mb-4">
          <div className="bg-primary/10 p-2 rounded-lg mt-1">
            <Navigation2 className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1">
            <p className="text-lg font-semibold text-foreground mb-1">
              {currentStep.instruction}
            </p>
            {currentStep.road_name && (
              <p className="text-sm text-muted-foreground">
                on {currentStep.road_name}
              </p>
            )}
            <div className="flex items-center space-x-1 mt-2">
              <Badge variant="secondary" className="text-xs">
                {formatDistance(currentStep.distance)}
              </Badge>
            </div>
          </div>
        </div>

        {/* Trip summary */}
        <div className="flex items-center justify-between text-sm bg-muted/50 rounded-lg p-3">
          <div className="flex items-center space-x-1">
            <Timer className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">
              {formatDuration(totalDuration)}
            </span>
          </div>
          <div className="flex items-center space-x-1">
            <span className="text-muted-foreground">
              {formatDistance(totalDistance)}
            </span>
          </div>
          {eta && (
            <div className="flex items-center space-x-1">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">ETA {eta}</span>
            </div>
          )}
        </div>

        {/* Arrived button for edge cases */}
        {showArrivedButton && onArrived && (
          <div className="mt-4 pt-4 border-t border-muted">
            <div className="text-center">
              <p className="text-xs text-muted-foreground mb-2">
                Used alternative navigation or already arrived?
              </p>
              <Button 
                onClick={onArrived}
                className="bg-green-600 hover:bg-green-700 text-white"
                size="sm"
              >
                I've Arrived
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>

    {previewLocation && (
      <IntersectionPreview
        isOpen={showPreview}
        onClose={() => setShowPreview(false)}
        location={previewLocation}
        instruction={currentStep.instruction}
      />
    )}
    </>
  );
};

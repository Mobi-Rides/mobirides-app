import { useState, useEffect } from "react";
import { Navigation2, Volume2, VolumeX, MapPin, Clock, Timer } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface NavigationStep {
  instruction: string;
  distance: number;
  duration: number;
  maneuver: string;
  road_name?: string;
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
  showArrivedButton = false
}: NavigationInterfaceProps) => {
  const [eta, setEta] = useState<string>("");

  useEffect(() => {
    if (totalDuration > 0) {
      const arrivalTime = new Date(Date.now() + totalDuration * 1000);
      setEta(arrivalTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    }
  }, [totalDuration]);

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
    <Card className="mx-4 mt-4 shadow-lg border-primary/20">
      <CardContent className="p-4">
        {/* Header with destination and controls */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <MapPin className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium text-muted-foreground">
              To {destination}
            </span>
          </div>
          <div className="flex items-center space-x-2">
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
  );
};
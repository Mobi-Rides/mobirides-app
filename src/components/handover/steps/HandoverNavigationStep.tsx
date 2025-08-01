import { useState, useEffect } from "react";
import { MapPin, Navigation, CheckCircle, AlertCircle, Timer, Users, Map } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { NavigationInterface } from "@/components/navigation/NavigationInterface";
import { RouteStepsPanel } from "@/components/navigation/RouteStepsPanel";
import { useUserLocationTracking } from "@/hooks/useUserLocationTracking";
import { navigationService } from "@/services/navigationService";
import { toast } from "@/utils/toast-utils";

interface HandoverNavigationStepProps {
  handoverSessionId: string;
  destinationLocation: {
    latitude: number;
    longitude: number;
    address: string;
  };
  otherUserName: string;
  isHost: boolean;
  onStepComplete: () => void;
  onNavigationStart?: () => void;
}

interface NavigationStep {
  instruction: string;
  distance: number;
  duration: number;
  maneuver: string;
  road_name?: string;
}

export const HandoverNavigationStep = ({
  handoverSessionId,
  destinationLocation,
  otherUserName,
  isHost,
  onStepComplete,
  onNavigationStart
}: HandoverNavigationStepProps) => {
  const { userLocation, getCurrentLocation } = useUserLocationTracking();
  const [isNavigating, setIsNavigating] = useState(false);
  const [hasArrived, setHasArrived] = useState(false);
  const [route, setRoute] = useState<NavigationStep[]>([]);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [totalDistance, setTotalDistance] = useState(0);
  const [totalDuration, setTotalDuration] = useState(0);
  const [isVoiceEnabled, setIsVoiceEnabled] = useState(false);
  const [arrivalRadius] = useState(50);
  const [isServiceReady, setIsServiceReady] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [showManualOptions, setShowManualOptions] = useState(false);

  // Initialize navigation service on component mount
  useEffect(() => {
    const initService = async () => {
      const ready = await navigationService.initialize();
      setIsServiceReady(ready);
    };
    initService();
  }, []);

  // Calculate distance between two points
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = lat1 * Math.PI/180;
    const φ2 = lat2 * Math.PI/180;
    const Δφ = (lat2-lat1) * Math.PI/180;
    const Δλ = (lon2-lon1) * Math.PI/180;

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

    return R * c;
  };

  // Check if user has arrived at destination
  useEffect(() => {
    if (!userLocation || !isNavigating || hasArrived) return;

    const distance = calculateDistance(
      userLocation.latitude,
      userLocation.longitude,
      destinationLocation.latitude,
      destinationLocation.longitude
    );

    if (distance <= arrivalRadius) {
      setHasArrived(true);
      setIsNavigating(false);
      toast.success("You have arrived at the handover location!");
      
      if (isVoiceEnabled && 'speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance("You have arrived at your destination");
        speechSynthesis.speak(utterance);
      }
    }
  }, [userLocation, destinationLocation, isNavigating, hasArrived, arrivalRadius, isVoiceEnabled]);

  // Updated fetchRoute with better error handling
  const fetchRoute = async () => {
    let currentLocation = userLocation;
    
    if (!currentLocation) {
      try {
        currentLocation = await getCurrentLocation();
        setLocationError(null);
      } catch (error) {
        setLocationError("Unable to access your location. Please check your GPS settings.");
        setShowManualOptions(true);
        return false;
      }
    }

    if (!isServiceReady) {
      setLocationError("Navigation service is not available.");
      setShowManualOptions(true);
      return false;
    }

    try {
      const routeData = await navigationService.getRoute({
        origin: currentLocation,
        destination: destinationLocation
      });

      if (routeData) {
        setTotalDistance(routeData.distance);
        setTotalDuration(routeData.duration);
        setRoute(routeData.steps);
        return true;
      } else {
        throw new Error("No route found");
      }
    } catch (error) {
      console.error("Error fetching route:", error);
      setLocationError("Unable to calculate route.");
      setShowManualOptions(true);
      return false;
    }
  };

  const startNavigation = async () => {
    const routeFetched = await fetchRoute();
    if (routeFetched) {
      setIsNavigating(true);
      setCurrentStepIndex(0);
      onNavigationStart?.();
      toast.success("Navigation started");
    }
  };

  // New function for manual arrival
  const handleSkipNavigation = () => {
    setHasArrived(true);
    toast.success("You've arrived at the handover location!");
  };

  const stopNavigation = () => {
    setIsNavigating(false);
    setCurrentStepIndex(0);
    toast.info("Navigation stopped");
  };

  const toggleVoice = () => {
    setIsVoiceEnabled(!isVoiceEnabled);
    toast.info(isVoiceEnabled ? "Voice guidance disabled" : "Voice guidance enabled");
  };

  const handleConfirmArrival = () => {
    onStepComplete();
    toast.success("Ready to begin handover process");
  };

  const handleManualArrival = () => {
    setHasArrived(true);
    setIsNavigating(false);
    toast.success("Marked as arrived - ready for handover!");
  };

  const currentStep = route[currentStepIndex] || null;
  const progressPercentage = hasArrived ? 100 : (currentStepIndex / Math.max(route.length - 1, 1)) * 100;

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Navigation className="h-5 w-5" />
            Navigate to Handover Location
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Destination Info - unchanged */}
          
          {/* Enhanced Navigation Controls */}
          {!isNavigating && !hasArrived && (
            <div className="space-y-3">
              <Button 
                onClick={startNavigation}
                size="lg"
                className="w-full"
                disabled={!isServiceReady}
              >
                <Navigation className="h-4 w-4 mr-2" />
                Start Navigation
              </Button>
              
              {/* Manual arrival option */}
              <Button 
                onClick={() => setShowManualOptions(true)}
                variant="outline"
                size="lg"
                className="w-full"
              >
                <Map className="h-4 w-4 mr-2" />
                I've Already Arrived
              </Button>
              
              {!isServiceReady && (
                <p className="text-sm text-muted-foreground">
                  <AlertCircle className="h-4 w-4 inline mr-1" />
                  Loading navigation service...
                </p>
              )}
            </div>
          )}

          {/* Location Error Alert */}
          {locationError && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
                <div className="flex-1">
                  <h4 className="text-sm font-medium text-yellow-800">Location Access Issue</h4>
                  <p className="text-sm text-yellow-700 mt-1">
                    {locationError}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Manual Confirmation Options */}
          {showManualOptions && !hasArrived && (
            <div className="space-y-3">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="text-sm font-medium text-blue-800 mb-2">
                  Alternative Options
                </h4>
                <p className="text-sm text-blue-700 mb-3">
                  If you're unable to use GPS navigation, you can still proceed:
                </p>
                <div className="space-y-2">
                  <Button 
                    onClick={handleSkipNavigation}
                    size="lg"
                    className="w-full"
                    variant="default"
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    I've Arrived at Location
                  </Button>
                  <Button 
                    onClick={() => {
                      setShowManualOptions(false);
                      setLocationError(null);
                    }}
                    size="sm"
                    variant="ghost"
                    className="w-full"
                  >
                    Try Navigation Again
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Progress Indicator */}
          {(isNavigating || hasArrived) && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-1">
                  <Timer className="h-4 w-4" />
                  Navigation Progress
                </span>
                <span>{Math.round(progressPercentage)}%</span>
              </div>
              <Progress value={progressPercentage} className="h-2" />
            </div>
          )}

          {/* Arrival Confirmation */}
          {hasArrived && (
            <div className="text-center space-y-3">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <CheckCircle className="h-8 w-8 text-green-600 mx-auto mb-2" />
                <p className="text-green-800 font-medium">
                  You've arrived at the handover location!
                </p>
                <p className="text-green-700 text-sm mt-1">
                  {isHost ? "Wait for the renter to arrive" : "Look for the host and their vehicle"}
                </p>
              </div>
              <Button 
                onClick={handleConfirmArrival}
                size="lg"
                className="w-full"
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                I'm Ready for Handover
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Navigation Interface */}
      {isNavigating && currentStep && (
        <NavigationInterface
          currentStep={currentStep}
          totalDistance={totalDistance}
          totalDuration={totalDuration}
          isNavigating={isNavigating}
          onToggleVoice={toggleVoice}
          isVoiceEnabled={isVoiceEnabled}
          onStopNavigation={stopNavigation}
          onArrived={handleManualArrival}
          destination={destinationLocation.address}
          showArrivedButton={true}
        />
      )}

      {/* Route Steps Panel */}
      {isNavigating && route.length > 0 && (
        <RouteStepsPanel
          steps={route}
          currentStepIndex={currentStepIndex}
          onStepClick={(index) => setCurrentStepIndex(index)}
        />
      )}
    </div>
  );
};
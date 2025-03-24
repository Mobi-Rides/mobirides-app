// src/components/handover/HandoverSheet.tsx
import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MapPin, Check, Clock, Car, AlertTriangle, X } from "lucide-react";
import { useHandover } from "@/contexts/HandoverContext";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { toast } from "@/utils/toast-utils";
import { supabase } from "@/integrations/supabase/client";

interface HandoverSheetProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HandoverSheet = ({ isOpen, onClose }: HandoverSheetProps) => {
  const {
    handoverStatus,
    isLoading,
    isHost,
    markReady,
    completeHandoverProcess,
    bookingDetails,
    debugMode,
    toggleDebugMode,
  } = useHandover();

  const [handoverStep, setHandoverStep] = useState(1);
  const [isProcessing, setIsProcessing] = useState(false);

  // Determine current step based on handover status
  useEffect(() => {
    if (!handoverStatus) return;

    if (handoverStatus.handover_completed) {
      setHandoverStep(4); // Completed
    } else if (handoverStatus.host_ready && handoverStatus.renter_ready) {
      setHandoverStep(3); // Both ready
    } else if (handoverStatus.host_ready || handoverStatus.renter_ready) {
      setHandoverStep(2); // One party ready
    } else {
      setHandoverStep(1); // Initial state
    }
  }, [handoverStatus]);

  // Handle marking user as ready
  const handleMarkReady = async () => {
    setIsProcessing(true);
    try {
      const success = await markReady();
      if (success) {
        toast.success("You're marked as ready for handover");
      }
    } catch (error) {
      console.error("Error marking ready:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle completing handover
  const handleCompleteHandover = async () => {
    setIsProcessing(true);
    try {
      const success = await completeHandoverProcess();
      if (success) {
        toast.success("Car handover completed successfully!");
        onClose();
      }
    } catch (error) {
      console.error("Error completing handover:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  // Calculate distance between host and renter if both locations exist
  const calculateDistance = () => {
    if (!handoverStatus?.host_location || !handoverStatus?.renter_location) {
      return null;
    }

    const R = 6371e3; // Earth radius in meters
    const φ1 = (handoverStatus.host_location.latitude * Math.PI) / 180;
    const φ2 = (handoverStatus.renter_location.latitude * Math.PI) / 180;
    const Δφ =
      ((handoverStatus.renter_location.latitude -
        handoverStatus.host_location.latitude) *
        Math.PI) /
      180;
    const Δλ =
      ((handoverStatus.renter_location.longitude -
        handoverStatus.host_location.longitude) *
        Math.PI) /
      180;

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;

    return distance; // Distance in meters
  };

  const distance = calculateDistance();
  const isNearby = distance !== null && distance < 100; // Within 100 meters

  // Get profile information based on role
  const getCounterpartyInfo = () => {
    if (isHost) {
      return {
        name: bookingDetails?.renter?.full_name || "Renter",
        avatar: bookingDetails?.renter?.avatar_url
          ? supabase.storage
              .from("avatars")
              .getPublicUrl(bookingDetails.renter.avatar_url).data.publicUrl
          : "/placeholder.svg",
        isReady: handoverStatus?.renter_ready || false,
        isSharing: !!handoverStatus?.renter_location,
      };
    } else {
      return {
        name: bookingDetails?.car?.owner?.full_name || "Host",
        avatar: bookingDetails?.car?.owner?.avatar_url
          ? supabase.storage
              .from("avatars")
              .getPublicUrl(bookingDetails.car.owner.avatar_url).data.publicUrl
          : "/placeholder.svg",
        isReady: handoverStatus?.host_ready || false,
        isSharing: !!handoverStatus?.host_location,
      };
    }
  };

  const counterparty = getCounterpartyInfo();
  const userReady = isHost
    ? handoverStatus?.host_ready
    : handoverStatus?.renter_ready;

  if (isLoading) {
    return (
      <div
        className="fixed inset-0 z-[9999] pointer-events-none"
        style={{ display: isOpen ? "block" : "none" }}
      >
        <div
          className="absolute inset-0 bg-black/50 pointer-events-auto"
          onClick={onClose}
        />
        <div className="absolute bottom-0 left-0 right-0 h-[85vh] bg-background rounded-t-xl shadow-lg overflow-y-auto pointer-events-auto">
          <div className="p-6">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-semibold">Car Handover</h2>
              <button
                onClick={onClose}
                className="rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none"
              >
                <X className="h-4 w-4" />
                <span className="sr-only">Close</span>
              </button>
            </div>
            <div className="flex items-center justify-center h-full mt-6">
              <div className="animate-pulse space-y-4 w-full">
                <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mx-auto"></div>
                <div className="h-32 bg-gray-200 dark:bg-gray-700 rounded"></div>
                <div className="h-32 bg-gray-200 dark:bg-gray-700 rounded"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="fixed inset-0 z-[9999] pointer-events-none"
      style={{ display: isOpen ? "block" : "none" }}
    >
      <div
        className="absolute inset-0 bg-black/50 pointer-events-auto"
        onClick={onClose}
      />
      <div className="absolute bottom-0 left-0 right-0 h-[85vh] bg-background rounded-t-xl shadow-lg overflow-y-auto pointer-events-auto">
        <div className="p-6">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold">Car Handover</h2>
            <button
              onClick={onClose}
              className="rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none"
            >
              <X className="h-4 w-4" />
              <span className="sr-only">Close</span>
            </button>
          </div>

          {/* Handover Progress */}
          <div className="mt-6">
            <Progress value={handoverStep * 25} className="h-2" />
            <div className="flex justify-between mt-2 text-xs text-muted-foreground">
              <span>Start</span>
              <span>Ready</span>
              <span>Verify</span>
              <span>Complete</span>
            </div>
          </div>

          {/* Counterparty Information */}
          <Card className="mt-6">
            <CardContent className="pt-6">
              <div className="flex items-center space-x-4">
                <img
                  src={counterparty.avatar}
                  alt={counterparty.name}
                  className="w-12 h-12 rounded-full object-cover"
                />
                <div>
                  <h3 className="font-medium">{counterparty.name}</h3>
                  <div className="flex space-x-2 mt-1">
                    <Badge
                      variant={counterparty.isSharing ? "default" : "secondary"}
                    >
                      {counterparty.isSharing
                        ? "Sharing Location"
                        : "Not Sharing Location"}
                    </Badge>

                    <Badge
                      variant={counterparty.isReady ? "success" : "outline"}
                    >
                      {counterparty.isReady ? "Ready" : "Not Ready"}
                    </Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Car Information */}
          <Card className="mt-4">
            <CardContent className="pt-6">
              <div className="flex items-start space-x-3">
                <Car className="h-5 w-5 text-primary mt-1" />
                <div>
                  <h4 className="font-medium">Vehicle</h4>
                  <p className="text-sm mt-1">
                    {bookingDetails?.car?.brand} {bookingDetails?.car?.model}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {bookingDetails?.car?.year} • {bookingDetails?.car?.color}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Location Status */}
          <Card className="mt-4">
            <CardContent className="pt-6">
              <div className="flex items-start space-x-3">
                <MapPin className="h-5 w-5 text-primary mt-1" />
                <div>
                  <h4 className="font-medium">Location Status</h4>
                  {distance !== null ? (
                    <>
                      <p className="text-sm mt-1">
                        Distance:{" "}
                        {distance < 1000
                          ? `${Math.round(distance)} meters`
                          : `${(distance / 1000).toFixed(1)} km`}
                      </p>
                      {isNearby ? (
                        <Badge variant="success" className="mt-1">
                          You are nearby!
                        </Badge>
                      ) : (
                        <p className="text-xs text-muted-foreground mt-1">
                          Keep moving closer to complete handover
                        </p>
                      )}
                    </>
                  ) : (
                    <p className="text-sm text-muted-foreground mt-1">
                      Waiting for both parties to share location
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Handover Steps */}
          <Card className="mt-4">
            <CardContent className="pt-6 space-y-4">
              <h4 className="font-medium">Handover Steps</h4>

              <div className="flex items-start space-x-3">
                <div
                  className={`rounded-full p-1 ${
                    handoverStep >= 1 ? "bg-primary/20" : "bg-muted"
                  }`}
                >
                  <Clock
                    className={`h-4 w-4 ${
                      handoverStep >= 1
                        ? "text-primary"
                        : "text-muted-foreground"
                    }`}
                  />
                </div>
                <div>
                  <p className="text-sm font-medium">Share your location</p>
                  <p className="text-xs text-muted-foreground">
                    Enable location sharing to find each other
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <div
                  className={`rounded-full p-1 ${
                    handoverStep >= 2 ? "bg-primary/20" : "bg-muted"
                  }`}
                >
                  <MapPin
                    className={`h-4 w-4 ${
                      handoverStep >= 2
                        ? "text-primary"
                        : "text-muted-foreground"
                    }`}
                  />
                </div>
                <div>
                  <p className="text-sm font-medium">Mark yourself as ready</p>
                  <p className="text-xs text-muted-foreground">
                    Indicate that you're ready for the handover
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <div
                  className={`rounded-full p-1 ${
                    handoverStep >= 3 ? "bg-primary/20" : "bg-muted"
                  }`}
                >
                  <AlertTriangle
                    className={`h-4 w-4 ${
                      handoverStep >= 3
                        ? "text-primary"
                        : "text-muted-foreground"
                    }`}
                  />
                </div>
                <div>
                  <p className="text-sm font-medium">Verify details</p>
                  <p className="text-xs text-muted-foreground">
                    {isHost
                      ? "Verify renter's identity and review rental terms"
                      : "Verify car condition and review rental terms"}
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <div
                  className={`rounded-full p-1 ${
                    handoverStep >= 4 ? "bg-primary/20" : "bg-muted"
                  }`}
                >
                  <Check
                    className={`h-4 w-4 ${
                      handoverStep >= 4
                        ? "text-primary"
                        : "text-muted-foreground"
                    }`}
                  />
                </div>
                <div>
                  <p className="text-sm font-medium">Complete handover</p>
                  <p className="text-xs text-muted-foreground">
                    {isHost
                      ? "Hand over the keys and confirm completion"
                      : "Receive the keys and confirm completion"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="mt-6 space-y-3">
            {!userReady && handoverStep < 2 && (
              <Button
                className="w-full"
                onClick={handleMarkReady}
                disabled={isProcessing}
              >
                Mark as Ready
              </Button>
            )}

            {handoverStep === 3 && (
              <Button
                className="w-full"
                onClick={handleCompleteHandover}
                disabled={isProcessing || !isNearby}
              >
                {isHost ? "Confirm Car Handover" : "Confirm Receipt of Car"}
              </Button>
            )}

            {handoverStep === 4 && (
              <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <Check className="h-6 w-6 text-green-500 mx-auto mb-2" />
                <p className="font-medium text-green-700 dark:text-green-300">
                  Handover Completed!
                </p>
                <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                  {isHost
                    ? "The car has been successfully handed over to the renter."
                    : "You have successfully received the car."}
                </p>
              </div>
            )}

            {/* Debug button */}
            <Button
              variant="outline"
              size="sm"
              className="w-full mt-4"
              onClick={toggleDebugMode}
            >
              {debugMode ? "Hide Debug Info" : "Show Debug Info"}
            </Button>

            {/* Debug information panel */}
            {debugMode && (
              <Card className="mt-4 bg-slate-100 dark:bg-slate-900">
                <CardContent className="pt-6">
                  <h4 className="font-medium text-sm">Debug Information</h4>
                  <div className="mt-2 text-xs space-y-1 font-mono">
                    <p>Handover ID: {handoverStatus?.id || "Not available"}</p>
                    <p>Host ID: {handoverStatus?.host_id || "Not available"}</p>
                    <p>
                      Renter ID: {handoverStatus?.renter_id || "Not available"}
                    </p>
                    <p>
                      Host Location:{" "}
                      {handoverStatus?.host_location
                        ? "Available"
                        : "Not available"}
                    </p>
                    <p>
                      Renter Location:{" "}
                      {handoverStatus?.renter_location
                        ? "Available"
                        : "Not available"}
                    </p>
                    <p>
                      Host Ready: {handoverStatus?.host_ready ? "Yes" : "No"}
                    </p>
                    <p>
                      Renter Ready:{" "}
                      {handoverStatus?.renter_ready ? "Yes" : "No"}
                    </p>
                    <p>
                      Status:{" "}
                      {handoverStatus?.handover_completed
                        ? "Completed"
                        : handoverStatus?.host_ready && handoverStatus?.renter_ready
                        ? "Ready for handover"
                        : "Waiting for participants"}
                    </p>
                    <p>
                      Last Updated: {handoverStatus?.updated_at || "Unknown"}
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

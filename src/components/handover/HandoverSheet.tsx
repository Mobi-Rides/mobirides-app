// src/components/handover/HandoverSheet.tsx
import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MapPin, Check, Car, X } from "lucide-react";
import { useHandover } from "@/contexts/HandoverContext";
import { Progress } from "@/components/ui/progress";
import { toast } from "@/utils/toast-utils";

interface HandoverSheetProps {
  isOpen: boolean;
  onClose: () => void;
  getDestination?: (latitude: number, longitude: number) => void;
}

export const HandoverSheet = ({
  isOpen,
  onClose,
  getDestination,
}: HandoverSheetProps) => {
  const { isLoading, isHost, bookingDetails, destination } = useHandover();

  const [handoverStep, setHandoverStep] = useState(1);

  // Set destination for external use
  useEffect(() => {
    if (destination) {
      const { latitude, longitude } = destination;
      getDestination?.(latitude, longitude);
    }
  }, [getDestination, destination]);

  // Handle completing handover
  const handleCompleteHandover = () => {
    toast.success("Handover process completed successfully!");
    onClose();
  };

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
            <Progress value={handoverStep * 50} className="h-2" />
            <div className="flex justify-between mt-2 text-xs text-muted-foreground">
              <span>Start</span>
              <span>Complete</span>
            </div>
          </div>

          {/* Renter and Destination Information */}
          <Card className="mt-6">
            <CardContent className="pt-6">
              <div className="flex items-start space-x-3">
                <MapPin className="h-5 w-5 text-primary mt-1" />
                <div>
                  <h4 className="font-medium">Destination</h4>
                  {destination ? (
                    <p className="text-sm mt-1">
                      Latitude: {destination.latitude}, Longitude:{" "}
                      {destination.longitude}
                    </p>
                  ) : (
                    <p className="text-sm text-muted-foreground mt-1">
                      Destination not available
                    </p>
                  )}
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

          {/* Action Buttons */}
          <div className="mt-6 space-y-3">
            {handoverStep === 1 && (
              <Button className="w-full" onClick={() => setHandoverStep(2)}>
                Proceed to Handover
              </Button>
            )}

            {handoverStep === 2 && (
              <Button className="w-full" onClick={handleCompleteHandover}>
                Complete Handover
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

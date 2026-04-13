import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MapPin, Navigation, Loader2 } from "lucide-react";

interface ConfirmAndEnRouteStepProps {
  locationData: {
    latitude: number;
    longitude: number;
    address: string;
  };
  onConfirm: () => void;
  isSubmitting: boolean;
}

export const ConfirmAndEnRouteStep: React.FC<ConfirmAndEnRouteStepProps> = ({
  locationData,
  onConfirm,
  isSubmitting,
}) => {
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Navigation className="h-5 w-5 text-primary" />
          Confirm & Head Out
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Review the handover location and confirm you're on your way.
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Location card */}
        <div className="bg-muted/50 p-4 rounded-lg border space-y-3">
          <div className="flex items-start gap-3">
            <div className="bg-primary/10 p-2 rounded-full mt-0.5">
              <MapPin className="h-4 w-4 text-primary" />
            </div>
            <div>
              <p className="text-sm font-semibold">{locationData.address}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {locationData.latitude.toFixed(6)}, {locationData.longitude.toFixed(6)}
              </p>
            </div>
          </div>

          <div className="w-full h-32 bg-muted rounded-md flex items-center justify-center text-xs text-muted-foreground border">
            Map Preview Area
          </div>
        </div>

        {/* En-route prompt */}
        <div className="bg-primary/5 p-4 rounded-xl border border-primary/20 flex flex-col items-center text-center space-y-3">
          <div className="bg-primary/10 p-3 rounded-full">
            <Navigation className="h-6 w-6 text-primary animate-pulse" />
          </div>
          <p className="text-sm text-muted-foreground">
            By tapping below you confirm the location and that you're heading there now.
          </p>
        </div>

        <Button
          className="w-full h-12 text-lg"
          onClick={onConfirm}
          disabled={isSubmitting}
        >
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          <Navigation className="mr-2 h-5 w-5" />
          Confirm & I'm On My Way
        </Button>
      </CardContent>
    </Card>
  );
};

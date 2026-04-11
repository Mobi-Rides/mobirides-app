
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MapPin, Check, X, Loader2 } from "lucide-react";

interface LocationConfirmationStepProps {
  locationData: {
    latitude: number;
    longitude: number;
    address: string;
  };
  onConfirm: () => void;
  onReject: () => void;
  isSubmitting: boolean;
}

export const LocationConfirmationStep: React.FC<LocationConfirmationStepProps> = ({
  locationData,
  onConfirm,
  onReject,
  isSubmitting
}) => {
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="h-5 w-5 text-primary" />
          Confirm Handover Location
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          The host has proposed this location for the handover.
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
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
          
          {/* Placeholder for a small static map or link to open in maps */}
          <div className="w-full h-32 bg-muted rounded-md flex items-center justify-center text-xs text-muted-foreground border">
            Map Preview Area
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <Button 
            className="w-full h-12 text-lg" 
            onClick={onConfirm}
            disabled={isSubmitting}
          >
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            <Check className="mr-2 h-5 w-5" />
            Accept Location
          </Button>
          <Button 
            variant="outline" 
            className="w-full" 
            onClick={onReject}
            disabled={isSubmitting}
          >
            <X className="mr-2 h-4 w-4" />
            Suggest Different Location
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

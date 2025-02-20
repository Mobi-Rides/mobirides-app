
import { useState, useEffect } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, User, Car } from "lucide-react";

interface HandoverSheetProps {
  isOpen: boolean;
  onClose: () => void;
  bookingDetails: {
    renterName: string;
    renterAvatar: string;
    startLocation: {
      address: string;
      coordinates: { lat: number; lng: number; }
    };
    destination: {
      address: string;
      coordinates: { lat: number; lng: number; }
    };
  };
  isRenterSharingLocation: boolean;
}

export const HandoverSheet = ({ 
  isOpen, 
  onClose, 
  bookingDetails,
  isRenterSharingLocation 
}: HandoverSheetProps) => {
  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent 
        side="bottom" 
        className="h-[85vh] z-10"
      >
        <SheetHeader>
          <SheetTitle>Car Handover Details</SheetTitle>
        </SheetHeader>
        
        {/* Renter Information */}
        <Card className="mt-4">
          <CardContent className="pt-6">
            <div className="flex items-center space-x-4">
              <img 
                src={bookingDetails.renterAvatar} 
                alt={bookingDetails.renterName}
                className="w-12 h-12 rounded-full object-cover"
              />
              <div>
                <h3 className="font-medium">{bookingDetails.renterName}</h3>
                <Badge 
                  variant={isRenterSharingLocation ? "default" : "secondary"}
                  className="mt-1"
                >
                  {isRenterSharingLocation ? "Sharing Location" : "Not Sharing Location"}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Location Details */}
        <div className="space-y-4 mt-6">
          {/* Start Location */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-start space-x-3">
                <MapPin className="h-5 w-5 text-primary mt-1" />
                <div>
                  <h4 className="font-medium">Pickup Location</h4>
                  <p className="text-sm text-muted-foreground mt-1">
                    {bookingDetails.startLocation.address}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Destination */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-start space-x-3">
                <MapPin className="h-5 w-5 text-destructive mt-1" />
                <div>
                  <h4 className="font-medium">Destination</h4>
                  <p className="text-sm text-muted-foreground mt-1">
                    {bookingDetails.destination.address}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </SheetContent>
    </Sheet>
  );
};

import React, { useState, useEffect } from "react";
import { format, parseISO } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { AlertCircle, Clock, MapPin, Edit3 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { BookingModificationService } from "@/services/bookingModificationService";
import { ModificationRequestData, ModificationType } from "@/types/modification";
import { Booking } from "@/types/booking";

interface ModificationRequestDialogProps {
  isOpen: boolean;
  onClose: () => void;
  booking: Booking;
  onModificationRequested: () => void;
}

export const ModificationRequestDialog = ({
  isOpen,
  onClose,
  booking,
  onModificationRequested,
}: ModificationRequestDialogProps) => {
  const [modificationType, setModificationType] = useState<ModificationType>(ModificationType.TIME_CHANGE);
  const [newStartTime, setNewStartTime] = useState("");
  const [newEndTime, setNewEndTime] = useState("");
  const [newLocation, setNewLocation] = useState({
    address: "",
    latitude: 0,
    longitude: 0
  });
  const [reason, setReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reset form when dialog opens
  useEffect(() => {
    if (isOpen) {
      setModificationType(ModificationType.TIME_CHANGE);
      setNewStartTime(booking.start_time || "");
      setNewEndTime(booking.end_time || "");
      setNewLocation({
        address: "",
        latitude: booking.pickup_latitude || 0,
        longitude: booking.pickup_longitude || 0
      });
      setReason("");
      setError(null);
    }
  }, [isOpen, booking]);

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setError(null);

    try {
      const modificationData: ModificationRequestData = {
        modificationType,
        reason: reason.trim() || undefined,
      };

      // Add time data if needed
      if (modificationType === ModificationType.TIME_CHANGE || modificationType === ModificationType.BOTH) {
        if (newStartTime !== booking.start_time) {
          modificationData.newStartTime = newStartTime;
        }
        if (newEndTime !== booking.end_time) {
          modificationData.newEndTime = newEndTime;
        }
      }

      // Add location data if needed
      if (modificationType === ModificationType.LOCATION_CHANGE || modificationType === ModificationType.BOTH) {
        if (newLocation.address.trim()) {
          modificationData.newLocation = {
            latitude: newLocation.latitude,
            longitude: newLocation.longitude,
            address: newLocation.address.trim()
          };
        } else {
          throw new Error("Please provide a new pickup location");
        }
      }

      await BookingModificationService.requestModification(booking.id, modificationData);
      onModificationRequested();
      onClose();
      resetForm();
    } catch (error) {
      console.error("Error submitting modification request:", error);
      setError(error instanceof Error ? error.message : "Failed to submit modification request");
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setModificationType(ModificationType.TIME_CHANGE);
    setNewStartTime("");
    setNewEndTime("");
    setNewLocation({ address: "", latitude: 0, longitude: 0 });
    setReason("");
    setError(null);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const generateTimeOptions = () => {
    const options = [];
    for (let hour = 6; hour <= 22; hour++) {
      const time = `${hour.toString().padStart(2, '0')}:00`;
      options.push(
        <option key={time} value={time}>
          {format(new Date(`2000-01-01T${time}`), 'h:mm a')}
        </option>
      );
    }
    return options;
  };

  const isTimeChangeValid = () => {
    if (modificationType === ModificationType.LOCATION_CHANGE) return true;
    
    const currentStart = booking.start_time || "09:00";
    const currentEnd = booking.end_time || "17:00";
    
    return newStartTime !== currentStart || newEndTime !== currentEnd;
  };

  const isLocationChangeValid = () => {
    if (modificationType === ModificationType.TIME_CHANGE) return true;
    
    return newLocation.address.trim().length > 0;
  };

  const canSubmit = () => {
    if (modificationType === ModificationType.TIME_CHANGE) {
      return isTimeChangeValid();
    } else if (modificationType === ModificationType.LOCATION_CHANGE) {
      return isLocationChangeValid();
    } else { // BOTH
      return isTimeChangeValid() || isLocationChangeValid();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Edit3 className="h-5 w-5" />
            Modify Booking
          </DialogTitle>
          <DialogDescription>
            Request changes to your booking for {booking.cars.brand} {booking.cars.model}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Current Booking Info */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="font-medium mb-2">Current Booking Details</h4>
            <div className="text-sm text-gray-600 space-y-1">
              <p>Date: {format(parseISO(booking.start_date), "PPP")}</p>
              <p>Time: {format(new Date(`2000-01-01T${booking.start_time || "09:00"}`), 'h:mm a')} - {format(new Date(`2000-01-01T${booking.end_time || "17:00"}`), 'h:mm a')}</p>
              {(booking.pickup_latitude && booking.pickup_longitude) && (
                <p>Pickup: {booking.pickup_latitude?.toFixed(6)}, {booking.pickup_longitude?.toFixed(6)}</p>
              )}
            </div>
          </div>

          {/* Modification Type Selection */}
          <div className="space-y-3">
            <Label>What would you like to change?</Label>
            <RadioGroup value={modificationType} onValueChange={(value) => setModificationType(value as ModificationType)}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value={ModificationType.TIME_CHANGE} id="time" />
                <Label htmlFor="time" className="flex items-center gap-2 cursor-pointer">
                  <Clock className="h-4 w-4" />
                  Pickup/Return Time
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value={ModificationType.LOCATION_CHANGE} id="location" />
                <Label htmlFor="location" className="flex items-center gap-2 cursor-pointer">
                  <MapPin className="h-4 w-4" />
                  Pickup Location
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value={ModificationType.BOTH} id="both" />
                <Label htmlFor="both" className="flex items-center gap-2 cursor-pointer">
                  <Edit3 className="h-4 w-4" />
                  Both Time and Location
                </Label>
              </div>
            </RadioGroup>
          </div>

          <Separator />

          {/* Time Change Section */}
          {(modificationType === ModificationType.TIME_CHANGE || modificationType === ModificationType.BOTH) && (
            <div className="space-y-3">
              <h4 className="font-medium flex items-center gap-2">
                <Clock className="h-4 w-4" />
                New Times
              </h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="start-time">Pickup Time</Label>
                  <select
                    id="start-time"
                    value={newStartTime}
                    onChange={(e) => setNewStartTime(e.target.value)}
                    className="w-full p-2 border rounded-md"
                  >
                    {generateTimeOptions()}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="end-time">Return Time</Label>
                  <select
                    id="end-time"
                    value={newEndTime}
                    onChange={(e) => setNewEndTime(e.target.value)}
                    className="w-full p-2 border rounded-md"
                  >
                    {generateTimeOptions()}
                  </select>
                </div>
              </div>
              <p className="text-xs text-gray-500">
                Available times: 6:00 AM - 10:00 PM • Minimum 2 hours • Maximum 12 hours per day
              </p>
            </div>
          )}

          {/* Location Change Section */}
          {(modificationType === ModificationType.LOCATION_CHANGE || modificationType === ModificationType.BOTH) && (
            <div className="space-y-3">
              <h4 className="font-medium flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                New Pickup Location
              </h4>
              <div className="space-y-2">
                <Label htmlFor="location-address">Address</Label>
                <Input
                  id="location-address"
                  placeholder="Enter new pickup address..."
                  value={newLocation.address}
                  onChange={(e) => setNewLocation(prev => ({ ...prev, address: e.target.value }))}
                />
                <p className="text-xs text-gray-500">
                  Maximum 50km from original location. Please provide a detailed address.
                </p>
              </div>
            </div>
          )}

          {/* Error Display */}
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Reason */}
          <div className="space-y-2">
            <Label htmlFor="reason">Reason for Modification (Optional)</Label>
            <Textarea
              id="reason"
              placeholder="Explain why you need to make this change..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="min-h-[80px]"
              maxLength={500}
            />
            <p className="text-xs text-gray-500">{reason.length}/500 characters</p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!canSubmit() || isSubmitting}
            className="min-w-[140px]"
          >
            {isSubmitting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Submitting...
              </>
            ) : (
              "Request Modification"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}; 
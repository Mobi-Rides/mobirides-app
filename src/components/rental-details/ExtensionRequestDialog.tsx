import React, { useState, useEffect, useCallback } from "react";
import { format, addDays, parseISO } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { AlertCircle, Calculator, Clock } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { RentalExtensionService } from "@/services/rentalExtensionService";
import { ExtensionCalculation, ExtensionRequestData } from "@/types/extension";
import { Booking } from "@/types/booking";

interface ExtensionRequestDialogProps {
  isOpen: boolean;
  onClose: () => void;
  booking: Booking;
  onExtensionRequested: () => void;
}

export const ExtensionRequestDialog = ({
  isOpen,
  onClose,
  booking,
  onExtensionRequested,
}: ExtensionRequestDialogProps) => {
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [reason, setReason] = useState("");
  const [calculation, setCalculation] = useState<ExtensionCalculation | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const currentEndDate = parseISO(booking.end_date);
  const minDate = addDays(currentEndDate, 1);
  const maxDate = addDays(currentEndDate, 30); // Max 30 days extension

  const calculateExtension = useCallback(async () => {
    if (!selectedDate) return;

    setIsCalculating(true);
    setError(null);

    try {
      const calc = await RentalExtensionService.calculateExtension(
        booking.id,
        selectedDate
      );
      setCalculation(calc);

      if (!calc.available) {
        setError("The car is not available for the selected extension period. Please choose different dates.");
      }
    } catch (error) {
      console.error("Error calculating extension:", error);
      setError("Failed to calculate extension cost. Please try again.");
      setCalculation(null);
    } finally {
      setIsCalculating(false);
    }
  }, [selectedDate, booking.id]);

  // Calculate extension cost when date changes
  useEffect(() => {
    if (selectedDate && isOpen) {
      calculateExtension();
    }
  }, [selectedDate, isOpen, calculateExtension]);

  const handleSubmit = async () => {
    if (!selectedDate || !calculation || !calculation.available) {
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const extensionData: ExtensionRequestData = {
        newEndDate: selectedDate,
        reason: reason.trim() || undefined,
      };

      await RentalExtensionService.requestExtension(booking.id, extensionData);
      onExtensionRequested();
      onClose();
      resetForm();
    } catch (error) {
      console.error("Error submitting extension request:", error);
      setError(error instanceof Error ? error.message : "Failed to submit extension request");
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setSelectedDate(undefined);
    setReason("");
    setCalculation(null);
    setError(null);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Extend Rental Period
          </DialogTitle>
          <DialogDescription>
            Request to extend your rental of {booking.cars.brand} {booking.cars.model}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Current Rental Info */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="font-medium mb-2">Current Rental</h4>
            <div className="text-sm text-gray-600 space-y-1">
              <p>Current End Date: {format(currentEndDate, "PPP")}</p>
              <p>Price per Day: P{booking.cars.price_per_day.toFixed(2)}</p>
            </div>
          </div>

          {/* Date Selection */}
          <div className="space-y-2">
            <Label htmlFor="extension-date">Select New End Date</Label>
            <div className="flex justify-center">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={setSelectedDate}
                disabled={(date) => date < minDate || date > maxDate}
                className="rounded-md border"
              />
            </div>
            <p className="text-xs text-gray-500 text-center">
              You can extend up to 30 days from your current end date
            </p>
          </div>

          {/* Cost Calculation */}
          {selectedDate && (
            <div className="space-y-3">
              <Separator />
              <div className="flex items-center gap-2">
                <Calculator className="h-4 w-4" />
                <h4 className="font-medium">Extension Cost</h4>
              </div>

              {isCalculating ? (
                <div className="flex items-center justify-center p-4">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                  <span className="ml-2 text-sm">Calculating...</span>
                </div>
              ) : calculation ? (
                <div className="bg-blue-50 p-4 rounded-lg space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Additional Days:</span>
                    <span className="font-medium">{calculation.additionalDays} days</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Price per Day:</span>
                    <span>P{calculation.pricePerDay.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Additional Cost:</span>
                    <span className="font-medium">P{calculation.additionalCost.toFixed(2)}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between font-medium">
                    <span>New Total Cost:</span>
                    <span className="text-lg">P{calculation.totalNewCost.toFixed(2)}</span>
                  </div>
                </div>
              ) : null}
            </div>
          )}

          {/* Error Display */}
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Reason (Optional) */}
          <div className="space-y-2">
            <Label htmlFor="reason">Reason for Extension (Optional)</Label>
            <Textarea
              id="reason"
              placeholder="Tell the host why you need to extend your rental..."
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
            disabled={
              !selectedDate ||
              !calculation ||
              !calculation.available ||
              isCalculating ||
              isSubmitting
            }
            className="min-w-[120px]"
          >
            {isSubmitting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Submitting...
              </>
            ) : (
              "Request Extension"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}; 
import { useState, useMemo, useEffect } from "react";
import { format, addDays, addMonths } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarIcon, MapPin, Navigation, Globe, Info, Locate } from "lucide-react";
import { cn } from "@/lib/utils";
import { Car } from "@/types/car";
import { DestinationType } from "@/types/booking";
import { ContextualHelp } from "@/components/guides/ContextualHelp";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CalendarX } from "lucide-react";

export type DurationUnit = "days" | "weeks" | "months";

interface PlanBookingStepProps {
  car: Car;
  startDate: Date | undefined;
  endDate: Date | undefined;
  onDateRangeChange: (start: Date | undefined, end: Date | undefined) => void;
  pickupLocation: { latitude: number; longitude: number } | null;
  onLocationSelect: (lat: number, lng: number) => void;
  destinationType: DestinationType;
  onDestinationTypeSelect: (type: DestinationType) => void;
  isCheckingAvailability: boolean;
  isAvailable: boolean;
  bookedDates: Date[];
  isDateDisabled: (date: Date) => boolean;
  setIsLocationPickerOpen: (open: boolean) => void;
}

export const PlanBookingStep = ({
  car,
  startDate,
  endDate,
  onDateRangeChange,
  pickupLocation,
  onLocationSelect,
  destinationType,
  onDestinationTypeSelect,
  isCheckingAvailability,
  isAvailable,
  bookedDates,
  isDateDisabled,
  setIsLocationPickerOpen,
}: PlanBookingStepProps) => {
  const [durationUnit, setDurationUnit] = useState<DurationUnit>("days");
  const [durationValue, setDurationValue] = useState<number>(1);
  const [locationType, setLocationType] = useState<string>("car");

  // Sync durationValue if endDate changes from outside (though primarily it flows the other way now)
  useEffect(() => {
    if (startDate && endDate) {
      const days = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
      if (durationUnit === "days") setDurationValue(days);
      else if (durationUnit === "weeks") setDurationValue(Math.max(1, Math.floor(days / 7)));
      else if (durationUnit === "months") setDurationValue(Math.max(1, Math.floor(days / 30)));
    }
  }, [startDate, endDate, durationUnit]);

  const computedEndDate = useMemo(() => {
    if (!startDate) return undefined;
    
    let end: Date;
    switch (durationUnit) {
      case "days":
        end = addDays(startDate, durationValue - 1);
        break;
      case "weeks":
        end = addDays(startDate, (durationValue * 7) - 1);
        break;
      case "months":
        // Use addMonths for better calendar accuracy
        end = addDays(addMonths(startDate, durationValue), -1);
        break;
      default:
        end = startDate;
    }
    return end;
  }, [startDate, durationValue, durationUnit]);

  // Update parent when duration or start date changes
  useEffect(() => {
    if (startDate && computedEndDate) {
      onDateRangeChange(startDate, computedEndDate);
    }
  }, [startDate, computedEndDate, onDateRangeChange]);

  const handleLocationTypeChange = (value: string) => {
    setLocationType(value);
    if (value === "car") {
      onLocationSelect(car.latitude!, car.longitude!);
    } else if (value === "me") {
      // Trigger browser geolocation
      if ("geolocation" in navigator) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            onLocationSelect(position.coords.latitude, position.coords.longitude);
          },
          (error) => {
            console.error("Geolocation error:", error);
          }
        );
      }
    } else if (value === "custom") {
      setIsLocationPickerOpen(true);
    }
  };

  const sliderMax = durationUnit === "days" ? 30 : durationUnit === "weeks" ? 12 : 6;
  const sliderStep = 1;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
      {/* 1. Start Date Selection */}
      <div className="space-y-2">
        <Label className="text-sm font-medium flex items-center gap-2">
          Pick Start Date
          <ContextualHelp helpText="Choose when your trip begins." guideSection="booking" role="renter" />
        </Label>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant={"outline"}
              className={cn(
                "w-full justify-start text-left font-normal h-12",
                !startDate && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {startDate ? format(startDate, "PPP") : <span>Pick a date</span>}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={startDate}
              onSelect={(date) => onDateRangeChange(date, computedEndDate)}
              disabled={isDateDisabled}
              initialFocus
            />
          </PopoverContent>
        </Popover>
      </div>

      {/* 2. Duration Slider */}
      <div className="space-y-4 bg-muted/30 p-4 rounded-xl border border-border/50">
        <div className="flex justify-between items-end">
          <Label className="text-sm font-medium">How long?</Label>
          <div className="flex bg-muted rounded-lg p-0.5">
            {(["days", "weeks", "months"] as DurationUnit[]).map((unit) => (
              <button
                key={unit}
                onClick={() => setDurationUnit(unit)}
                className={cn(
                  "px-3 py-1 text-xs font-medium rounded-md transition-all capitalize",
                  durationUnit === unit
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {unit}
              </button>
            ))}
          </div>
        </div>

        <div className="pt-2 pb-6 px-2">
          <Slider
            value={[durationValue]}
            min={1}
            max={sliderMax}
            step={sliderStep}
            onValueChange={(vals) => setDurationValue(vals[0])}
            className="py-4"
          />
          <div className="flex justify-between mt-2 text-[10px] text-muted-foreground font-medium uppercase tracking-wider">
            <span>1 {durationUnit.slice(0, -1)}</span>
            <span className="text-primary text-sm font-bold normal-case">
              {durationValue} {durationValue === 1 ? durationUnit.slice(0, -1) : durationUnit}
            </span>
            <span>{sliderMax} {durationUnit}</span>
          </div>
        </div>

        {startDate && computedEndDate && (
          <div className="flex items-center justify-center gap-2 text-xs py-2 px-3 bg-background/50 rounded-lg border border-border/50">
            <span className="text-muted-foreground">Ends on</span>
            <span className="font-semibold text-primary">{format(computedEndDate, "EEEE, MMM dd, yyyy")}</span>
          </div>
        )}
      </div>

      {/* 3. Location & Trip Type Selection */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label className="text-sm font-medium">Pickup Point</Label>
          <Select value={locationType} onValueChange={handleLocationTypeChange}>
            <SelectTrigger className="h-12">
              <SelectValue placeholder="Select location" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="car">
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-primary" />
                  <span>Car Location</span>
                </div>
              </SelectItem>
              <SelectItem value="me">
                <div className="flex items-center gap-2">
                  <Locate className="h-4 w-4 text-orange-500" />
                  <span>My Location</span>
                </div>
              </SelectItem>
              <SelectItem value="custom">
                <div className="flex items-center gap-2">
                  <Navigation className="h-4 w-4 text-blue-500" />
                  <span>Set a Location</span>
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label className="text-sm font-medium">Trip Category</Label>
          <Select value={destinationType} onValueChange={(v) => onDestinationTypeSelect(v as DestinationType)}>
            <SelectTrigger className="h-12">
              <SelectValue placeholder="Select trip type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="local">
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-green-500" />
                  <span>Local Trip</span>
                </div>
              </SelectItem>
              <SelectItem value="out_of_zone">
                <div className="flex items-center gap-2">
                  <Navigation className="h-4 w-4 text-orange-500" />
                  <span>Out of Zone</span>
                </div>
              </SelectItem>
              <SelectItem value="cross_border">
                <div className="flex items-center gap-2">
                  <Globe className="h-4 w-4 text-purple-500" />
                  <span>Cross-Border</span>
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Availability Alert */}
      {!isAvailable && startDate && computedEndDate && (
        <Alert variant="destructive" className="bg-destructive/5 border-destructive/20">
          <CalendarX className="h-4 w-4" />
          <AlertDescription className="text-xs">
            This car is already booked for part of this duration. Try different dates or a shorter trip.
          </AlertDescription>
        </Alert>
      )}

      {/* Info helper */}
      <div className="flex gap-2 p-3 bg-blue-50/50 dark:bg-blue-900/10 rounded-lg border border-blue-100 dark:border-blue-900/20 text-[11px] text-blue-700 dark:text-blue-400">
        <Info className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" />
        <p>
          Longer rentals often qualify for automatic discounts. 
          {durationUnit !== "days" && " Weekly and monthly rates are applied automatically."}
        </p>
      </div>
    </div>
  );
};

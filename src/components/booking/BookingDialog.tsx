
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Car } from "@/types/car";
import { AlertCircle, MapPin } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { handleExpiredBookings } from "@/services/bookingService";
import { BookingLocationPicker } from "./BookingLocationPicker";
import { LocationType } from "@/types/booking";

interface BookingDialogProps {
  car: Car;
  isOpen: boolean;
  onClose: () => void;
}

export const BookingDialog = ({ car, isOpen, onClose }: BookingDialogProps) => {
  const [startDate, setStartDate] = useState<Date>();
  const [endDate, setEndDate] = useState<Date>();
  const [isLoading, setIsLoading] = useState(false);
  const [isOwner, setIsOwner] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [isLocationPickerOpen, setIsLocationPickerOpen] = useState(false);
  const [pickupLocation, setPickupLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const { toast } = useToast();
  const navigate = useNavigate();

  // Check if the current user is the car owner
  useEffect(() => {
    const checkAuth = async () => {
      const { data } = await supabase.auth.getSession();
      const currentUserId = data.session?.user?.id;
      setUserId(currentUserId);
      
      if (currentUserId && car.owner_id === currentUserId) {
        setIsOwner(true);
      }
    };
    
    checkAuth();
  }, [car.owner_id]);

  // Check for expired booking requests when the dialog opens
  useEffect(() => {
    if (isOpen) {
      handleExpiredBookings().catch(console.error);
    }
  }, [isOpen]);

  // Set default pickup location from car's location
  useEffect(() => {
    if (car.latitude && car.longitude) {
      setPickupLocation({
        latitude: car.latitude,
        longitude: car.longitude
      });
    }
  }, [car]);

  const createNotification = async (
    userId: string,
    type: "booking_request",
    content: string,
    carId: string,
    bookingId: string
  ) => {
    console.log("Creating notification:", {
      userId,
      type,
      content,
      carId,
      bookingId,
    });
    const { error } = await supabase.from("notifications").insert({
      user_id: userId,
      type,
      content,
      related_car_id: carId,
      related_booking_id: bookingId,
    });

    if (error) {
      console.error("Error creating notification:", error);
      throw error;
    }
  };

  const handleBooking = async () => {
    // Prevent car owners from booking their own cars
    if (isOwner) {
      toast({
        title: "Not allowed",
        description: "You cannot book your own car",
        variant: "destructive",
      });
      return;
    }

    if (!startDate || !endDate) {
      toast({
        title: "Error",
        description: "Please select both start and end dates",
        variant: "destructive",
      });
      return;
    }

    if (!pickupLocation) {
      toast({
        title: "Error",
        description: "Please select a pickup location",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const { data: session } = await supabase.auth.getSession();
      if (!session.session?.user) throw new Error("No authenticated user");

      const numberOfDays = Math.ceil(
        (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
      );
      const totalPrice = numberOfDays * car.price_per_day;

      // Create the booking
      const { data: booking, error: bookingError } = await supabase
        .from("bookings")
        .insert({
          car_id: car.id,
          renter_id: session.session.user.id,
          start_date: format(startDate, "yyyy-MM-dd"),
          end_date: format(endDate, "yyyy-MM-dd"),
          total_price: totalPrice,
          pickup_latitude: pickupLocation.latitude,
          pickup_longitude: pickupLocation.longitude
        })
        .select()
        .single();

      if (bookingError) throw bookingError;

      // Create notification for renter
      await createNotification(
        session.session.user.id,
        "booking_request",
        `Your booking request for ${car.brand} ${car.model} from ${format(
          startDate,
          "PPP"
        )} to ${format(endDate, "PPP")} has been submitted.`,
        car.id,
        booking.id
      );

      // Create notification for host
      await createNotification(
        car.owner_id,
        "booking_request",
        `New booking request received for your ${car.brand} ${
          car.model
        } from ${format(startDate, "PPP")} to ${format(endDate, "PPP")}.`,
        car.id,
        booking.id
      );

      toast({
        title: "Success",
        description: "Your booking request has been submitted!",
      });

      onClose();
      navigate("/bookings");
    } catch (error) {
      console.error("Booking error:", error);
      toast({
        title: "Error",
        description: "Failed to create booking. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleLocationSelected = (lat: number, lng: number) => {
    setPickupLocation({
      latitude: lat,
      longitude: lng
    });
  };

  const formatLocationDescription = () => {
    if (!pickupLocation) return "No location selected";
    
    if (
      pickupLocation.latitude === car.latitude && 
      pickupLocation.longitude === car.longitude
    ) {
      return `Default: ${car.location}`;
    }
    
    return `Custom location (${pickupLocation.latitude.toFixed(4)}, ${pickupLocation.longitude.toFixed(4)})`;
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-[425px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Book {car.brand} {car.model}
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Select your rental dates and pickup location
            </DialogDescription>
          </DialogHeader>
          
          {isOwner && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Not allowed</AlertTitle>
              <AlertDescription>
                You cannot book your own car. This is for other renters only.
              </AlertDescription>
            </Alert>
          )}
          
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <h4 className="font-medium">Select dates</h4>
              <Calendar
                mode="range"
                selected={{
                  from: startDate,
                  to: endDate,
                }}
                onSelect={(range) => {
                  setStartDate(range?.from);
                  setEndDate(range?.to);
                }}
                numberOfMonths={1}
                disabled={(date) => {
                  const tomorrow = new Date();
                  tomorrow.setDate(tomorrow.getDate());
                  tomorrow.setHours(0, 0, 0, 0);
                  return date < tomorrow;
                }}
              />
            </div>
            
            <div className="space-y-2">
              <h4 className="font-medium">Pickup Location</h4>
              <div className="flex items-center justify-between p-3 border rounded-md">
                <div className="flex items-start gap-2">
                  <MapPin className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                  <div className="text-sm">
                    <p>{formatLocationDescription()}</p>
                  </div>
                </div>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setIsLocationPickerOpen(true)}
                >
                  Change
                </Button>
              </div>
            </div>
            
            {startDate && endDate && (
              <div className="space-y-2">
                <h4 className="font-medium">Summary</h4>
                <div className="text-sm space-y-1 p-4 bg-primary/5 rounded-md">
                  <p>Start date: {format(startDate, "PPP")}</p>
                  <p>End date: {format(endDate, "PPP")}</p>
                  <div className="border-t border-border pt-2 mt-2">
                    <p className="font-medium text-primary">
                      Total: BWP{" "}
                      {Math.ceil(
                        (endDate.getTime() - startDate.getTime()) /
                          (1000 * 60 * 60 * 24)
                      ) * car.price_per_day}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
          <div className="flex flex-col sm:flex-row justify-end gap-2">
            <Button variant="outline" onClick={onClose} className="w-full sm:w-auto">
              Cancel
            </Button>
            <Button
              onClick={handleBooking}
              disabled={!startDate || !endDate || isLoading || isOwner || !pickupLocation}
              className="w-full sm:w-auto"
            >
              {isLoading ? "Booking..." : "Confirm"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      
      <BookingLocationPicker 
        isOpen={isLocationPickerOpen}
        onClose={() => setIsLocationPickerOpen(false)}
        onLocationSelected={handleLocationSelected}
      />
    </>
  );
};

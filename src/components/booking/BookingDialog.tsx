import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Car } from "@/types/car";

interface BookingDialogProps {
  car: Car;
  isOpen: boolean;
  onClose: () => void;
}

export const BookingDialog = ({ car, isOpen, onClose }: BookingDialogProps) => {
  const [startDate, setStartDate] = useState<Date>();
  const [endDate, setEndDate] = useState<Date>();
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const createNotification = async (userId: string, type: 'booking_request', content: string, carId: string, bookingId: string) => {
    console.log("Creating notification:", { userId, type, content, carId, bookingId });
    const { error } = await supabase
      .from("notifications")
      .insert({
        user_id: userId,
        type,
        content,
        related_car_id: carId,
        related_booking_id: bookingId
      });

    if (error) {
      console.error("Error creating notification:", error);
      throw error;
    }
  };

  const handleBooking = async () => {
    if (!startDate || !endDate) {
      toast({
        title: "Error",
        description: "Please select both start and end dates",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const { data: session } = await supabase.auth.getSession();
      if (!session.session?.user) throw new Error("No authenticated user");

      const numberOfDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
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
        })
        .select()
        .single();

      if (bookingError) throw bookingError;

      // Create notification for renter
      await createNotification(
        session.session.user.id,
        'booking_request',
        `Your booking request for ${car.brand} ${car.model} from ${format(startDate, "PPP")} to ${format(endDate, "PPP")} has been submitted.`,
        car.id,
        booking.id
      );

      // Create notification for host
      await createNotification(
        car.owner_id,
        'booking_request',
        `New booking request received for your ${car.brand} ${car.model} from ${format(startDate, "PPP")} to ${format(endDate, "PPP")}.`,
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

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Book {car.brand} {car.model}</DialogTitle>
        </DialogHeader>
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
              disabled={(date) => date < new Date()}
            />
          </div>
          {startDate && endDate && (
            <div className="space-y-2">
              <h4 className="font-medium">Summary</h4>
              <div className="text-sm space-y-1">
                <p>Start date: {format(startDate, "PPP")}</p>
                <p>End date: {format(endDate, "PPP")}</p>
                <p className="font-medium">
                  Total: BWP {Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) * car.price_per_day}
                </p>
              </div>
            </div>
          )}
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleBooking} disabled={!startDate || !endDate || isLoading}>
            {isLoading ? "Booking..." : "Confirm"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Navigation } from "@/components/Navigation";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { BookingTable } from "@/components/booking/BookingTable";
import { format } from "date-fns";
import { Booking } from "@/types/booking";

const Bookings = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: bookings, isLoading } = useQuery({
    queryKey: ["bookings"],
    queryFn: async () => {
      console.log("Fetching user bookings");
      const { data, error } = await supabase
        .from("bookings")
        .select(`
          *,
          cars (
            brand,
            model,
            image_url,
            owner_id
          )
        `)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching bookings:", error);
        throw error;
      }

      console.log("Bookings fetched:", data);
      return data as Booking[];
    },
  });

  const createCancellationNotifications = async (booking: Booking) => {
    const { data: session } = await supabase.auth.getSession();
    if (!session.session?.user) return;

    await supabase.from("notifications").insert([
      {
        user_id: booking.cars.owner_id,
        type: "booking_cancelled",
        content: `Booking for ${booking.cars.brand} ${booking.cars.model} from ${format(new Date(booking.start_date), "PPP")} to ${format(new Date(booking.end_date), "PPP")} has been cancelled.`,
        related_car_id: booking.car_id,
        related_booking_id: booking.id
      },
      {
        user_id: session.session.user.id,
        type: "booking_cancelled",
        content: `Your booking for ${booking.cars.brand} ${booking.cars.model} from ${format(new Date(booking.start_date), "PPP")} to ${format(new Date(booking.end_date), "PPP")} has been cancelled.`,
        related_car_id: booking.car_id,
        related_booking_id: booking.id
      }
    ]);
  };

  const handleCancelBooking = async (bookingId: string) => {
    try {
      const bookingToCancel = bookings?.find(b => b.id === bookingId);
      if (!bookingToCancel) return;

      // Update in Supabase first
      const { error: updateError } = await supabase
        .from("bookings")
        .update({ status: "cancelled" })
        .eq("id", bookingId);

      if (updateError) {
        console.error("Error updating booking:", updateError);
        throw updateError;
      }

      // Create notifications about the cancellation
      await createCancellationNotifications(bookingToCancel);

      // Invalidate the query to refetch fresh data
      await queryClient.invalidateQueries({ queryKey: ["bookings"] });

      toast({
        title: "Success",
        description: "Booking cancelled successfully",
      });
    } catch (error) {
      console.error("Error cancelling booking:", error);
      toast({
        title: "Error",
        description: "Failed to cancel booking",
        variant: "destructive",
      });
      // Refetch to ensure UI shows correct state
      queryClient.invalidateQueries({ queryKey: ["bookings"] });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container py-4 space-y-4">
          <h1 className="text-2xl font-bold">My Bookings</h1>
          <div className="space-y-2">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        </div>
        <Navigation />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container py-4 space-y-4">
        <h1 className="text-2xl font-bold">My Bookings</h1>
        <BookingTable bookings={bookings} onCancelBooking={handleCancelBooking} />
      </div>
      <Navigation />
    </div>
  );
};

export default Bookings;